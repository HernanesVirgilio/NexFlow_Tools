# Entrega — Edson (EDS-01 a EDS-07)

Fluxo de revisão, ferramentas, funcionalidades, CI e QA. O layout raiz continua com Ernanes. O contrato e o provider de Intelligence continuam com Alexandre.

## Ficheiros por cartão

### EDS-01 — Revisão da proposta

- `frontend/src/components/intelligence/ProposalReview.tsx`
- `frontend/src/styles/pages/dashboard.css` (bloco `.nf-proposal`)
- `frontend/src/i18n/pt/common.json` e `frontend/src/i18n/en/common.json` (chave `proposal`)

### EDS-02 — Composer ligado ao endpoint

- `frontend/src/pages/DashboardPage.tsx` (envio, loading, erro, vazio, nova tentativa)
- `frontend/src/services/intelligence.service.ts`
- `frontend/src/components/ui/ErrorState.tsx` (quota, indisponível, resposta ilegível, limite)
- `frontend/src/test/intelligence.service.test.ts`

### EDS-03 — Confirmar grava e abre o Builder

- `frontend/src/pages/DashboardPage.tsx` (`confirmProposal`, `discardProposal`)
- `frontend/src/test/proposal-flow.test.tsx`
- `frontend/src/test/setup.ts` (navegação do React Router nos testes)

O fluxo chama `POST /workflows` sem `isActive`. O registo nasce inativo e a navegação vai para `/workflows/:id/builder`.

### EDS-04 — Modal Conectar ferramentas

- `frontend/src/components/layout/ConnectToolsModal.tsx`
- `frontend/src/context/ConnectToolsContext.tsx`
- `frontend/src/data/toolCatalog.ts`
- `frontend/src/components/layout/AppLayout.tsx` (entrada Integrações e o modal único)
- `frontend/src/styles/components.css` (bloco `.nf-connect`)

### EDS-05 — Painel Funcionalidades

- `frontend/src/components/layout/FunctionalitiesPanel.tsx`
- `frontend/src/components/layout/AppLayout.tsx` (botão que abre o painel)
- `frontend/src/test/functionalities.test.tsx`
- `frontend/src/styles/components.css` e `frontend/src/styles/responsive.css` (bloco `.nf-func`)

### EDS-06 — CI

- `.github/workflows/ci.yml`

O job `check` corre install, Prisma generate, typecheck, testes e build. O job `audit` fica avisivo: o que resta pede bump major (Vitest 5 e React Router 7) e fica isolado.

### EDS-07 — QA

- Este ficheiro
- `docs/api.md` (linha `402 AI_QUOTA_EXHAUSTED`)

## Contrato usado, dono Alexandre

O Composer consome estes ficheiros e não duplica a lógica do provider:

- `backend/src/modules/intelligence/intelligence.routes.ts`
- `backend/src/modules/intelligence/intelligence.service.ts`
- `backend/src/modules/intelligence/intelligence.schemas.ts`
- `backend/src/modules/intelligence/rateLimit.ts`
- `backend/src/modules/intelligence/providers/AIProvider.ts`
- `backend/src/modules/intelligence/providers/OpenAIProvider.ts`
- `backend/src/routes/index.ts`
- `backend/tests/intelligence.routes.test.ts`
- `backend/tests/intelligence.service.test.ts`

## Checklist

- [x] A revisão mostra resumo, passos, issues e avisos. Confirmar não executa.
- [x] Descartar tira a proposta do ecrã e não grava.
- [x] Erro, vazio e nova tentativa estão ligados à resposta real.
- [x] Guardar cria o workflow inativo e abre o Builder. Teste de navegação aprovado.
- [x] O modal abre, pesquisa, filtra por categoria, fecha com Esc e não liga nada sem backend de integração.
- [x] Cada funcionalidade indica Disponível, Requer configuração ou Futuro.
- [x] CI de typecheck, testes e build está no repositório.
- [x] UI em PT e EN. Painel, modal e lista de fluxos cabem em 1440×900 e 390×844.
- [ ] Proposta gerada pela OpenAI no ambiente. A conta responde `402 AI_QUOTA_EXHAUSTED`. Nada é inventado nem guardado nesse caso.

## Como verificar

```bash
npm test --workspace frontend -- src/test/proposal-flow.test.tsx src/test/functionalities.test.tsx src/test/intelligence.service.test.ts
npm run dev
```

Abrir http://localhost:5173 com `demo@nexflow.tools` / `demodemo`.

O rascunho criado na validação da navegação está em `/workflows/cmv52r49n000l136bw570jhzs/builder` (`Avisar a equipa`, inativo). O texto dessa proposta foi injectado na sessão do browser porque a conta OpenAI não tinha saldo. O `POST /workflows` e a abertura do Builder foram reais.
