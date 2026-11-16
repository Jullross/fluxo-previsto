-- =====================================================================
-- Fluxo Previsto · banco de dados no Supabase
-- Cole tudo no SQL Editor do Supabase e clique em "Run".
-- Cada pessoa tem UMA linha com todos os seus dados (lançamentos,
-- cartões, dívidas, desafios) em JSON. O Row Level Security garante
-- que cada usuário só consegue ler e alterar a própria linha.
-- =====================================================================

create table if not exists public.fluxo_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.fluxo_data is 'Dados do Fluxo Previsto, uma linha por usuário.';

-- Liga o Row Level Security: sem política, ninguém acessa nada
alter table public.fluxo_data enable row level security;

-- Visitantes não logados não têm nenhum acesso
revoke all on public.fluxo_data from anon;
grant select, insert, update, delete on public.fluxo_data to authenticated;

-- Remove versões antigas das políticas (permite rodar o script de novo)
drop policy if exists "fluxo: dono lê"      on public.fluxo_data;
drop policy if exists "fluxo: dono cria"    on public.fluxo_data;
drop policy if exists "fluxo: dono atualiza" on public.fluxo_data;
drop policy if exists "fluxo: dono apaga"   on public.fluxo_data;

-- Cada usuário só enxerga a própria linha
create policy "fluxo: dono lê" on public.fluxo_data
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Só pode criar a linha com o próprio id
create policy "fluxo: dono cria" on public.fluxo_data
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Só pode alterar a própria linha, e não pode trocar o dono
create policy "fluxo: dono atualiza" on public.fluxo_data
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Só pode apagar a própria linha
create policy "fluxo: dono apaga" on public.fluxo_data
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Atualiza updated_at automaticamente quando o app não enviar a data
create or replace function public.fluxo_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.updated_at is null or new.updated_at = old.updated_at then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists fluxo_touch on public.fluxo_data;
create trigger fluxo_touch before update on public.fluxo_data
  for each row execute function public.fluxo_touch_updated_at();

-- Tempo real: avisa os outros aparelhos do mesmo usuário quando os dados mudam
-- (o Realtime respeita o RLS: cada pessoa só recebe avisos da própria linha)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fluxo_data') then
    alter publication supabase_realtime add table public.fluxo_data;
  end if;
end $$;

-- =====================================================================
-- Backup de versões e trava contra cópia antiga (v29)
-- Cada versão anterior fica em fluxo_backup (últimas 60 por usuário).
-- Uma gravação com settings.rev menor ou igual ao da nuvem é recusada.
-- =====================================================================
create table if not exists public.fluxo_backup (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  data jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists fluxo_backup_user_idx on public.fluxo_backup (user_id, id desc);
alter table public.fluxo_backup enable row level security;
revoke all on public.fluxo_backup from anon;
revoke all on public.fluxo_backup from authenticated;
grant select on public.fluxo_backup to authenticated;
drop policy if exists "backup: dono lê" on public.fluxo_backup;
create policy "backup: dono lê" on public.fluxo_backup for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.fluxo_guard_and_backup()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_rev bigint; new_rev bigint;
begin
  old_rev := nullif(old.data->'settings'->>'rev','')::bigint;
  new_rev := nullif(new.data->'settings'->>'rev','')::bigint;
  if old_rev is not null and (new_rev is null or new_rev <= old_rev) then
    raise exception 'stale_write: a versão enviada (%) é mais antiga que a da nuvem (%)', coalesce(new_rev,0), old_rev using errcode = 'P0001';
  end if;
  insert into public.fluxo_backup (user_id, data, saved_at) values (old.user_id, old.data, old.updated_at);
  delete from public.fluxo_backup b where b.user_id = old.user_id
    and b.id not in (select x.id from public.fluxo_backup x where x.user_id = old.user_id order by x.id desc limit 60);
  return new;
end;
$$;
revoke all on function public.fluxo_guard_and_backup() from public, anon, authenticated;
drop trigger if exists fluxo_guard_and_backup on public.fluxo_data;
create trigger fluxo_guard_and_backup before update on public.fluxo_data
  for each row execute function public.fluxo_guard_and_backup();
