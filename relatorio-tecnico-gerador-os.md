# Relatório Técnico — Gerador de OS
**Arquiteto avaliador:** Staff Engineer / Tech Lead  
**Data da análise:** Setembro de 2026  
**Stack:** React 19 + Vite 8 + Supabase + TailwindCSS 4 + PWA

---

## 1. Resumo Executivo

O projeto é uma aplicação PWA de geração e gestão de Ordens de Serviço (OS), com autenticação via Supabase, persistência em banco relacional e impressão A4. A base técnica é sólida e moderna. O principal risco imediato não é de segurança nem de performance, mas de **rigidez de modelo de domínio**: o campo `equipamento` é um campo de texto livre e o fluxo atual pressupõe que todo atendimento envolve um equipamento — o que não condiz com a realidade do negócio.

| Dimensão        | Nota |
|-----------------|------|
| Arquitetura     | 6/10 |
| Código          | 6/10 |
| Segurança       | 7/10 |
| Performance     | 7/10 |
| Documentação    | 4/10 |
| Testes          | 0/10 |
| DevOps          | 5/10 |
| Escalabilidade  | 6/10 |
| Manutenção      | 6/10 |

---

## 2. Pontos Fortes

- **Transação atômica no banco:** `save_os_transaction` via RPC garante integridade na gravação de OS + itens simultaneamente. Excelente decisão.
- **RLS implícita:** todas as queries filtram por `user_id`, dificultando vazamento de dados entre usuários mesmo sem RLS ativa.
- **Separação services/views/components:** a divisão de responsabilidades existe e está funcional.
- **PWA configurado:** `vite-plugin-pwa` com `workbox` e manifesto completo. Prompt de instalação implementado corretamente.
- **Snapshot do cliente na OS:** salvar `cliente_snapshot` na OS é uma decisão correta — preserva os dados históricos mesmo que o cadastro do cliente seja editado depois.
- **Onboarding forçado:** detectar ausência de empresa e forçar o cadastro na primeira sessão é boa UX para um produto SaaS.
- **`getNextOSNumber` via RPC:** evita race condition de numeração sequencial no frontend. Correto.
- **Supabase cliente bem inicializado:** validação de variáveis de ambiente na criação do cliente (`if (!supabaseUrl || !supabaseAnonKey)`) é uma boa prática.

---

## 3. Problemas Encontrados

---

### PROB-01 — Equipamento obrigatório não condiz com o negócio

**Problema:**  
O campo `equipamento` no formulário da OS é um campo de texto simples. Na tela de criação de OS há um botão "Buscar Equipamento" que sugere que o equipamento é parte obrigatória do fluxo. No `EquipmentManager`, o `cliente_id` tem `required` no formulário. Isso impede o cadastro de equipamentos sem dono e não suporta atendimentos como: suporte remoto, consultoria, instalação de software, serviços de limpeza, manutenção predial, etc.

**Impacto:**  
O sistema não atende à realidade completa do negócio. Usuários que prestam serviços sem equipamento físico são forçados a preencher um campo que não faz sentido para eles ou a deixar campos incoerentes.

**Gravidade:** Alta  
**Evidências:** `EquipmentManager.jsx` linha ~1942 (`required` no `select` de cliente); `App.jsx` estado inicial com `equipamento: ''`; `SidebarForm.jsx` não mostra o campo como opcional.

**Solução:**

1. **Tornar o equipamento opcional na OS:** remover o campo de texto `equipamento` do estado central e substituir por `equipamento_id` (nullable) e `equipamento_snapshot` (JSON, como já se faz com cliente).
2. **Remover `required` do `cliente_id` no `EquipmentManager`:** deixar cliente como opcional no cadastro de equipamento.
3. **Adicionar um tipo/categoria de atendimento na OS:** campo `tipo_atendimento` com opções como `Equipamento`, `Serviço Geral`, `Consultoria`, `Instalação`, etc. Quando o tipo não for `Equipamento`, ocultar o bloco de equipamento no formulário e no documento impresso.

```js
// Estado da OS com equipamento opcional
const initialOSData = {
  ...
  tipo_atendimento: 'servico_geral', // 'equipamento' | 'servico_geral' | ...
  equipamento_id: null,
  equipamento_snapshot: null,
  ...
};
```

**Justificativa:** O sistema precisa ser flexível o suficiente para atender diferentes perfis de prestadores de serviço. A abordagem de `tipo_atendimento` é extensível sem quebrar o modelo existente.  
**Complexidade:** Média  
**Prioridade:** P0

---

### PROB-02 — Ausência de funcionalidade de Orçamento

**Problema:**  
Não existe um documento ou fluxo de orçamento separado da OS. O orçamento é uma etapa anterior à OS na maioria dos negócios de manutenção: o técnico avalia, gera um orçamento, o cliente aprova, então a OS é executada. Sem esse fluxo, o prestador não tem como formalizar a proposta antes de começar o trabalho.

**Impacto:**  
- Prestador não consegue enviar proposta formal ao cliente antes da execução.
- Não há rastreabilidade do estado "aguardando aprovação".
- O status "Aprovada" na OS existe mas não há um documento específico de orçamento para enviar.

**Gravidade:** Alta  
**Evidências:** `SidebarForm.jsx` — status com opção `"Aprovada"` mas sem documento correspondente; `PreviewA4.jsx` gera apenas OS; nenhum componente `OrcamentoPreview` ou rota `/orcamento` existe.

**Solução:**

Implementar um segundo tipo de documento com os seguintes elementos:

**a) Novo campo `tipo_documento` na OS:**
```js
// 'os' | 'orcamento'
tipo_documento: 'os'
```

**b) Novo componente `PreviewOrcamento.jsx`:**
- Cabeçalho com "ORÇAMENTO Nº XXXX" em vez de "ORDEM DE SERVIÇO"
- Validade do orçamento (ex: "Válido por 15 dias")
- Seção de itens/serviços com valores
- Campo de aceite do cliente (assinatura)
- **Sem** campos de observações internas
- Rodapé com instrução de aprovação

**c) Fluxo de aprovação:**
```
Orçamento Aberto → Cliente Aprove → OS Gerada automaticamente
```

**d) Botão "Gerar OS a partir deste Orçamento"** que copia os dados do orçamento para uma nova OS e vincula o `orcamento_id`.

**e) Novo campo no banco:**
```sql
ALTER TABLE os ADD COLUMN tipo_documento TEXT NOT NULL DEFAULT 'os' 
  CHECK (tipo_documento IN ('os', 'orcamento'));
ALTER TABLE os ADD COLUMN orcamento_origem_id UUID REFERENCES os(id);
ALTER TABLE os ADD COLUMN validade_orcamento DATE;
```

**f) Botão "Enviar por E-mail":**
Gerar um link de visualização público (ou usar `mailto:`) com PDF do orçamento em anexo. Exemplo de implementação com link de visualização:

```js
// Rota pública de visualização de orçamento
// /orcamento/:token (token gerado no banco, sem autenticação)
```

**Justificativa:** Orçamento e OS são documentos com finalidades distintas e visualmente diferentes. Unificá-los em um único tipo resulta em confusão tanto para o prestador quanto para o cliente.  
**Complexidade:** Média  
**Prioridade:** P0

---

### PROB-03 — Estado global da OS em `App.jsx` — God Component

**Problema:**  
`App.jsx` (via `AppContent`) concentra: autenticação, estado global da OS, navegação, controle de todos os modais, lógica de PWA, onboarding, seleção de cliente/produto/equipamento, e salvamento. São ~420 linhas de um único componente fazendo tudo.

**Impacto:**  
Dificuldade de manutenção, testes impossíveis, qualquer mudança no estado da OS impacta toda a árvore.

**Gravidade:** Média  
**Evidências:** `App.jsx` linhas 553–983.

**Solução:**

1. Criar `src/context/OSContext.jsx` com `useReducer` para gerenciar o estado da OS.
2. Criar `src/context/AuthContext.jsx` para autenticação.
3. Criar `src/hooks/useOS.js` para encapsular handlers (handleChange, handleSave, handleNewOS, etc.).
4. `App.jsx` passa a ser apenas o roteador, com no máximo 60–80 linhas.

```jsx
// src/context/OSContext.jsx
export const OSProvider = ({ children }) => {
  const [osData, dispatch] = useReducer(osReducer, initialOSData);
  // ...
  return <OSContext.Provider value={{ osData, dispatch }}>{children}</OSContext.Provider>;
};
```

**Justificativa:** Separação de responsabilidades (SRP). Cada contexto tem uma única razão para mudar.  
**Complexidade:** Média  
**Prioridade:** P1

---

### PROB-04 — `App.css` contém CSS do template Vite (código morto)

**Problema:**  
`App.css` contém classes `.counter`, `.hero`, `.framework`, `.vite`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks` — todo o CSS gerado pelo boilerplate do Vite que não é usado em lugar nenhum da aplicação.

**Impacto:**  
CSS desnecessário no bundle, confusão para desenvolvedores novos, falsa impressão de que essas classes têm algum uso.

**Gravidade:** Baixa  
**Evidências:** `src/App.css` linhas 1–529 — nenhuma dessas classes é referenciada em qualquer JSX.

**Solução:**  
Apagar todo o conteúdo de `App.css` ou o arquivo inteiro (já que o projeto usa TailwindCSS).

**Justificativa:** Dead code aumenta o ruído cognitivo e o tamanho do bundle.  
**Complexidade:** Baixa  
**Prioridade:** P2

---

### PROB-05 — `showProductManager` e `showProductSelector` são dois estados para a mesma coisa

**Problema:**  
Em `App.jsx` existem dois estados: `showProductManager` (nunca usado em nenhum JSX visível) e `showProductSelector` (usado para abrir o modal de seleção de produto). Isso é um bug latente e código confuso.

**Impacto:**  
Dead state, possível confusão de manutenção.

**Gravidade:** Baixa  
**Evidências:** `App.jsx` linhas 578–579.

**Solução:**  
Remover `showProductManager` e manter apenas `showProductSelector`.

**Complexidade:** Baixa  
**Prioridade:** P3

---

### PROB-06 — Filtro de equipamentos feito no cliente (frontend)

**Problema:**  
Em `EquipmentManager.jsx`, o filtro de busca é aplicado com `.filter()` no array já carregado:
```js
equipments.filter(e => e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || ...)
```
O mesmo padrão está em `ClientManager.jsx` e `ProductManager.jsx`.

**Impacto:**  
Para volumes pequenos (< 500 registros) é aceitável. Para prestadores com muitos clientes/equipamentos, toda a tabela é carregada na memória e filtrada localmente — desnecessário e ineficiente.

**Gravidade:** Baixa (agora), Média (em escala)  
**Evidências:** `EquipmentManager.jsx` linha ~1872.

**Solução:**  
Adicionar debounce + filtro server-side via Supabase:
```js
const { data } = await supabase
  .from('equipamentos')
  .select('*, clientes(nome)')
  .eq('user_id', userId)
  .ilike('nome', `%${searchTerm}%`)
  .order('nome');
```

**Complexidade:** Baixa  
**Prioridade:** P2

---

### PROB-07 — `task.md` referencia Firebase — tecnologia não utilizada

**Problema:**  
`task.md` descreve um plano de implementação com Firebase (Firestore, Firebase Hosting, Login com Google). O projeto migrou para Supabase mas o `task.md` não foi atualizado. Isso indica que a documentação de processo está desatualizada.

**Impacto:**  
Confusão para novos desenvolvedores, percepção de que o projeto está em estado intermediário de migração.

**Gravidade:** Baixa  
**Evidências:** `task.md` linhas 1–25.

**Solução:**  
Reescrever o `task.md` (ou removê-lo) refletindo a stack atual (Supabase). Atualizar o `README.md` com instruções de setup corretas.

**Complexidade:** Baixa  
**Prioridade:** P3

---

### PROB-08 — `SidebarForm.jsx` usa estilos inline/hardcoded em vez do design system

**Problema:**  
`SidebarForm.jsx` usa constantes de estilo com valores hardcoded (`inputClass`, `labelClass`, `h2Class`) com cores `#1a5276`, `#555`, `#ccc` que não fazem parte do design system definido em `tailwind.config.js` e `index.css`.

**Impacto:**  
Inconsistência visual, dificuldade de mudar o tema globalmente, manutenção duplicada de cores.

**Gravidade:** Baixa  
**Evidências:** `SidebarForm.jsx` linhas 3178–3180.

**Solução:**  
Substituir por classes do design system (`brand-navy`, `outline-variant`, `on-surface-variant`).

**Complexidade:** Baixa  
**Prioridade:** P2

---

### PROB-09 — Sem testes automatizados

**Problema:**  
Não existe nenhum arquivo de teste no projeto. Nenhuma configuração de Vitest, Jest, Playwright ou Cypress.

**Impacto:**  
Qualquer refatoração é feita às cegas. Regressões não são detectadas automaticamente. Em especial, a lógica de `saveOS`, `getNextOSNumber`, e a transformação de `getOSList` (que contém lógica de negócio relevante) não têm cobertura.

**Gravidade:** Alta  
**Evidências:** ausência de `*.test.js`, `*.spec.js`, `vitest.config.js`.

**Solução:**  
1. Configurar Vitest (já disponível via Vite).
2. Começar pelos services puros: `osService.js`, `profileService.js`.
3. Adicionar testes de componentes com React Testing Library para os fluxos críticos (criação de OS, seleção de cliente).

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', globals: true }
});
```

**Complexidade:** Média  
**Prioridade:** P1

---

### PROB-10 — Header tem barra de busca sem funcionalidade

**Problema:**  
`Header.jsx` exibe um campo de busca com placeholder "Buscar OS, clientes ou serviços..." e atalho `Alt+K`, mas o input não possui nenhum `onChange`, `onKeyDown` ou handler associado. É um elemento decorativo não funcional.

**Impacto:**  
Frustração do usuário que tenta usar a busca; indica feature incompleta exposta na UI.

**Gravidade:** Média  
**Evidências:** `Header.jsx` linhas 2033–2037.

**Solução:**  
Ou implementar a busca global (conectando com Supabase full-text search ou filtrando localmente nas rotas), ou remover o campo até que a feature esteja pronta. Não deixar UI não funcional.

**Complexidade:** Média (implementação completa) / Baixa (remover temporariamente)  
**Prioridade:** P1

---

### PROB-11 — Dashboard tem botão "Exportar XLS" sem implementação

**Problema:**  
O botão "Exportar XLS" em `Dashboard.jsx` não possui handler (`onClick`). É um `<button type="button">` sem ação.

**Impacto:**  
Mesma questão do PROB-10: funcionalidade prometida na UI mas não entregue.

**Gravidade:** Baixa  
**Evidências:** `Dashboard.jsx` linhas 3721–3724.

**Solução:**  
Implementar ou remover. Para exportação XLS, usar `SheetJS` (xlsx):
```js
import * as XLSX from 'xlsx';
const exportToXLS = (osList) => {
  const ws = XLSX.utils.json_to_sheet(osList);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'OS');
  XLSX.writeFile(wb, `relatorio-os-${new Date().toISOString().split('T')[0]}.xlsx`);
};
```

**Complexidade:** Baixa  
**Prioridade:** P2

---

### PROB-12 — Numeração de OS hardcoded com ano 2026

**Problema:**  
Em `osService.js`:
```js
if (!userId) return "0001/2026";
```
O ano está hardcoded. Em janeiro de 2027 todos os usuários sem sessão veriam "0001/2026".

**Impacto:**  
Bug garantido na virada do ano para usuários não autenticados.

**Gravidade:** Baixa  
**Evidências:** `osService.js` linha 3301.

**Solução:**
```js
const year = new Date().getFullYear();
if (!userId) return `0001/${year}`;
```

**Complexidade:** Baixa  
**Prioridade:** P2

---

### PROB-13 — Inconsistência de nomenclatura nos itens da OS

**Problema:**  
Em `SidebarForm.jsx`, os itens usam `item.desc`, `item.qtd`, `item.val`. Em `osService.js` e no banco, os campos são `descricao`, `quantidade`, `valor`. Em `App.jsx`, o estado inicial usa `descricao`, `quantidade`, `valor`. Há um mismatch entre o que a UI edita e o que é salvo.

**Impacto:**  
Os dados podem não ser salvos corretamente dependendo do caminho de edição. Bug potencial silencioso.

**Gravidade:** Alta  
**Evidências:**  
- `SidebarForm.jsx` linhas 3264–3266: `item.desc`, `item.qtd`, `item.val`  
- `App.jsx` linha 566: `{ id: Date.now(), descricao: '', quantidade: 1, valor: 0.00 }`  
- `osService.js` linha 3338–3342: `item.descricao`, `item.quantidade`, `item.valor`

**Solução:**  
Padronizar todos os campos para `descricao`, `quantidade`, `valor` e atualizar `SidebarForm.jsx` para usar os mesmos nomes.

**Complexidade:** Baixa  
**Prioridade:** P0

---

### PROB-14 — `alert()` nativo no fluxo de recuperação de senha

**Problema:**  
`Login.jsx` usa `alert("E-mail de recuperação de senha enviado!")` em vez do sistema de notificações `react-hot-toast` já disponível no projeto.

**Impacto:**  
Inconsistência de UX; `alert()` bloqueia a thread e tem aparência nativa/feia.

**Gravidade:** Baixa  
**Evidências:** `Login.jsx` linha 2144.

**Solução:**  
```js
import { toast } from 'react-hot-toast';
// ...
toast.success("E-mail de recuperação de senha enviado!");
```

**Complexidade:** Baixa  
**Prioridade:** P3

---

### PROB-15 — Ausência de RLS confirmada no Supabase

**Problema:**  
Não foi possível analisar o `supabase_schema.sql` (erro de encoding no digest). Com base no código, todas as queries filtram `user_id` no frontend — mas sem Row Level Security no Supabase, um usuário com acesso à API key poderia consultar dados de outros usuários.

**Impacto:**  
Risco de vazamento de dados entre usuários (multi-tenant sem isolamento garantido no banco).

**Gravidade:** Crítica (se RLS não estiver ativo)  
**Evidências:** Impossível confirmar sem o schema SQL. O código não apresenta evidências de RLS configurado além do filtro por `user_id` nas queries.

**Solução:**  
Verificar e habilitar RLS em todas as tabelas:
```sql
ALTER TABLE os ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_proprios" ON os
  USING (auth.uid() = user_id);
-- Repetir para: clientes, produtos, equipamentos, empresas, os_items
```

**Complexidade:** Baixa  
**Prioridade:** P0

---

## 4. Sugestões de Novas Funcionalidades

### 4.1 — Documento de Orçamento com envio ao cliente

**Descrição:**  
Criar um fluxo de orçamento separado da OS, com documento próprio para envio ao cliente.

**Como implementar:**

1. Adicionar `tipo_documento: 'os' | 'orcamento'` ao modelo de OS.
2. Criar `PreviewOrcamento.jsx` com layout diferenciado (sem campos internos, com validade, com cláusula de aceite).
3. Adicionar `validade_orcamento` (data) e `orcamento_origem_id` (FK para si mesmo) ao banco.
4. Botão "Converter em OS" que cria uma nova OS vinculada ao orçamento.
5. Botão "Enviar por E-mail" usando `mailto:` com link de pré-visualização ou `window.print()` para PDF.

**Impacto:** Alto — resolve a necessidade de formalizar propostas antes da execução.

---

### 4.2 — Tipo de Atendimento (sem equipamento obrigatório)

**Descrição:**  
Tornar o equipamento completamente opcional na OS/Orçamento.

**Como implementar:**

1. Adicionar `tipo_atendimento` com valores: `'equipamento'`, `'servico'`, `'consultoria'`, `'instalacao'`, `'outro'`.
2. No `OSEditor`, exibir a seção de equipamento apenas quando `tipo_atendimento === 'equipamento'`.
3. No `PreviewA4`, exibir/ocultar a seção de equipamento condicionalmente.
4. No banco, `equipamento_id` e `equipamento_snapshot` passam a ser nullable.

```jsx
// No formulário
{data.tipo_atendimento === 'equipamento' && (
  <EquipamentoSection ... />
)}
```

---

### 4.3 — Status de Pagamento na OS

**Descrição:**  
Adicionar campo `status_pagamento` (`pendente`, `parcial`, `pago`) e método de pagamento (`dinheiro`, `pix`, `cartão`, `boleto`). Exibir no documento impresso e no dashboard.

**Impacto:** Médio — melhora controle financeiro sem requerer módulo financeiro completo.

---

### 4.4 — Assinatura digital do cliente

**Descrição:**  
Adicionar um canvas de assinatura (biblioteca `signature_pad`) ao `PreviewA4` que permite ao cliente assinar digitalmente no tablet/celular no momento da entrega.

**Impacto:** Médio — diferencial para prestadores que fazem entrega presencial e precisam de aceite formal.

---

### 4.5 — Histórico de status da OS (timeline)

**Descrição:**  
Criar tabela `os_historico` que registra cada mudança de status com timestamp e usuário. Exibir como linha do tempo na tela de detalhe da OS.

```sql
CREATE TABLE os_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES os(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);
```

---

### 4.6 — Link de acompanhamento público para o cliente

**Descrição:**  
Gerar um token único por OS que permite ao cliente acompanhar o status em uma página pública (sem login). URL: `/acompanhar/:token`.

**Impacto:** Alto para UX do cliente final — reduz ligações de "qual o status do meu equipamento?".

---

## 5. Roadmap Recomendado

### Curto Prazo (Sprint 1–2, ~2 semanas)

| # | Tarefa | Prioridade |
|---|--------|------------|
| 1 | Corrigir mismatch de nomenclatura dos itens (desc/qtd/val → descricao/quantidade/valor) | P0 |
| 2 | Verificar e habilitar RLS no Supabase | P0 |
| 3 | Tornar equipamento opcional na OS (tipo_atendimento) | P0 |
| 4 | Corrigir ano hardcoded na numeração de OS | P2 |
| 5 | Substituir `alert()` por `toast` no Login | P3 |
| 6 | Remover `App.css` com código morto do boilerplate | P2 |
| 7 | Remover estado duplicado `showProductManager` | P3 |

### Médio Prazo (Sprint 3–5, ~1 mês)

| # | Tarefa | Prioridade |
|---|--------|------------|
| 1 | Implementar fluxo de Orçamento + `PreviewOrcamento.jsx` | P0 |
| 2 | Implementar busca global funcional ou remover o campo do Header | P1 |
| 3 | Implementar exportação XLS ou remover botão | P2 |
| 4 | Configurar Vitest e escrever testes para os services | P1 |
| 5 | Refatorar `App.jsx` com Context API (OSContext + AuthContext) | P1 |
| 6 | Padronizar estilos do `SidebarForm.jsx` com o design system | P2 |
| 7 | Filtro server-side nos managers (clientes, produtos, equipamentos) | P2 |

### Longo Prazo (Sprint 6+, ~2–3 meses)

| # | Tarefa | Prioridade |
|---|--------|------------|
| 1 | Status de pagamento na OS | P1 |
| 2 | Histórico de status (timeline da OS) | P2 |
| 3 | Link de acompanhamento público para o cliente | P2 |
| 4 | Relatórios financeiros (a rota já existe mas está "Em breve") | P1 |
| 5 | Assinatura digital do cliente | P3 |
| 6 | Testes E2E com Playwright para fluxos críticos | P1 |
| 7 | CI/CD com GitHub Actions (lint + test + deploy) | P1 |

---

## 6. Quick Wins

Melhorias simples com alto impacto imediato:

1. **Corrigir campo `desc/qtd/val` → `descricao/quantidade/valor`** — 30 minutos, evita bug silencioso de dados.
2. **Remover `App.css` morto** — 2 minutos, remove ~530 linhas de ruído.
3. **Corrigir ano hardcoded** — 1 linha, evita bug garantido em 2027.
4. **`toast` no lugar de `alert()`** — 2 linhas.
5. **RLS no Supabase** — ~10 linhas de SQL, elimina risco crítico de segurança.
6. **Remover botão "Exportar XLS" ou botão de busca sem handler** — evita frustração do usuário.

---

## 7. Dívida Técnica

| Item | Impacto | Esforço |
|------|---------|---------|
| Ausência de testes | Alto — qualquer mudança é arriscada | Médio |
| `App.jsx` como God Component | Médio — dificulta manutenção e escala | Médio |
| Task.md referenciando Firebase | Baixo — confusão para novos devs | Baixo |
| CSS hardcoded no `SidebarForm.jsx` | Baixo — inconsistência visual | Baixo |
| Filtro client-side nos managers | Baixo (agora) / Médio (em escala) | Baixo |
| Sem CI/CD | Médio — deploys manuais e sem validação | Médio |
| Sem documentação de setup | Médio — onboarding de novos devs lento | Baixo |

---

## 8. O que NÃO Deve Ser Alterado

- **`save_os_transaction` via RPC:** transação atômica bem implementada. Não substituir por múltiplas chamadas REST.
- **`cliente_snapshot` na OS:** preservar dados históricos do cliente no momento da OS é uma decisão arquitetural correta. Não remover.
- **`getNextOSNumber` via RPC:** evita race condition. Manter no banco.
- **PWA com `vite-plugin-pwa`:** configuração correta, não alterar.
- **Onboarding forçado de empresa:** boa UX para garantir que o documento impresso tenha dados da empresa. Manter.
- **`supabase.auth.onAuthStateChange`:** padrão correto de gerenciamento de sessão reativa. Não substituir por polling.

---

## 9. Conclusão

O projeto está **pronto com ajustes**, mas **não pronto para produção** no estado atual por dois motivos críticos:

1. **Bug de dados silencioso (PROB-13):** a inconsistência `desc/qtd/val` vs `descricao/quantidade/valor` pode fazer com que itens sejam salvos com campos nulos. Isso precisa ser corrigido antes de qualquer uso em produção.

2. **RLS potencialmente ausente (PROB-15):** sem confirmar que o Row Level Security está ativo no Supabase, há risco real de vazamento de dados entre usuários.

Além disso, a ausência do fluxo de orçamento (PROB-02) e a rigidez do campo de equipamento (PROB-01) limitam significativamente o alcance do produto para diferentes perfis de prestadores de serviço.

Com as correções de P0 aplicadas (estimativa: 1–2 dias de desenvolvimento), o projeto pode ir para produção. As melhorias de P1 e P2 devem compor o backlog imediato das próximas 4 semanas.

A base técnica — stack moderna, transações atômicas, autenticação robusta via Supabase, PWA funcional — é sólida e merece ser evoluída. O projeto tem um bom fundamento; o que falta é refinamento de produto e cobertura de testes.
