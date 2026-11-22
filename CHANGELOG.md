# Histórico de versões

| Versão | Data | O que mudou |
| --- | --- | --- |
| v40 | 22/11/2026 | Descrição com lista de sugestões no visual do app (nome limpo, quantas vezes usou, conta e último valor; setas e Enter no computador) no lugar da lista do navegador; seletor de mês próprio (ano com setas, 12 meses, "Este mês") em Começa em, Último mês e Mês de partida |
| v39 | 22/11/2026 | Fatura mostra sempre o total cobrado pelo banco, incluindo compras de outras pessoas, com a linha "Inclui (pessoa) (reembolso previsto)"; compra parcelada importada com parcelas daqui para frente não vira histórico |
| v38 | 22/11/2026 | Fatura em PDF: fechamento e vencimento do documento só mudam o cartão quando fazem sentido juntos (uma data de emissão não vira mais o fechamento); extrato em aberto sem vencimento vai inteiro para a fatura que fecha depois da última compra, em vez de espalhar parcelas e compras antigas pelos meses da compra |
| v37 | 22/11/2026 | Lançamento: a descrição pode ser escrita ou escolhida entre os nomes que você já usou (sugestões que filtram enquanto digita); escolher um nome já usado traz classificação, conta, forma e valor da última vez. Valores em reais com a vírgula automática: digite só os números (1234 → 12,34) |
| v36 | 22/11/2026 | Calendário antes do mês de partida: não repete mais o saldo do mês de partida; cada dia mostra "—" ou o histórico importado (ex.: +2.000 hist.), e o dia aberto lista esses lançamentos. Na faixa de meses, esses meses mostram "—" |
| v35 | 22/11/2026 | Assistente lança pelo chat: peça ("lança 45 de mercado ontem no Swile") ou cole um extrato; ele separa os lançamentos e o app abre a revisão da importação (com a proteção contra duplicados) para confirmar. Revisão da importação sem números quebrados no celular |
| v33 | 17/11/2026 | Desafio do mês: aplicações e aportes de verdade (categoria Metas e aportes, saindo da conta) contam como depósito do desafio; o Cofre do Desafio diminui o que já foi aplicado e o mesmo dinheiro não sai duas vezes |
| v31 | 16/11/2026 | Faturas de Cartão: "Ver os lançamentos desta fatura" com editar e excluir (parcelado: compra inteira; recorrente: parar a partir do mês ou excluir de todos); Assistente de IA (ícone ✦ e Mais → Assistente) que responde com os números do app, pela função `assistant` do Supabase com o Gemini |
| v30 | 16/11/2026 | Celular: gesto de trocar de tela só com movimento bem horizontal (rolagem vertical não troca mais de aba); Início com o saldo de hoje em destaque e a sobra do mês embaixo, com cores; Gastei mostra também o saldo de hoje antes e depois; meses antes do mês de partida somem da faixa; lançamentos de histórico com título próprio; Conferir saldo, Ajustes, Calendário, Entradas/Saídas, Minha conta e o botão + Lançamento sem textos quebrados |
| v29 | 15/11/2026 | Correção de sincronização: aparelho com cópia antiga não sobrescreve mais a nuvem (nada é gravado antes de sincronizar; a nuvem vence quando mudou em outro aparelho; o banco recusa versões mais antigas pelo número de revisão); backup automático das últimas 60 versões no Supabase |
| v28 | 15/11/2026 | Simulador "No cartão": escolhe o cartão e 1x a 12x, a compra cai na fatura certa pelo fechamento, mostra cada fatura antes e depois, e avisa que o saldo de hoje não muda até o vencimento |
| v27 | 15/11/2026 | Editar lançamento permite trocar o tipo (único → recorrente ou parcelado e vice-versa); recorrente com dia ou valor que variam é conciliado pelo nome (até 15 dias e 15%) e a previsão segue o valor novo |
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
