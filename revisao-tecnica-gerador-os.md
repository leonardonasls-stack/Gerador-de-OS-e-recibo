# Revisão Técnica — Gerador de OS
> **Arquiteto:** Staff Engineer Review  
> **Data:** Setembro/2026  
> **Stack:** React 19 · Vite 8 · Supabase · Tailwind 4 · PWA

---

## Resumo Executivo

O projeto é uma SPA (Single Page Application) para geração de Ordens de Serviço, voltada a técnicos autônomos ou pequenas empresas. A stack é moderna, as decisões de backend-as-a-service com Supabase são acertadas para o porte, e o RLS está configurado. Contudo, há problemas relevantes de acoplamento, schema de banco frágil, ausência de testes e dívidas técnicas que precisam ser endereçadas antes de uma operação estável em produção.

| Dimensão       | Nota |
|----------------|------|
| Arquitetura    | 5/10 |
| Código         | 5/10 |
| Segurança      | 6/10 |
| Performance    | 5/10 |
| Documentação   | 3/10 |
| Testes         | 0/10 |
| DevOps         | 4/10 |
| Escalabilidade | 5/10 |
| Manutenção     | 4/10 |

---

## Pontos Fortes

- **RLS bem configurado** — todas as tabelas têm Row Level Security ativo com políticas por `user_id`. A política de `os_items` que faz um `EXISTS` na tabela `os` é particularmente correta e segura.
- **Separação em camada de serviços** — `osService.js`, `profileService.js` e `supabase.js` isolam os acessos ao Supabase, facilitando manutenção e eventual troca de provider.
- **Uso de `cliente_snapshot` (JSONB)** — snapshot dos dados do cliente no momento da OS é uma decisão arquitetural excelente para preservar o histórico imutável mesmo que o cliente seja editado depois.
- **PWA configurado** — `vite-plugin-pwa` com `autoUpdate` é uma boa escolha para o público-alvo que trabalha em campo.
- **Stack atual** — React 19, Vite 8, Tailwind 4 e Supabase são escolhas sólidas e com suporte ativo.
- **`get_next_os_number` como função Postgres** — delegar a geração sequencial para o banco é correta e evita race conditions no cliente.

---

## Problemas Encontrados

---

### P01 — Colisão de race condition no número de OS

**Problema:** A função `get_next_os_number` usa `MAX(numero) + 1` sem lock. Se dois usuários do mesmo tenant gerarem uma OS simultaneamente, podem obter o mesmo número.

**Impacto:** Duplicação de número de OS, problema legal e operacional sério.

**Gravidade:** Alta

**Evidências:** `supabase_schema.sql` linhas 241–253

```sql
SELECT COALESCE(MAX(numero), 0) + 1 INTO next_num
FROM public.os WHERE user_id = p_user_id;
```

**Solução:** Usar uma sequência por usuário com `SELECT ... FOR UPDATE` ou uma tabela de contadores com lock atômico:

```sql
-- Opção recomendada: tabela de contadores
CREATE TABLE public.os_counter (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  ultimo_numero INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION get_next_os_number(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE next_num INTEGER;
BEGIN
  INSERT INTO public.os_counter (user_id, ultimo_numero)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET ultimo_numero = os_counter.ultimo_numero + 1
  RETURNING ultimo_numero INTO next_num;
  RETURN next_num;
END;
$$;
```

**Justificativa:** `INSERT ... ON CONFLICT ... RETURNING` é atômico no PostgreSQL — elimina a race condition sem lock explícito.

**Complexidade:** Baixa  
**Prioridade:** P0

---

### P02 — Schema de banco com nomes de colunas abreviados e ambíguos

**Problema:** Colunas chamadas `"end"`, `"desc"`, `"val"`, `"qtd"`, `"doc"`, `"fone"` são palavras reservadas ou abreviações sem significado claro. `"end"` é palavra reservada em SQL em alguns dialetos.

**Impacto:** Dificuldade de manutenção, risco de conflito em queries futuras, onboarding lento para novos devs.

**Gravidade:** Média

**Evidências:** `supabase_schema.sql` — todas as tabelas

**Solução (migration):**
```sql
ALTER TABLE public.clientes   RENAME COLUMN "end"  TO endereco;
ALTER TABLE public.clientes   RENAME COLUMN "doc"  TO documento;
ALTER TABLE public.empresas   RENAME COLUMN "end"  TO endereco;
ALTER TABLE public.empresas   RENAME COLUMN "fone" TO telefone;
ALTER TABLE public.produtos   RENAME COLUMN "val"  TO valor;
ALTER TABLE public.os_items   RENAME COLUMN "desc" TO descricao;
ALTER TABLE public.os_items   RENAME COLUMN "qtd"  TO quantidade;
ALTER TABLE public.os_items   RENAME COLUMN "val"  TO valor;
```

Atualizar todos os serviços e componentes correspondentes.

**Justificativa:** Nomenclatura expressiva é um dos princípios mais básicos de manutenibilidade. O custo de renomear agora é zero; depois de 10.000 registros e um time maior, é alto.

**Complexidade:** Média  
**Prioridade:** P1

---

### P03 — Colunas ausentes no schema que existem no código

**Problema:** Dois campos existem no código mas foram comentados por falta de coluna no banco:

- `obsInterna` (removido de `osService.js` linha 3087)
- `obs` (removido de `ClientManager.jsx` linha 1271)

O código silenciosamente ignora esses dados — o usuário preenche e nada é salvo.

**Impacto:** Perda silenciosa de dados. O usuário preenche "Observações Internas" e o dado é descartado sem aviso.

**Gravidade:** Alta

**Evidências:** `src/services/osService.js` linha 3087; `src/components/ClientManager.jsx` linha 1271

**Solução:**

```sql
-- Migration
ALTER TABLE public.os      ADD COLUMN obs_interna TEXT;
ALTER TABLE public.clientes ADD COLUMN obs TEXT;
```

Depois remover os comentários e restaurar os campos no `osPayload` e no `payload` do `ClientManager`.

**Justificativa:** Perda de dados é inaceitável em qualquer sistema de produção. O comentário `// Removido temporariamente` virou permanente.

**Complexidade:** Baixa  
**Prioridade:** P0

---

### P04 — Endereço armazenado como string concatenada com parse por regex

**Problema:** O endereço do cliente é montado manualmente como string formatada e depois desmembrado via regex frágil em `App.jsx` (linha 789) e `ClientManager.jsx` (linha 1319). Qualquer variação de formato (complemento com parênteses, cidade com vírgula) quebra o parse.

**Impacto:** Dados de endereço corrompidos ao editar; regex fácil de falhar em casos reais brasileiros (ex: "Av. Brasil, 1500 (Bloco A, Sala 203) - Centro - São Paulo - CEP: 01310-100").

**Gravidade:** Alta

**Evidências:** `App.jsx` linhas 789–800; `ClientManager.jsx` linhas 1319–1328; `supabase_schema.sql` tabela `clientes`

**Solução:** Adicionar colunas estruturadas no banco e abandonar a string concatenada:

```sql
ALTER TABLE public.clientes
  ADD COLUMN cep        TEXT,
  ADD COLUMN rua        TEXT,
  ADD COLUMN numero_end TEXT,
  ADD COLUMN complemento TEXT,
  ADD COLUMN bairro     TEXT,
  ADD COLUMN cidade     TEXT,
  DROP COLUMN "end";
```

Remover toda a lógica de parse por regex nos componentes.

**Justificativa:** Dados estruturados são a base para filtros, relatórios e integração com APIs de CEP. A regex é uma gambiarra com validade limitada.

**Complexidade:** Média  
**Prioridade:** P1

---

### P05 — App.jsx com mais de 400 linhas e responsabilidades demais (God Component)

**Problema:** `App.jsx` acumula: gerenciamento de autenticação, carregamento de dados da empresa, geração de número de OS, estado global de todos os modais, handlers de itens, lógica de salvamento, lógica de PWA install, roteamento e renderização.

**Impacto:** Dificuldade para testar isoladamente qualquer função; qualquer mudança de estado pode afetar comportamentos não relacionados; onboarding de novos devs confuso.

**Gravidade:** Média

**Evidências:** `src/App.jsx` — função `AppContent` (linhas 683–1091)

**Solução:** Extrair em hooks e contextos:

```
src/
  context/
    AuthContext.jsx       ← session, user, loadingAuth
    OSContext.jsx         ← data, handlers de item, handleSave, handleNewOS
  hooks/
    useCompany.js         ← carregamento e atualização da empresa
    usePWAInstall.js      ← deferredPrompt, handleInstallPwa
  App.jsx                 ← somente roteamento + providers
```

**Justificativa:** Separação de responsabilidades (SRP do SOLID). Cada contexto/hook tem uma razão para mudar.

**Complexidade:** Média  
**Prioridade:** P1

---

### P06 — Cálculo de métricas do Dashboard carregando toda a lista de OS no cliente

**Problema:** `Dashboard.jsx` chama `getOSList(user.id)` (que busca todas as OS com itens aninhados) apenas para calcular 4 métricas simples. Em um usuário com 500+ OS, isso trafega dados desnecessários.

**Impacto:** Lentidão perceptível no carregamento do Dashboard; custo de rede desnecessário; piora com o crescimento do volume.

**Gravidade:** Média

**Evidências:** `src/views/Dashboard.jsx` linhas 3373–3430

**Solução:** Criar uma função RPC no Supabase que retorna apenas as métricas calculadas no banco:

```sql
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_user_id UUID, p_mes INT, p_ano INT)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'abertas',          COUNT(*) FILTER (WHERE status IN ('Aberta', 'Em Andamento')),
    'concluidasHoje',   COUNT(*) FILTER (WHERE status = 'Finalizada' AND data = to_char(now(), 'DD/MM/YYYY')),
    'faturamentoMes',   COALESCE(SUM(...) FILTER (WHERE ...), 0),
    'ticketMedio',      ...
  ) INTO result FROM public.os WHERE user_id = p_user_id;
  RETURN result;
END;
$$;
```

**Justificativa:** Cálculos agregados pertencem ao banco. Reduz tráfego, melhora performance e mantém a lógica de negócio em um único lugar.

**Complexidade:** Média  
**Prioridade:** P2

---

### P07 — Data da OS armazenada como TEXT no banco

**Problema:** A coluna `data` na tabela `os` é `TEXT` (formato `DD/MM/YYYY`). Isso impede ordenação cronológica nativa, filtros por intervalo de datas e comparações diretas no banco.

**Impacto:** O problema no Dashboard (P06) existe justamente por isso — é impossível filtrar `WHERE data BETWEEN ...` com o formato atual.

**Gravidade:** Alta

**Evidências:** `supabase_schema.sql` linha 183; `Dashboard.jsx` linhas 3403–3409 (parse manual de data)

**Solução:**

```sql
-- Migration com conversão de dados
ALTER TABLE public.os ADD COLUMN data_os DATE;
UPDATE public.os SET data_os = to_date(data, 'DD/MM/YYYY') WHERE data ~ '^\d{2}/\d{2}/\d{4}$';
ALTER TABLE public.os DROP COLUMN data;
ALTER TABLE public.os RENAME COLUMN data_os TO data;
```

No frontend, formatar para exibição apenas na camada de apresentação.

**Justificativa:** Tipos corretos no banco são a base de qualquer query eficiente. `TEXT` para data é um antipadrão clássico com consequências que crescem com o volume de dados.

**Complexidade:** Média  
**Prioridade:** P1

---

### P08 — Sincronização de itens da OS com delete + insert (ausência de transação)

**Problema:** Em `osService.js`, ao editar uma OS, o código deleta todos os itens e reinsere. Se o insert falhar, a OS fica sem itens. Não há transação envolvendo o update da OS e a manipulação dos itens.

**Impacto:** Inconsistência de dados em caso de falha de rede parcial.

**Gravidade:** Alta

**Evidências:** `src/services/osService.js` linhas 3112–3124

**Solução:** Usar uma função RPC no Supabase que executa tudo em uma transação:

```sql
CREATE OR REPLACE FUNCTION save_os(p_user_id UUID, p_os JSONB, p_items JSONB[])
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_os_id UUID;
BEGIN
  -- upsert OS
  INSERT INTO public.os (...) VALUES (...) ON CONFLICT (id) DO UPDATE SET ...
  RETURNING id INTO v_os_id;
  -- sincronizar itens
  DELETE FROM public.os_items WHERE os_id = v_os_id;
  INSERT INTO public.os_items SELECT v_os_id, ... FROM unnest(p_items);
  RETURN v_os_id;
END;
$$;
```

**Justificativa:** Atomicidade é fundamental. Operações que devem ser um ou tudo precisam de transação.

**Complexidade:** Média  
**Prioridade:** P0

---

### P09 — `supabase.js` não valida variáveis de ambiente

**Problema:** Se `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` estiverem ausentes, o `createClient` recebe `undefined` e falha silenciosamente ou com erros crípticos.

**Impacto:** Deploy com `.env` faltando resulta em erros confusos, difíceis de diagnosticar.

**Gravidade:** Média

**Evidências:** `src/services/supabase.js` linhas 3317–3320

**Solução:**

```js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.'
  );
}
```

**Justificativa:** Fail fast com mensagem clara é sempre melhor do que erros em cascata.

**Complexidade:** Baixa  
**Prioridade:** P1

---

### P10 — `Date.now()` como ID de item local (colisão garantida em inserção rápida)

**Problema:** Itens da OS são identificados com `id: Date.now()`. Em inserções rápidas (adicionar vários itens em menos de 1ms), o ID pode colidir, causando comportamento incorreto no `key` do React e no `updateItem`/`removeItem`.

**Impacto:** Remoção ou edição do item errado; warning de key duplicada no React.

**Gravidade:** Média

**Evidências:** `App.jsx` linhas 696, 814, 821, 857, 877

**Solução:** Usar `crypto.randomUUID()` disponível em todos os browsers modernos:

```js
items: [{ id: crypto.randomUUID(), desc: '', qtd: 1, val: 0.00 }]
```

**Justificativa:** `crypto.randomUUID()` é nativo, sem dependência, e garante unicidade sem colisão.

**Complexidade:** Baixa  
**Prioridade:** P2

---

### P11 — `useEffect` com dependência `[user]` sem cleanup no Dashboard

**Problema:** `Dashboard.jsx` tem um `useEffect` que chama `loadMetrics` com `[user]` como dependência. `loadMetrics` não está memoizada (não está em `useCallback`), o que pode causar loops se o componente re-renderizar por outras razões. Além disso, não há cancelamento da requisição assíncrona se o componente for desmontado antes do retorno.

**Impacto:** Potencial memory leak e setState em componente desmontado.

**Gravidade:** Baixa

**Evidências:** `src/views/Dashboard.jsx` linhas 3432–3434

**Solução:**

```jsx
useEffect(() => {
  let cancelled = false;
  const load = async () => {
    const result = await loadMetrics();
    if (!cancelled) setMetrics(result);
  };
  if (user) load();
  return () => { cancelled = true; };
}, [user?.id]); // depende do ID, não do objeto inteiro
```

**Justificativa:** Boa prática padrão com async em useEffect. Evita o warning do React sobre setState em componente desmontado.

**Complexidade:** Baixa  
**Prioridade:** P2

---

### P12 — `package.json` com nome `temp-vite` e versão `0.0.0`

**Problema:** Nome e versão do projeto nunca foram atualizados após o scaffolding inicial.

**Impacto:** Confusão ao publicar, ao visualizar no Vercel, ou ao comparar versões deployadas.

**Gravidade:** Baixa

**Evidências:** `package.json` linhas 2–3

**Solução:**

```json
{
  "name": "gerador-os",
  "version": "1.0.0"
}
```

**Complexidade:** Baixa  
**Prioridade:** P3

---

### P13 — Ausência completa de testes

**Problema:** O projeto não possui nenhum teste unitário, de integração ou E2E. Não há `vitest`, `jest`, `playwright` ou similar nas dependências.

**Impacto:** Qualquer refatoração (inclusive as sugeridas neste relatório) é feita às cegas. Regressões só são descobertas em produção.

**Gravidade:** Alta

**Evidências:** `package.json` — ausência de qualquer dependência de teste

**Solução:** Priorizar testes nos módulos de maior risco:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event
```

Cobrir primeiro:
- `osService.js` — lógica de número de OS, montagem de payload
- `profileService.js` — CRUD de clientes e produtos
- `App.jsx` — fluxo de login e criação de OS

**Justificativa:** Testes são o único mecanismo que garante que correções não introduzam regressões. Para um sistema que lida com dados financeiros de negócios reais, é crítico.

**Complexidade:** Alta  
**Prioridade:** P1

---

### P14 — `html lang="en"` com aplicação em português

**Problema:** O `index.html` declara `lang="en"` mas toda a interface é em português brasileiro.

**Impacto:** Acessibilidade prejudicada (leitores de tela usam o idioma para pronunciar corretamente); SEO incorreto.

**Gravidade:** Baixa

**Evidências:** `index.html` linha 66

**Solução:**

```html
<html lang="pt-BR">
```

**Complexidade:** Baixa  
**Prioridade:** P3

---

### P15 — Inconsistência de sistema de design (Tailwind + Material Symbols + classes hardcoded)

**Problema:** O projeto usa Tailwind 4 com tokens customizados no `tailwind.config.js` e `index.css`, mas os componentes misturam:
- Classes Tailwind nativas (`bg-white`, `text-slate-900`)
- Classes de token custom (`bg-brand-navy`, `text-brand-accent`)  
- Cores hardcoded em hex inline (`bg-[#1a5276]`, `bg-[#e74c3c]`, `bg-[#28b463]`)
- Ícones Material Symbols via CDN externo + `lucide-react` instalado mas aparentemente não usado

**Impacto:** Mudança de cor primária requer busca/substituição em múltiplos arquivos; `lucide-react` é uma dependência de 600KB adicionada sem uso; carregamento de font do Google é bloqueante.

**Gravidade:** Média

**Evidências:** `SidebarForm.jsx` linha 3022 (`bg-[#e74c3c]`), `OSHistory.jsx`, `App.jsx` linha 1064; `package.json` linha 106

**Solução:**
1. Mapear todas as cores hardcoded para tokens no `tailwind.config.js` ou `index.css`
2. Remover `lucide-react` se não for usado, ou substituir Material Symbols por ele (evita CDN externo)
3. Usar `font-display: swap` ou `<link rel="preload">` para as fontes

**Complexidade:** Média  
**Prioridade:** P2

---

### P16 — Função `get_next_os_number` sem `SECURITY DEFINER` e sem restrição de uso

**Problema:** A função RPC é chamada pelo cliente via `supabase.rpc()` com a anon key. Qualquer usuário autenticado pode chamar `get_next_os_number` com o `user_id` de outro usuário — a função não verifica se `p_user_id == auth.uid()`.

**Impacto:** Um usuário pode consultar quantas OS outro usuário tem (vazamento de informação de negócio).

**Gravidade:** Média

**Evidências:** `supabase_schema.sql` linhas 241–253; `src/services/osService.js` linha 3060

**Solução:**

```sql
CREATE OR REPLACE FUNCTION get_next_os_number(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Garante que só o próprio usuário pode chamar
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  -- ... lógica de sequência
END;
$$;
```

**Complexidade:** Baixa  
**Prioridade:** P1

---

### P17 — `firestore.rules` presente mas Firebase não está em uso

**Problema:** O arquivo `firestore.rules` existe no repositório, sugerindo que o projeto foi migrado do Firebase para o Supabase mas o arquivo antigo não foi removido. O `task.md` também menciona Firebase como stack original.

**Impacto:** Confusão para novos desenvolvedores; possibilidade de acreditar que há dependência do Firebase; ruído no repositório.

**Gravidade:** Baixa

**Evidências:** `firestore.rules`; `task.md` mencionando Firebase

**Solução:** Remover `firestore.rules` e atualizar `task.md` para refletir a stack atual (Supabase).

**Complexidade:** Baixa  
**Prioridade:** P3

---

### P18 — Ausência de variável `.env.example`

**Problema:** Não há `.env.example` no repositório. Novos desenvolvedores não sabem quais variáveis de ambiente são necessárias sem ler o código.

**Impacto:** Tempo de onboarding desnecessário; erros de configuração evitáveis.

**Gravidade:** Baixa

**Solução:** Criar `.env.example`:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

**Complexidade:** Baixa  
**Prioridade:** P2

---

### P19 — Índices ausentes no banco de dados

**Problema:** As tabelas `os`, `clientes` e `produtos` possuem apenas o índice primário implícito. Não há índices em `user_id` (coluna de filtro em todas as queries) nem em `numero` (coluna de ordenação e busca).

**Impacto:** Com crescimento de volume, queries ficam cada vez mais lentas — o Supabase fará full table scan para qualquer consulta filtrada por `user_id`.

**Gravidade:** Média

**Evidências:** `supabase_schema.sql` — ausência de `CREATE INDEX`

**Solução:**

```sql
CREATE INDEX idx_os_user_id        ON public.os(user_id);
CREATE INDEX idx_os_numero         ON public.os(user_id, numero DESC);
CREATE INDEX idx_clientes_user_id  ON public.clientes(user_id);
CREATE INDEX idx_produtos_user_id  ON public.produtos(user_id);
CREATE INDEX idx_os_items_os_id    ON public.os_items(os_id);
```

**Justificativa:** Índices em colunas de filtro são a otimização de banco com maior retorno por menor esforço.

**Complexidade:** Baixa  
**Prioridade:** P1

---

## Boas Práticas que NÃO devem ser alteradas

- **`cliente_snapshot` (JSONB):** Decisão arquitetural correta — preservar o estado do cliente no momento da OS é essencial para integridade histórica de documentos.
- **Separação em `src/services/`:** A camada de serviços está bem isolada e é o padrão correto para SPA com BaaS.
- **RLS no Supabase:** Configuração correta e completa. Não simplificar em nome de conveniência.
- **`vercel.json` com rewrite para SPA:** Configuração correta e necessária para React Router.
- **`StrictMode` no `main.jsx`:** Deve ser mantido em desenvolvimento.
- **Uso do `maybeSingle()` no `getCompanyData`:** Evita erro quando não há resultado — uso correto da API do Supabase.

---

## Roadmap Recomendado

### Curto Prazo (Sprint 1–2, até 2 semanas)

| # | Ação | Prioridade |
|---|------|------------|
| 1 | Adicionar colunas `obs_interna` (OS) e `obs` (clientes) — P03 | P0 |
| 2 | Corrigir race condition do número de OS — P01 | P0 |
| 3 | Envolver save/itens em transação via RPC — P08 | P0 |
| 4 | Validar variáveis de ambiente no `supabase.js` — P09 | P1 |
| 5 | Adicionar `SECURITY DEFINER` + check na função RPC — P16 | P1 |
| 6 | Criar índices no banco — P19 | P1 |
| 7 | Criar `.env.example` — P18 | P2 |
| 8 | Corrigir `lang="pt-BR"` no `index.html` — P14 | P3 |
| 9 | Remover `firestore.rules` e limpar `task.md` — P17 | P3 |
| 10 | Corrigir `package.json` nome e versão — P12 | P3 |

### Médio Prazo (Sprint 3–6, 1–2 meses)

| # | Ação | Prioridade |
|---|------|------------|
| 1 | Migration do campo `data` de TEXT para DATE — P07 | P1 |
| 2 | Migration do endereço para colunas estruturadas — P04 | P1 |
| 3 | Renomear colunas abreviadas — P02 | P1 |
| 4 | Extrair `AuthContext`, `OSContext` e hooks de `App.jsx` — P05 | P1 |
| 5 | Substituir `Date.now()` por `crypto.randomUUID()` — P10 | P2 |
| 6 | Criar função RPC de métricas do Dashboard — P06 | P2 |
| 7 | Iniciar cobertura de testes (`vitest`) — P13 | P1 |
| 8 | Corrigir `useEffect` do Dashboard com cleanup — P11 | P2 |

### Longo Prazo (2–6 meses)

| # | Ação |
|---|------|
| 1 | Consolidar sistema de design: eliminar cores hardcoded, unificar biblioteca de ícones |
| 2 | Atingir cobertura de 60%+ nos módulos de serviço e hooks críticos |
| 3 | Implementar relatórios financeiros (a rota já existe como placeholder) |
| 4 | Considerar internacionalização (i18n) se houver planos de expansão |
| 5 | Avaliar observabilidade (Sentry ou similar) para monitoramento de erros em produção |

---

## Quick Wins (alto impacto, baixo esforço)

1. **`.env.example`** — 5 minutos, elimina confusão de onboarding
2. **`lang="pt-BR"`** — 30 segundos, melhora acessibilidade
3. **Validação de env no `supabase.js`** — 10 linhas, evita erros crípticos
4. **`crypto.randomUUID()` em vez de `Date.now()`** — substituição global simples
5. **Índices no banco** — 6 linhas de SQL, ganho de performance imediato
6. **Remover `firestore.rules`** — limpeza de repositório

---

## Dívida Técnica

| Item | Estimativa de Esforço | Risco se não resolvido |
|------|----------------------|------------------------|
| Endereço como string concatenada | 2–3 dias | Dados corrompidos ao editar; impossibilidade de filtros geográficos |
| Data como TEXT | 1–2 dias | Impossibilidade de relatórios temporais corretos |
| God Component App.jsx | 3–5 dias | Cada nova feature aumenta o acoplamento; bugs difíceis de isolar |
| Ausência de testes | 5–10 dias (setup + cobertura inicial) | Regressões silenciosas a cada deploy |
| Schema com nomes abreviados | 2–3 dias | Manutenção lenta; erros por ambiguidade |

---

## Conclusão

O projeto está **pronto para uso com ajustes significativos antes de escalar**.

Para um uso individual ou de volume baixo (< 200 OS/mês), pode ir para produção após as correções P0 (P01, P03, P08). Os problemas de perda silenciosa de dados (P03) são os mais urgentes — o usuário preenche campos que são simplesmente ignorados, o que destrói a confiança no sistema.

Os problemas P1 (schema, índices, autenticação da função RPC, validação de env) devem ser resolvidos antes de qualquer crescimento de base de usuários ou volume de dados.

A ausência de testes (P13) é o risco de longo prazo mais crítico: as migrações de schema e refatorações recomendadas neste relatório são perigosas sem uma rede de segurança mínima de testes automatizados.

A stack e as decisões arquiteturais fundamentais (Supabase + RLS + snapshot de cliente) são sólidas. O projeto tem uma base boa; as dívidas são de execução, não de direção.
