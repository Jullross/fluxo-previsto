# Histórico de versões

| Versão | Data | O que mudou |
| --- | --- | --- |
| v26 | 15/11/2026 | Fatura em PDF ou print: todos os lançamentos entram no vencimento do documento (não na data da compra); parcelas lidas da IA ("7/7", "5/12") viram parceladas; fechamento e vencimento do cartão atualizados pelo documento |
| v25 | 15/11/2026 | Conferir saldo com os bancos: saldo de cada conta (digitado, do Open Finance ou do extrato importado), soma, diferença para o app e ajuste com um toque; aviso no sino quando não bate |
| v24 | 15/11/2026 | Importações de meses passados viram só registro (não mudam saldo de hoje, de dias ou de meses passados, nem a data de início da conta); revisão do cartão com Fechamento e Vencimento num card só e o total em destaque com lançamentos e parcelados |
| v23 | 15/11/2026 | Revisão: sai o bloco de impacto e "Saídas no arquivo" (ou "Total da fatura") vira o destaque; linhas de saldo nunca entram como gasto e o saldo do arquivo pode virar o saldo de hoje; âncora do saldo: lançamentos de meses anteriores não mudam mais o "Quanto eu tenho hoje"; campo "Quanto você tem hoje" em Ajustes |
| v22 | 15/11/2026 | Revisão da importação mostra o impacto no saldo do mês da fatura (antes e depois), em tempo real ao marcar e desmarcar, em vermelho se o mês ficar negativo |
| v21 | 15/11/2026 | Cartão no Open Finance: compras entram na fatura certa e pendentes (não mais pagas); parcelas lidas do banco ou da descrição, com as próximas projetadas e conciliadas na sincronização seguinte; correção automática das compras já importadas |
| v20 | 15/11/2026 | Hospedagem passa do Netlify para o GitHub Pages (publica a cada envio para a `main`, sem custo); página 404 que volta para o app |
| v19 | 13/11/2026 | Transferência entre contas próprias (não conta como entrada nem saída), status Pendente ou Pago no lançamento, faturas de cartão com baixa total ou parcial, saldo em aberto no mês seguinte e juros opcionais; importação dá baixa na fatura em vez de ignorar o pagamento |
| v18 | 13/11/2026 | A IA lê prints em JPG e PNG (até 8 de uma vez), além de PDF |
| v17 | 11/11/2026 | Login novo: cabe na tela do celular, abas Entrar e Criar conta, "Esqueci minha senha" como link |
| v16 | 11/11/2026 | Movimento suave em todo clique; importação de faturas em 3 etapas com resumo, barras por bloco e tabela nova; celular minimalista |
| v15 | 11/11/2026 | Início estilo app de banco, resumo ao vivo no Gastei, parcelas e blocos em botões, gesto que acompanha o dedo |
| v14 | 11/11/2026 | Celular em 5 telas com gesto, topo fixo, meses sem barra de anos, alertas em janela, `_redirects` |
| v13 | 11/11/2026 | Animações do Desafio, abas recolhíveis, simulação ao vivo, parcelado mês a mês, peso no fim de semana, edição rápida, modo privacidade, aviso de duplicidade |
| v12 | 10/11/2026 | Importação de PDF com IA |
| v1 a v11 | até 10/11/2026 | Projeção em cascata, blocos do Breno, termômetro, calendário, dívidas, desafio, cartões de família, importação CSV/OFX, nuvem multiusuário, PWA, feriados e dias úteis, documentos legais, Open Finance |

## Próximos passos

- Content-Security-Policy no `_headers`
- Testes automatizados do motor de projeção
- Separar o `index.html` em módulos, se o projeto crescer
- Notificações de vencimento no celular
