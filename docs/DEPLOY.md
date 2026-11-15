# Deploy e operação

O app fica no GitHub Pages: cada envio para a branch `main` publica sozinho, de graça. O resto é configurado uma vez.

## Publicar uma versão nova

1. Troque `const CACHE = 'fluxo-previsto-v26'` no `sw.js` pelo número seguinte.
2. Envie para a branch `main` (commit e push). Em 1 ou 2 minutos o GitHub Pages publica em https://jullross.github.io/fluxo-previsto/.
3. Na próxima abertura, o app instalado baixa a versão nova.

## Configuração feita uma vez

0. **GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / `(root)`.
1. **Supabase:** crie um projeto e rode [`supabase-schema.sql`](../supabase-schema.sql) no SQL Editor.
2. **Chaves públicas:** cole a Project URL e a chave **anon** no bloco `CONFIG` do `index.html`.
3. **URLs:** em Authentication → URL Configuration, coloque o endereço publicado em Site URL e Redirect URLs.
4. **Google (opcional):** credencial OAuth "Aplicativo da Web" com o redirecionamento `https://<seu-projeto>.supabase.co/auth/v1/callback`; Client ID e Client Secret em Authentication → Providers → Google.
5. **Funções (opcional):** publique `supabase/functions/open-finance` e `pdf-import` e cadastre os segredos abaixo.

| Segredo | Para quê |
| --- | --- |
| `OWNER_ID` | ID do usuário que pode usar as duas funções |
| `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET` | Credenciais da aplicação no Pluggy |
| `PLUGGY_ITEM_IDS` | IDs das conexões do Meu Pluggy, separados por vírgula |
| `GEMINI_API_KEY` | Chave do Google AI Studio, sem faturamento |

Sem `OWNER_ID`, as duas funções recusam todo mundo.

## Solução de problemas

| Sintoma | Causa mais comum | O que fazer |
| --- | --- | --- |
| Google: "Unable to exchange external code" | Client Secret errado ou expirado | Gerar um novo no Google e colar no Supabase |
| Voltou do Google para uma página estranha | Site URL com texto a mais | Deixar só o endereço do app |
| Open Finance: "clientId must be a UUID" | Nome do segredo no lugar do valor | Colar só o valor |
| Open Finance: contas vazias | Conexão sincronizando ou conector de teste | Usar conectores do Meu Pluggy e esperar |
| PDF ou print: "falta cadastrar a chave" | `GEMINI_API_KEY` ausente | Criar a chave e salvar como segredo |
| PDF, print ou Open Finance: 403 | `OWNER_ID` ausente ou diferente | Conferir o segredo `OWNER_ID` |
| Print: "ainda não aceita prints" | Função `pdf-import` antiga no Supabase | Publicar a versão atual da função |
| Celular não mostra a versão nova | Cache antigo | Conferir o número do `CACHE`; fechar e abrir o app |
| Saldo negativo antes do primeiro mês | Mês de partida errado | Conferir "Mês de partida" e "Saldo inicial" em Ajustes |
