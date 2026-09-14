# NF-01 — Auditoria de arquitetura (NexFlow Intelligence)

> Documento de auditoria apenas. Nenhum código de produção foi alterado para
> produzi-lo. Escopo, decisões de implementação e o contrato da API de
> Intelligence ficam para uma tarefa seguinte (NF-02+).

Branch: `Fase4-NexFlow-Intelligence` (criado a partir de `Fase3-Product-Experience`,
que era o branch mais avançado disponível — `Fase4-NexFlow-Intelligence` não
existia em nenhum lugar do repositório antes desta auditoria).

---

## 1. `nodeCatalog`

Fonte: [backend/src/automation/nodeCatalog.ts](../backend/src/automation/nodeCatalog.ts)

É a fonte única de verdade sobre tipos de nó — consumida pelo builder via
`GET /api/workflows/node-types` ([workflow.routes.ts:20-22](../backend/src/modules/workflows/workflow.routes.ts#L20-L22),
serializada por `nodeCatalogView()` que remove a função `validateConfig` antes
de sair pela API).

### Tipos existentes

| type | category | capability | isTrigger | config obrigatória | executável hoje? |
| --- | --- | --- | --- | --- | --- |
| `manual` | trigger | `available` | ✔ | nenhuma | ✔ (mas não gera `runnableRef` — ver §3) |
| `webhook` | trigger | `configuration-required` | ✔ | `path` (string não-vazia), `method` ∈ `GET\|POST\|PUT\|PATCH\|DELETE` | ✔ quando configurado — é o **único** caminho que produz um `runnableRef` novo |
| `http` | action | `configuration-required` | ✘ | `method` ∈ HTTP_METHODS, `url` (string não vazia, regex `^https?://`) | ✔ quando configurado |
| `transform` | action | `configuration-required` | ✘ | nenhuma (`validateConfig` sempre retorna `[]`, apesar do rótulo `configuration-required`) | ✔ sempre — ver observação abaixo |
| `delay` | action | `configuration-required` | ✘ | `duration` (number > 0), `unit` ∈ `seconds\|minutes\|hours` | ✔ quando configurado |
| `condition` | logic | `configuration-required` | ✘ | `field` (string não vazia), `operator` ∈ `equals\|notEquals\|contains\|gt\|lt\|exists`, `value` (obrigatório exceto quando `operator === 'exists'`) | ✔ quando configurado |
| `email` | communication | `coming-soon` | ✘ | — | ✘ — bloqueia execução (`NODE_COMING_SOON`) |
| `notification` | communication | `coming-soon` | ✘ | — | ✘ — bloqueia execução (`NODE_COMING_SOON`) |
| `nexflow-intelligence` | ai | `coming-soon` | ✘ | — | ✘ — bloqueia execução (`NODE_COMING_SOON`) |

### Observações relevantes para geração por IA

- **`transform` tem `defaultConfig: { expression: '' }` mas `validateConfig`
  ignora completamente o campo `expression`** — nunca reporta
  `CONFIG_INCOMPLETE`, mesmo com expressão vazia. Isso significa que a IA pode
  gerar um nó `transform` sem preencher `expression` e ele passará na
  validação estrutural E na de execução, mas não fará nada em runtime (é um
  no-op silencioso hoje). **Não é bug para consertar aqui** (fora de escopo),
  mas a Intelligence não deve confiar em "passou na validação" como prova de
  que o nó é semanticamente útil.
- **`manual` nunca produz `runnableRef`.** O único gerador de `runnableRef`
  é um nó `webhook` configurado (`validateDefinition`, ver §3) ou um
  `engineRef` legado na linha do workflow. Logo, **qualquer definição gerada
  por IA que precise ser executável precisa incluir um `webhook` configurado
  como trigger** — um trigger `manual` é estruturalmente válido mas nunca
  passa em `forExecution: true` (cai em `NOT_RUNNABLE`).
- **`nexflow-intelligence` já existe como tipo de nó** (`category: 'ai'`,
  `coming-soon`). Isso é uma armadilha em potencial: se a IA (ou um usuário)
  incluir esse tipo de nó dentro de uma definição gerada, a definição fica
  estruturalmente válida mas **nunca executável** (`NODE_COMING_SOON`). A
  Intelligence deve tratar `nexflow-intelligence`, `email` e `notification`
  como tipos a evitar ao gerar workflows destinados a rodar — ou incluí-los
  deliberadamente apenas quando o usuário aceitar um rascunho "parcialmente
  pronto".
- **`http.url` exige `http://` ou `https://` explícito** — a IA não pode gerar
  URLs relativas, placeholders tipo `<url>` ou variáveis não resolvidas; a
  regex falha e gera `CONFIG_INCOMPLETE`.
- **Nenhum node type tem limite de quantas instâncias por workflow**, nem
  qualquer noção de portas/tipagem de dados entre nós — a validação é
  puramente sintática por nó + grafo (ver §3). Isso facilita a geração (menos
  regras a respeitar), mas também significa que a Intelligence pode produzir
  grafos com encadeamentos sem sentido semântico (ex.: dois `webhook` em
  sequência) sem que `validateDefinition` acuse nada.
- O catálogo não expõe nenhum node de "IA generativa" utilizável (o único de
  categoria `ai` é o `coming-soon` acima) — hoje a Intelligence, quando
  existir, atua **fora** do grafo (gerando a definição), não como um nó
  dentro dele.

---

## 2. `workflowDefinitionSchema`

Fonte: [backend/src/modules/workflows/workflow.schemas.ts](../backend/src/modules/workflows/workflow.schemas.ts)
(schemas Zod — é a validação estrutural de primeira linha, roda antes de
`validateDefinition`).

### Estrutura exata

```ts
WorkflowDefinition = {
  version: 1,                    // z.literal(1).default(1) — única versão aceita
  nodes: WorkflowNode[],         // max 100
  edges: WorkflowEdge[],         // max 200
}

WorkflowNode = {
  id: string,                    // trim, 1..64 chars
  type: string,                  // trim, 1..64 chars — NÃO restrito a um enum aqui;
                                  // é checado contra o catálogo só em validateDefinition
  position: { x: number, y: number },
  config: Record<string, unknown>,  // default {} — schema aceita qualquer shape;
                                     // a forma exigida por tipo vive em nodeCatalog, não aqui
  label?: string,                // trim, max 120 chars, opcional
}

WorkflowEdge = {
  id: string,                    // trim, 1..64 chars
  source: string,                // trim, 1..64 chars — não valida que aponta pra um node existente
  target: string,                // idem
  sourceHandle?: string | null,
  targetHandle?: string | null,
}
```

### Campos obrigatórios vs. opcionais

- Obrigatórios em todo node: `id`, `type`, `position` (`x`,`y` numéricos), 
  `config` (mas tem `.default({})`, então pode ser omitido no input).
- Obrigatórios em toda edge: `id`, `source`, `target`.
- Opcionais: `label` (node), `sourceHandle`/`targetHandle` (edge, aceitam
  `null` explícito além de ausência).
- No nível do workflow: `version` tem default `1` — **na prática é sempre
  `1`**, é um `z.literal`, não um número livre; enviar `2` falha o parse.

### Restrições de validação (nível Zod, ou seja, antes de qualquer regra de
negócio)

- Tamanho máximo: 100 nodes, 200 edges — um limite duro; a IA precisa ficar
  abaixo disso (folga enorme para os workflows típicos de automação, mas é um
  teto a respeitar se a IA "expandir" um pedido em muitos passos).
- `id` truncado em 64 chars, `label` em 120 — a IA deve gerar ids curtos e
  estáveis (idealmente `kebab-case` curto, como os templates fazem:
  `'trigger'`, `'shape'`, `'notify'` — ver
  [templateCatalog.ts](../frontend/src/data/templateCatalog.ts)).
- **Nada aqui valida que `type` existe no catálogo, que `config` bate com o
  que aquele tipo espera, que edges referenciam nodes existentes, ou que há
  um trigger.** Isso tudo é responsabilidade de `validateDefinition` (§3) —
  o schema Zod é só a "forma" do JSON.

### Versionamento

- Só existe a versão `1`. Não há histórico de migração de versões
  (`version: 1` é hardcoded como único valor aceito). Uma definição gerada
  por IA **deve** enviar `version: 1` (ou omitir — o default cobre).

### Estrutura de criação/atualização do workflow (contém `definition`)

```ts
createWorkflowSchema = {
  name: string,            // trim, 2..120
  description?: string,    // trim, max 1000
  engineRef?: string,      // trim, max 200
  definition?: WorkflowDefinition,   // opcional na criação
}

updateWorkflowSchema = createWorkflowSchema.partial() & {
  isActive?: boolean,
  definition?: WorkflowDefinition | null,   // null permitido (limpa a definição)
}
```

### O que uma definição gerada por IA precisa respeitar (resumo)

1. `version: 1`.
2. ≤100 nodes, ≤200 edges.
3. Todo `node.type` existente em `nodeCatalog` (senão `UNKNOWN_NODE_TYPE` em
   validateDefinition).
4. `node.id`/`edge.id` únicos, ≤64 chars.
5. `config` de cada node preenchendo os campos exigidos por aquele tipo
   específico (a IA precisa conhecer o catálogo, não só o schema Zod).
6. Toda `edge.source`/`edge.target` referenciando um `node.id` que existe na
   mesma definição.
7. Ao menos um node com `isTrigger: true` no catálogo (hoje só `manual` e
   `webhook`).
8. Se o objetivo é gerar algo **executável** (não só um rascunho), precisa de
   um `webhook` configurado — `manual` sozinho não basta (ver §1 e §3).

---

## 3. `validateDefinition()`

Fonte: [backend/src/modules/workflows/workflow.validation.ts](../backend/src/modules/workflows/workflow.validation.ts)

Comentário no próprio código: *"Frontend runs an equivalent check for UX;
this is the security/integrity gate."* — ou seja, é a validação que importa
de verdade (servidor), o frontend replica só para feedback de UX.

### Assinatura

```ts
validateDefinition(
  definition: WorkflowDefinition,
  options?: { forExecution?: boolean; engineRef?: string | null }
) => { ok: boolean; issues: ValidationIssue[]; runnableRef?: string }
```

### Validação estrutural (roda sempre)

Em ordem:

1. `nodes.length === 0` → retorna cedo com `EMPTY` (não roda mais nada).
2. Para cada node: `DUPLICATE_NODE_ID` se o id já apareceu; `UNKNOWN_NODE_TYPE`
   se `getNodeDef(type)` não encontra o tipo no catálogo (e **pula** o resto
   das checagens daquele node com `continue` — não checa config de um tipo
   desconhecido); `CONFIG_INCOMPLETE` se `def.validateConfig(config)` retorna
   chaves faltando.
3. Para cada edge: `DUPLICATE_EDGE_ID`; `EDGE_SELF_LOOP` se `source === target`;
   `EDGE_ENDPOINT_MISSING` se `source` ou `target` não é um node id visto.
4. `NO_TRIGGER` se nenhum node tem `isTrigger: true` no catálogo.

### Validação de execução (só quando `forExecution: true`)

Roda **junto** com a estrutural (mesmo loop), soma mais duas checagens:

5. `NODE_COMING_SOON` por node cuja `capability === 'coming-soon'`.
6. `NOT_RUNNABLE` no final, se não existir `runnableRef` (nem webhook
   configurado, nem `engineRef` de fallback).

### `runnableRef` — como é derivado

```ts
webhookNode = primeiro node com type === 'webhook' E validateConfig(config) === []
runnableRef = webhookNode ? String(webhookNode.config.path) : (engineRef ?? undefined)
```

- É **sempre** o `path` (string) do primeiro webhook válido encontrado —
  não há checagem de path duplicado entre workflows diferentes aqui (isso,
  se existir, é responsabilidade de outra camada — não vi checagem de
  unicidade de `path` em nenhum lugar auditado).
- Se não há webhook válido, cai para o `engineRef` passado via `options`
  (que vem da própria linha do workflow no banco — path "legado" da Fase 1).
- **Importante para a Intelligence**: `runnableRef` só é calculado a partir
  do que já está *dentro* da própria `definition` (mais o `engineRef` da
  linha) — uma definição gerada isoladamente (sem workflow salvo ainda) só
  terá `runnableRef` se ela mesma contiver um webhook configurado.

### Onde cada código é usado

| Código | Quando dispara | Bloqueia o quê |
| --- | --- | --- |
| `EMPTY` | zero nodes | sempre inválido |
| `NO_TRIGGER` | nenhum node é trigger | sempre inválido (estrutural) |
| `UNKNOWN_NODE_TYPE` | `type` fora do catálogo | sempre inválido; e impede checar a config daquele node |
| `DUPLICATE_NODE_ID` / `DUPLICATE_EDGE_ID` | ids repetidos | sempre inválido |
| `EDGE_ENDPOINT_MISSING` | edge aponta pra id inexistente | sempre inválido |
| `EDGE_SELF_LOOP` | edge liga um node a si mesmo | sempre inválido |
| `CONFIG_INCOMPLETE` | `validateConfig` do tipo acusa campo faltando | sempre inválido |
| `NODE_COMING_SOON` | node com `capability: 'coming-soon'` | só quando `forExecution: true` (salvar um rascunho com esses nodes é permitido) |
| `NOT_RUNNABLE` | sem `runnableRef` derivável | só quando `forExecution: true` |

### Quem chama com `forExecution: true`

- `workflowService.update` quando `isActive` está sendo setado para `true`
  ([workflow.service.ts:79-85](../backend/src/modules/workflows/workflow.service.ts#L79-L85)).
- `workflowService.check` — usado pelo endpoint `POST /:id/check`, chamado
  pelo componente `WorkflowCheck` no builder
  ([WorkflowCheck.tsx](../frontend/src/components/builder/WorkflowCheck.tsx))
  a cada 500ms de "digitação parada". **Este componente já está rotulado na
  UI como "NexFlow Intelligence"** (comentário no código: *"real validation
  state, surfaced as NexFlow Intelligence [...] No AI, no guesswork"*) — ou
  seja, hoje existe uma superfície de produto chamada "Intelligence" que é
  puramente validação determinística, sem IA nenhuma. Uma Intelligence real
  (geração por IA) precisará decidir se substitui, complementa, ou convive
  com essa nomenclatura já em uso (fora de escopo desta auditoria — só
  registrando o conflito de nome).
- `workflowService.execute` sempre valida com `forExecution: true` antes de
  criar a `WorkflowExecution` (nunca deixa um registro `PENDING` órfão de uma
  definição inválida).

### Isso valida com segurança uma definição gerada por IA?

**Sim, estruturalmente e de forma determinística** — `validateDefinition` não
faz nenhuma suposição sobre *quem* produziu a definição; ela só olha a forma
final. Uma definição de IA passa pelo mesmo funil que uma definição
desenhada manualmente ou vinda de um template. Pontos de atenção:

- A validação é **sintática**, não semântica: aceita grafos desconexos,
  ciclos (fora de self-loop), múltiplos triggers, nodes órfãos sem edges,
  etc. — nada disso é hoje verificado. Se a Intelligence deve garantir um
  grafo "coerente" (ex.: um único fluxo linear, sem nodes soltos), essa regra
  não existe em `validateDefinition` e teria que viver na própria
  `IntelligenceService` (fora de escopo aqui).
- `UNKNOWN_NODE_TYPE` protege bem contra a IA "inventar" tipos de nó que não
  existem — isso é seguro por padrão.
- Como não há sanitização de `config` além de `validateConfig` (que só olha
  chaves específicas, não todo o objeto), **campos extras/arbitrários dentro
  de `config` passam sem erro** (o schema Zod usa `z.record(z.unknown())`).
  Isso é permissivo o bastante para não travar a IA, mas também significa que
  nada impede a IA de anexar dados supérfluos ou mal-formados que só quebram
  em runtime (ex.: `transform.expression` inválida — não validado hoje, ver
  §1).

---

## 4. Criação/atualização de workflow

### Endpoint atual

`POST /api/workflows` (criação) e `PATCH /api/workflows/:id` (atualização) —
ambos em [workflow.routes.ts](../backend/src/modules/workflows/workflow.routes.ts),
atrás de `requireAuth` (todas as rotas do router) e `validate({ body: ... })`
com os schemas Zod da seção 2.

### Estrutura aceita hoje

- `POST /` → `{ name, description?, engineRef?, definition? }` —
  **`definition` já é opcional no create desde a Fase atual** (não precisa de
  webhook/engine configurado para *salvar*; só para ativar/rodar).
- `PATCH /:id` → mesmos campos + `isActive?`; `definition` pode ser `null`
  explícito para apagar uma definição salva.
- `workflowService.create` ([workflow.service.ts:61-70](../backend/src/modules/workflows/workflow.service.ts#L61-L70))
  grava `definition` como `Prisma.InputJsonValue` direto — **nenhuma
  validação de negócio roda na criação** (só a validação Zod de forma, feita
  pelo middleware antes do controller). `validateDefinition` só é chamado
  dentro de `update` (e só quando `isActive: true`), `check`, e `execute`.
  → **Hoje é possível criar um workflow com uma `definition` estruturalmente
  inválida** (ex.: sem trigger, com `UNKNOWN_NODE_TYPE`) contanto que passe
  no Zod — ela só vai falhar quando alguém tentar ativar/checar/rodar.

### Como os templates criam workflows

[TemplatesPage.tsx:31-46](../frontend/src/pages/TemplatesPage.tsx#L31-L46) —
`useTemplate()` chama `workflowService.create({ name, description, definition: tpl.definition })`
diretamente com a `definition` estática do catálogo de templates
([templateCatalog.ts](../frontend/src/data/templateCatalog.ts)), depois
navega para `/workflows/:id/builder`. Sem passo de "check" antes de criar —
os templates confiam que sua própria `definition` hardcoded já é válida
(e são, pelos testes/estrutura vistos).

### Como o builder salva workflows

[BuilderShell.tsx:60](../frontend/src/components/builder/BuilderShell.tsx#L60) —
`workflowService.update(workflow.id, { name, definition: g.toDefinition() })`,
onde `g.toDefinition()` vem de `useBuilderGraph`
([useBuilderGraph.ts:131-150](../frontend/src/components/builder/useBuilderGraph.ts#L131-L150))
serializando o estado do canvas (`@xyflow/react`) de volta para o shape
`WorkflowDefinition`. Ativar/desativar é um `PATCH` separado só com
`{ isActive }` ([BuilderShell.tsx:76](../frontend/src/components/builder/BuilderShell.tsx#L76)),
que é o ponto em que `validateDefinition({ forExecution: true })` de fato
roda.

### Uma proposta de IA pode reaproveitar o caminho existente?

**Sim, sem nenhuma mudança de schema ou de persistência.** O fluxo natural é:

1. Intelligence gera um `WorkflowDefinition` (mesma forma exata do §2).
2. Cliente chama o `POST /api/workflows/:id/check` (se já existir um
   workflow rascunho) ou simplesmente `POST /api/workflows` com essa
   `definition` — **exatamente o mesmo caminho que os templates usam hoje**.
3. Dali em diante é um workflow normal: aparece na listagem, abre no builder,
   pode ser editado, ativado, executado — tudo pelos endpoints já existentes.

### É necessário algum mecanismo novo de persistência?

**Não para persistir o workflow em si** — `Workflow.definition` (coluna
`Json?`) já aceita qualquer definição vinda de qualquer origem (template,
builder manual, ou IA); não há coluna "origem" nem necessidade de uma.

Onde **provavelmente** será necessário algo novo (fora de escopo aqui, só
registrando para a próxima tarefa):

- Um jeito de o cliente ver a *proposta* da IA **antes** de decidir salvá-la
  (o contrato do §5 devolve a `definition` sem persistir nada — quem decide
  persistir é o cliente, chamando `POST /api/workflows` normalmente).
- Não existe hoje nenhuma tabela/log de "gerações de IA" (prompt usado,
  proposta aceita/rejeitada, custo de tokens, etc.) — se isso for desejado
  para auditoria/analytics, é schema novo (migração nova), mas não é
  necessário só para a IA *funcionar*.

---

## 5. Proposta de contrato — `POST /api/intelligence/generate`

**Só o contrato. Nada disto está implementado.**

### Visão geral

O endpoint recebe um pedido em linguagem natural e devolve uma **proposta**
de `WorkflowDefinition` já validada estruturalmente pelo mesmo
`validateDefinition` usado no resto do sistema — mas **não persiste nada**.
Quem decide salvar é o cliente, reusando `POST /api/workflows` (§4) com a
`definition` retornada, exatamente como um template faz hoje.

### Request

```
POST /api/intelligence/generate
Authorization: Bearer <accessToken>       (requireAuth — mesmo padrão das outras rotas de workflows)
Content-Type: application/json
```

```jsonc
{
  "prompt": "Quando chegar um novo lead pelo formulário, notificar o time por HTTP",
  // Opcional — reaproveita uma definição existente como ponto de partida
  // (ex.: usuário pede "adicione um passo de espera de 5 minutos" a um
  // workflow já aberto no builder).
  "currentDefinition": { "version": 1, "nodes": [...], "edges": [...] } | null
}
```

Validação de entrada (Zod, mesmo padrão de `validate({ body })`):

- `prompt`: string, trim, min 1, max ~2000 chars (limite a definir — só para
  ter um teto sensato, igual ao `description` de workflow que já usa 1000).
- `currentDefinition`: opcional, reaproveita **o mesmo**
  `workflowDefinitionSchema` já existente — não é um schema novo.

### Response — sucesso (`200`)

```jsonc
{
  "definition": { "version": 1, "nodes": [...], "edges": [...] },
  "check": {
    // exatamente o shape de ValidationResult que POST /:id/check já devolve
    "ok": true,
    "issues": [],
    "runnableRef": "new-lead"   // presente só se a proposta incluiu um webhook configurado
  },
  "summary": "Cria um workflow disparado por um webhook em 'new-lead', que envia uma notificação HTTP."
}
```

- `definition` — sempre no shape exato de `WorkflowDefinition` (§2), pronta
  para ser passada, sem transformação nenhuma, a `POST /api/workflows` ou
  `PATCH /api/workflows/:id`.
- `check` — o resultado de rodar `validateDefinition(definition, { forExecution: false })`
  **no servidor, contra o proposal da própria IA**, antes de responder. Isso
  garante que o contrato nunca devolve algo com `UNKNOWN_NODE_TYPE` ou
  `CONFIG_INCOMPLETE` sem o cliente saber — reaproveita o mesmo shape que o
  frontend já sabe renderizar em `WorkflowCheck.tsx` (mesmos códigos de
  `issue.code`, mesmas chaves i18n `builder.checkCodes.*`).
- `check.ok === false` **não é um erro HTTP** — é uma proposta imperfeita
  que o usuário ainda pode abrir no builder e corrigir manualmente (mesma
  filosofia de "salvar sem estar pronto pra rodar" que já existe em
  `workflowService.create`, §4). O endpoint só falha com erro HTTP quando o
  provedor de IA não responde ou responde algo que nem o Zod consegue
  interpretar como `WorkflowDefinition` (ver erros abaixo).
- `summary` — texto curto para exibir na UI ("é isso que vou criar?");
  opcional na v1, pode ficar de fora do MVP.

### Erros (reaproveitando o formato já usado em todo o backend)

```jsonc
{ "error": { "code": "STRING_CODE", "message": "...", "details": {} } }
```

| Status | code | Quando |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `prompt` ausente/vazio/maior que o limite — mesmo caminho do middleware `validate()` já existente (ZodError) |
| 401 | `UNAUTHORIZED` | sem sessão — igual a qualquer outra rota autenticada |
| 422 | `INTELLIGENCE_INVALID_OUTPUT` | o provedor respondeu, mas o resultado não passa nem no `workflowDefinitionSchema` (forma), mesmo após a IntelligenceService tentar reparar/repetir internamente — o cliente nunca deveria precisar tratar isso como "proposta ruim", é uma falha do provedor |
| 429 | `INTELLIGENCE_RATE_LIMITED` | limite de uso (por usuário e/ou global) estourado — detalhe a definir na implementação (fora de escopo) |
| 502 | `UPSTREAM_ERROR` | reaproveita `AppError.upstream()` já existente — provedor de IA fora do ar/erro de rede, mesmo padrão usado hoje para erros do n8n |
| 504 | `INTELLIGENCE_TIMEOUT` | provedor não respondeu dentro do timeout configurado (padrão do projeto: `N8N_TIMEOUT_MS` existe como precedente de "timeout configurável por env" — a IA teria seu próprio, ex. `AI_TIMEOUT_MS`) |

### Por que este contrato não exige nada novo em schema/validação

- Reaproveita **exatamente** `workflowDefinitionSchema` (request opcional
  `currentDefinition`, response `definition`) — zero schema novo para o
  grafo em si.
- Reaproveita **exatamente** `validateDefinition()` e o shape
  `ValidationResult` já usado por `POST /:id/check` — o campo `check` da
  resposta é, literalmente, o mesmo objeto que esse endpoint já devolve.
- Reaproveita o formato de erro (`AppError` + `errorHandler`) e o padrão de
  middleware `validate({ body })` já usados em toda rota existente.
- **Não** persiste nada — o "salvar" continua sendo `POST /api/workflows`
  (criação) sem trocar uma linha do fluxo atual de templates/builder (§4).
- Fica de fora deste contrato (decisão para NF-02+): qual provedor de IA,
  como o prompt é transformado internamente, rate limiting real, telemetria
  de custo/uso, e se `currentDefinition` grande demais precisa de algum corte
  antes de ir pro provedor.

---

## Achados fora do escopo direto, mas relevantes para o design da Intelligence

1. **Nome "Intelligence" já em uso** para uma feature 100% determinística
   (`WorkflowCheck.tsx`, i18n `builder.check.*`) — decidir nomenclatura final
   evita confundir usuários entre "o check de sempre" e "a IA nova".
2. **`transform.validateConfig` nunca reporta nada** — um node `transform`
   sem `expression` é aceito silenciosamente; a Intelligence não deve tratar
   "0 issues" como garantia de utilidade semântica.
3. **Sem checagem de grafo conexo/único-fluxo** — `validateDefinition` é
   puramente local por node/edge; qualquer garantia de "grafo coerente" para
   saída de IA precisa ser implementada na camada de Intelligence, não
   existe hoje em lugar nenhum para reaproveitar.
4. **Sem checagem de unicidade de `webhook.path` entre workflows** — não
   auditado a fundo (fora do escopo dos arquivos listados), mas não vi
   nenhuma constraint de unicidade no schema Prisma para isso; vale
   confirmar antes de a Intelligence gerar paths livremente.
