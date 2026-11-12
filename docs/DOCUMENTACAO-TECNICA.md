# Documentação técnica

O app inteiro roda no navegador, num único `index.html` em JavaScript puro, sem etapa de build. O servidor só guarda os dados e faz duas tarefas que precisam de chave secreta.

## Tecnologias

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Interface | HTML, CSS e JavaScript puro (um IIFE) | — |
| Estilo | Tailwind pelo CDN + CSS próprio com variáveis de tema | 3.4.17 |
| Fontes | Bricolage Grotesque, Figtree, IBM Plex Mono | — |
| Relatório em PDF | jsPDF + AutoTable | 2.5.1 / 3.5.31 |
| Login, banco e tempo real | Supabase JS | 2.45.4 |
| Funções no servidor | Supabase Edge Functions (Deno, TypeScript) | — |
| Open Finance | Pluggy API (Meu Pluggy) | transações v2 |
| Leitura de PDF | Google Gemini | modelos flash |
| Hospedagem | Netlify | — |
| App instalável | Manifest + service worker | cache v17 |

## Módulos dentro do `index.html`

| Módulo | Responsabilidade |
| --- | --- |
| `ICONS` e `ic()` | Ícones SVG (o app não usa emoji) |
| Datas e feriados | `getBrazilianHolidays(ano)` (Páscoa por Meeus/Jones/Butcher, feriados móveis, RJ opcional) e `resolveDay()` para as regras de dia útil |
| Estado `S` | Todos os dados da pessoa; salvo no aparelho e na nuvem |
| `occurrences(m)` | O que cai num mês: únicos, recorrentes, parcelas, dívidas simuladas, desafio e reembolsos |
| `project()` | O motor: meses com dias, totais por bloco e saldo final em cascata |
| `health()` | Termômetro: nível, teto seguro por dia, menor saldo à frente, plano de caixa |
| Telas | `renderHero`, `renderMHome`, `renderMonth`, `renderCal`, `renderDebts`, `renderChallenge`, `renderChart`, `renderSim` |
| Importação `IM` | `parseCSV`, `parseOFX`, `readPdfAI`, `buildRows`, `renderPreview`, `doImport` |
| `OF` e `PDFI` | Chamadas às funções do servidor, visíveis só para a dona |
| `AuthService`, `DatabaseService`, `Sync`, `Live` | Login, leitura e gravação, fila de sincronização e tempo real |
| Celular | `setScreen()`, gestos, barra inferior, 5 telas |

## Motor de projeção

1. Os meses vão de jan/2025 até o mais distante entre dez/2028, 12 meses à frente e o último mês aberto.
2. A conta começa no mês de partida (`baseMonth`) ou no mês do lançamento mais antigo, o que vier antes. Meses anteriores ficam zerados, nunca negativos.
3. Em cada mês: saldo inicial = saldo final do mês anterior; entradas e saídas são aplicadas dia a dia.
4. Cada lançamento cai no dia ajustado por `resolveDay()`: dia fixo, 5º dia útil, 5º dia útil CLT, último dia útil, ou antecipar/adiar em feriado e fim de semana.
5. "Tenho hoje" conta só o que já foi marcado como pago ou recebido.
6. O teto seguro por dia é o menor entre: o que dá para gastar até o próximo recebimento e o que dá até o fim do mês sem nenhum dia ficar negativo.

## Importação e conciliação

1. **Enviar:** CSV (detecta separador, colunas e formato de número), OFX ou PDF.
2. **Ler:** o PDF vai para a função `pdf-import`, que devolve data, descrição, valor, bloco, parcela, fechamento, vencimento e total.
3. **Revisar:** cada linha é comparada com o que estava previsto e não pago (mesmo valor, até 5 dias de diferença) para conciliar. Se já existe algo pago com valor quase igual (1% ou R$ 0,50) até 3 dias de distância, aparece "parece já lançado", com a opção de mesclar. O pagamento da própria fatura é ignorado.
4. Cada linha importada ganha uma chave (`importKey`); importar o mesmo arquivo de novo não duplica.

## Funções no servidor

| Função | Entrada | Saída |
| --- | --- | --- |
| `open-finance` | Token de login; ação `ping`, `accounts` ou `transactions` com período | Contas e transações das conexões do Meu Pluggy |
| `pdf-import` | Token de login; PDF em base64 (até cerca de 10 MB) | JSON com banco, tipo, fechamento, vencimento, total e transações |

As duas exigem login válido e respondem só ao usuário definido no segredo `OWNER_ID`.

## Testes

Não há suíte automatizada no repositório. Cada versão foi testada com Playwright num iPhone e num Android simulados e numa tela de 1280 px: troca de telas, gesto, simulador, edição rápida, importação completa, cliques em todos os botões visíveis e ausência de rolagem lateral.
