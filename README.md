# Ferramenta 10 — Análise de Excedente Financeiro

Aplicação educacional do Hub de Inteligência Financeira para Empreendedores. Primeira versão local em React + TypeScript + Vite, com Recharts, React Hook Form e Zod. 

## Executar no VS Code

Requer Node.js 20.19+ ou 22.12+ e npm.

```powershell
cd "C:\Users\Windows\OneDrive\Documentos\Projetos\ferramenta-10-web"
npm install
npm run dev
```

Acesse http://127.0.0.1:5173. O servidor do Vite inclui a API local; não é necessário iniciar outro processo. Para encerrar, pressione Ctrl+C no terminal. A porta 5173 é fixa: encerre uma instância anterior antes de iniciar outra.

```powershell
npm test
npm run build
```

`npm run preview` serve somente o frontend compilado, sem a API. Para testar o fluxo completo, use `npm run dev` ou o emulador do Cloudflare Pages.

## O que está implementado

- Seis abas: Visão geral, Comparador, Renda fixa, Renda variável, Histórico e Configurações.
- Capital, referência e período compartilhados; 7/15 dias, 1/3/6/12 meses e datas personalizadas (até dois anos).
- Percentuais de três CDBs e um RDB editáveis com validação e recálculo imediato.
- Dois métodos: acumulação do CDI diário histórico ou estimativa com CDI anual atual constante.
- Rankings com até quatro maiores e três menores retornos, excluindo o Ibovespa e ativos indisponíveis.
- Gráficos de retorno, valor final e evolução de até quatro séries; filtros por categoria e ordenação.
- Dados reais consultados no backend, cache em memória de 15 minutos e mensagens de falha/limites de acesso.
- Consulta automática ao abrir e alterar o período; botão para atualizar. Capital e taxas recalculam localmente sem novas consultas.
- Fonte, intervalo efetivo, referência do CDI e identificação de séries ajustadas.
- Ibovespa como benchmark separado, condicionado à disponibilidade no provedor.

## Estrutura

```text
src/
  App.tsx                    # Navegação e cenário global
  pages/                     # Seis páginas, uma para cada aba
  main.tsx                   # Inicialização React
  styles.css                 # Identidade visual e responsividade
  components/                # Gráficos, tabela e formulário validado
  hooks/useData.ts            # Carregamento, cancelamento e erros de API
  lib/finance.ts             # Cálculos, calendário, alinhamento e rankings
  types.ts                   # Contratos compartilhados
server/api.ts                # Adaptadores BCB/brapi, validação e cache
functions/api/data.ts        # Endpoint Cloudflare Pages Functions
vite.config.ts              # API local e build
docs/METODOLOGIA.md          # Análise da planilha, fórmulas e limitações
```

Os testes ficam junto dos módulos: `finance.test.ts`, `api.test.ts` e `SettingsForm.test.tsx`.

## Fontes

- Banco Central, SGS 4389: CDI anualizado, base 252, em % a.a. https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=4389
- Banco Central, SGS 12: CDI diário, em % ao dia. https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json
- brapi v2, histórico diário: https://brapi.dev/docs/acoes/historico
- Autenticação e ativos de teste: https://brapi.dev/docs
- Limitações de GOOGLEFINANCE: https://support.google.com/docs/answer/3093281?hl=pt-BR

Documentação oficial: https://developers.cloudflare.com/pages/functions/ e https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/

## Limitações e próximos incrementos

- Limitação do plano da BRAPI (Alguns ativos não mostram o histórico em longos períodos).
- Dados de ETFs, FIIs, WEG e Ibovespa dependem de chave/cobertura; longos históricos podem depender do plano.
- Cache em memória por processo/isolate, não distribuído. Antes de aumentar o público, considerar cache compartilhado e controle de abuso da API pública.
- Calendário com fins de semana e feriados nacionais/móveis; não é um calendário oficial completo da B3. Ausências no CDI histórico bloqueiam a renda fixa quando o calendário espera observação.
- Retornos brutos; sem IR, IOF, taxas, spreads, custos de negociação ou modelagem individual de garantias e liquidez.
- O capital hipotético usa frações ideais, sem restrição de lotes. Ofertas bancárias são parâmetros do usuário, não cotações de produtos bancários.
- Sem autenticação, banco de dados ou persistência das configurações. Recarregar a página restaura o cenário inicial.


## Atualização: alternativas de renda fixa
LCI e LCA agora têm percentuais do CDI editáveis. Poupança usa o rendimento oficial por aniversário mensal do BCB (incluindo TR). Tesouro Selic aparece como estimativa pelo indexador Selic, sem preços de um título específico. Os valores são brutos: não descontam impostos, custódia nem simulam carência/vencimento.
A renda fixa aceita histórico de até dez anos; na sua aba usa todo o intervalo, independentemente da bolsa. A renda variável continua sujeita ao plano da brapi e ao limite de dois anos da integração.
