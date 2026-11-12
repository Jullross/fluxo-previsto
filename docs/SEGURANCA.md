# Segurança e privacidade

Cada pessoa só consegue ler e alterar a própria linha do banco, e nenhum segredo fica no navegador.

## Proteções

| Camada | Proteção |
| --- | --- |
| Banco | Row Level Security em `fluxo_data`: as 4 políticas exigem `auth.uid() = user_id`; o papel `anon` não tem acesso |
| Login | Supabase Auth com e-mail e senha e Google OAuth; recuperação de senha por link |
| Chave no navegador | Só a chave **anon**, pública por natureza. A `service_role` não é usada |
| Segredos | Pluggy, conexões, Gemini e `OWNER_ID` ficam em Edge Functions → Secrets |
| Funções restritas | `open-finance` e `pdf-import` exigem login válido e respondem só ao `OWNER_ID`; os demais recebem 403 |
| CORS das funções | Só o domínio publicado e `localhost:8000` |
| Transporte | HTTPS (Netlify e Supabase) e HSTS |
| Cabeçalhos | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` sem câmera, microfone, localização e pagamento |
| No aparelho | Cópia em `localStorage` para funcionar offline; Sair limpa a sessão |
| Na tela | Modo privacidade embaralha todos os valores em R$ |

## LGPD

- [Política de Privacidade](../privacidade.html) e [Termos de Uso](../termos.html) publicados e linkados na tela de entrada.
- Dados coletados: nome, e-mail e o que a pessoa cadastra. Sem venda de dados, sem anúncios, sem rastreadores.
- Apagar a conta apaga a linha junto (`on delete cascade`).
- A leitura de PDF usa o Gemini no plano gratuito, em que o Google pode usar o conteúdo para melhorar os produtos. Por isso a função é restrita e o aviso está na política.

## O que nunca vai para o repositório

Chaves do Pluggy, IDs das conexões bancárias, chave do Gemini, Client Secret do Google, chave `service_role`, senhas e tokens, e qualquer dado financeiro real. O `.gitignore` bloqueia `.env` e arquivos `.zip`.

## Melhorias previstas

- Content-Security-Policy com as origens dos CDNs.
- Criptografia da cópia local para aparelhos compartilhados.

Para relatar uma falha de segurança, use o contato que está nos [Termos de Uso](../termos.html).
