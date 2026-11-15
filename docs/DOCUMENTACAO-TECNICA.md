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
| Leitura de PDF e prints | Google Gemini | modelos flash |
| Hospedagem | GitHub Pages (publica a branch `main`) | — |
| App instalável | Manifest + service worker | cache v17 |

## Módulos dentro do `index.html`

| Módulo | Responsabilidade |
| --- | --- |
| `ICONS` e `ic()` | Ícones SVG (o app não usa emoji) |
| Datas e feriados | `getBrazilianHolidays(ano)` (Páscoa por Meeus/Jones/Butcher, feriados móveis, RJ opcional) e `resolveDay()` para as regras de dia útil |
| Estado `S` | Todos os dados da pessoa; salvo no aparelho e na nuvem |
| `occurrences(m)` | O que cai num mês: únicos, recorrentes, parcelas, dívidas simuladas, desafio e reembolsos |
| `project()` | O motor: meses com dias, totais por bloco e saldo final em cascata |
| `fatEntries()`, `fatInfo()` | Faturas de cartão: baixa total ou parcial, parte que vai para o mês seguinte e saldo anterior em aberto |
| `transfersIn()`, `xferPairs()` | Transferências entre contas próprias e sugestão de juntar saída e entrada iguais |
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
5b. **Histórico importado** (`hist`): lançamentos importados de meses anteriores ao atual ficam só como registro. Aparecem na lista e na divisão por categoria, mas o motor não os usa em saldo de dia ou de mês, nem para recuar a data de início da conta.
5a. **Âncora do saldo** (`settings.anchor = {m, start}`): o início do mês em que você informou o saldo real fica fixo. O motor calcula normalmente e desloca todos os meses pela diferença, então lançamentos de meses anteriores mudam só o histórico, nunca o saldo de hoje. A âncora muda ao salvar o saldo em Ajustes, ao preencher "Quanto você tem hoje" ou ao usar o saldo de um extrato importado.
6. O teto seguro por dia é o menor entre: o que dá para gastar até o próximo recebimento e o que dá até o fim do mês sem nenhum dia ficar negativo.
7. **Transferências** (`kind: "transfer"`) ficam fora de `occurrences()`: não entram em entradas, saídas, blocos nem no teto. Aparecem na lista e no calendário com ⇄.
8. **Pendente × pago:** o que está pendente continua descontando da sobra prevista; "Já saiu" soma só o que está pago.
9. **Faturas:** as compras no cartão já caem no dia de vencimento. Sem registro em `faturas`, cada compra segue o próprio pago/pendente. Ao dar baixa parcial (ou "não paguei"), o motor cria duas linhas automáticas: no mês, um ajuste negativo com o que não foi pago; no mês seguinte, o "saldo em aberto da fatura anterior" (com juros, se informados). As duas ficam fora dos blocos 50/30/20. O pagamento da fatura nunca vira uma saída a mais: as compras de dentro dela já são a saída.

## Importação e conciliação

1. **Enviar:** CSV (detecta separador, colunas e formato de número), OFX, PDF ou até 8 prints (JPG, PNG, WebP, HEIC). Prints com mais de 1,2 MB são reduzidos no aparelho para JPEG de até 1400 px de largura.
2. **Ler:** o PDF ou os prints vão para a função `pdf-import`, que trata vários prints como partes do mesmo documento (sem repetir o que aparece em dois) e converte "Hoje" e "Ontem" em datas. Ela devolve data, descrição, valor, bloco, parcela, fechamento, vencimento e total.
3. **Revisar:** cada linha é comparada com o que estava previsto e não pago (mesmo valor, até 5 dias de diferença) para conciliar. Se já existe algo pago com valor quase igual (1% ou R$ 0,50) até 3 dias de distância, aparece "parece já lançado", com a opção de mesclar. O "Pagamento recebido" da fatura dá baixa na fatura anterior (total ou parcial, e o resto vai para o mês seguinte). No extrato da conta, o pagamento de uma fatura (pela descrição ou pelo valor igual ao total) também vira baixa, não saída nova. Uma saída e uma entrada de mesmo valor entre duas contas suas, até 2 dias de diferença, vira transferência.
3a. **Saldo no arquivo:** linhas de saldo ("Saldo anterior", "disponível", "do dia", "total"...) saem da lista e nunca contam como saída; o saldo mais recente (ou o `saldo` devolvido pela IA) aparece com a pergunta "Usar como o meu saldo de hoje".
4. Cada linha importada ganha uma chave (`importKey`); importar o mesmo arquivo de novo não duplica.
5. **Cartão (Open Finance, CSV, OFX, PDF ou print):** a compra vai para a fatura em que o banco cobra (pelo `billId` da Pluggy e o vencimento da fatura; senão pelo fechamento cadastrado; senão estimando o fechamento 7 dias antes do vencimento) e entra **pendente**. Ela só vira paga quando a fatura recebe baixa (manual, "Pagamento recebido" na fatura ou pagamento identificado no extrato da conta).
6. **Parceladas:** a parcela vem do `creditCardMetadata` da Pluggy (`installmentNumber`, `totalInstallments`) ou da descrição ("01/10", "PARC 3/10", "Parcela 1 de 5"; um "05/11" igual ao dia e mês da compra é tratado como data). A parcela atual cai na fatura do mês e as restantes ficam projetadas como uma compra parcelada (`k0` e `ofN` guardam a numeração do banco). Na sincronização seguinte, a parcela que chega do banco é conciliada com a projetada (mesmo cartão, mesmo número de parcela, valor com até R$ 0,05 de diferença), sem duplicar. Várias parcelas da mesma compra no mesmo arquivo criam uma compra só.

## Funções no servidor

| Função | Entrada | Saída |
| --- | --- | --- |
| `open-finance` | Token de login; ação `ping`, `accounts` ou `transactions` com período | Contas e transações das conexões do Meu Pluggy |
| `pdf-import` | Token de login; `files` = lista de `{data, mime}` em base64 (1 PDF ou até 8 imagens, cerca de 10 MB no total); o formato antigo `pdf` continua aceito | JSON com banco, tipo, fechamento, vencimento, total e transações |

As duas exigem login válido e respondem só ao usuário definido no segredo `OWNER_ID`.

## Testes

Não há suíte automatizada no repositório. Cada versão foi testada com Playwright num iPhone e num Android simulados e numa tela de 1280 px: troca de telas, gesto, simulador, edição rápida, importação completa, cliques em todos os botões visíveis e ausência de rolagem lateral.
