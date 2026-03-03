# Plano de Refatoração — YPOTI Compras

> Regras: preservar funcionalidades, preservar UI recente, não alterar banco/dados, trabalhar incrementalmente.

---

## Fase 1 — Limpeza leve (zero risco)

Cada etapa é independente e pode ser feita isoladamente sem quebrar nada.

### 1.1 Completar rebrand: remover emerald/green residual do Header
**Arquivos:** `src/components/layout/Header.jsx`
- Linha 24: `bg-emerald-600` → `bg-[#1F2A44]` (azul marca)
- Linha 33: `bg-emerald-500/10` → `bg-[#C8A03A]/10`, `text-emerald-400` → `text-[#C8A03A]`

**Teste:** verificar visualmente Header no mobile (logo e avatar).

### 1.2 Substituir green funcional por cores da paleta (12 arquivos)
Substituir `green-400/500` por equivalentes na paleta. Mapeamento:
- **Indicadores de sucesso/aprovação** → `text-[#C8A03A]` / `bg-[#C8A03A]` (mustard)
- **Botão "Aprobar"** → gradiente mustard (ApprovalActions.jsx linha 62)
- **Barra de progresso** → mustard (ApprovalFlow.jsx linha 37)
- **"Más barato" / preço melhor** → mustard (QuotationPanel, QuotationCard, QuotationComparisonTable)
- **Toggles ativo/inativo** → manter green semântico OU trocar por mustard (UserCard, ParameterItemList)
- **Indicador USD live** → mustard (DesktopSidebar linha 119)
- **Badges de permissão** → mustard (SettingsScreen linha 52)
- **SENACSA auto-fill** → `sky-400`/`sky-500` (ParameterForm linhas 158, 218 — info, não sucesso)

**Arquivos afetados (12):**
1. `RequestDetail.jsx` (linhas 269, 562)
2. `DesktopSidebar.jsx` (linha 119)
3. `SettingsScreen.jsx` (linha 52)
4. `QuotationComparison.jsx` (linha 67)
5. `ApprovalActions.jsx` (linha 62)
6. `ParameterForm.jsx` (linhas 158, 218)
7. `QuotationPanel.jsx` (linhas 104-106)
8. `QuotationCard.jsx` (linhas 11, 15, 37, 53)
9. `QuotationComparisonTable.jsx` (linhas 30, 48)
10. `ApprovalFlow.jsx` (linha 37)
11. `UserCard.jsx` (linha 53)
12. `ParameterItemList.jsx` (linha 62)

**Teste:** verificar cada tela visualmente — cores devem comunicar o mesmo significado.

### 1.3 Remover exports não utilizados
**Ações:**
- `src/utils/sanitize.js`: remover `sanitizeEmail()` (linhas 44-51) — nunca importada
- `src/utils/ids.js`: remover `generateBudgetId()` (linhas 19-21) e `generateUserId()` (linhas 26-30) — nunca importados
- `src/constants/approvalConfig.js`: remover aliases `MANAGER_BY_ESTABLISHMENT` (linha 81), `DIRECTOR_BY_COMPANY` (linha 84), `STEP_TYPES` (linhas 116-121) — nunca importados

**Teste:** `npm run build` deve completar sem erros.

### 1.4 Remover animações CSS órfãs
**Arquivo:** `src/styles/globals.css`
- Remover keyframe `slideDown` (linhas 55-58)
- Remover keyframe `shimmer` (linhas 60-63)

**Teste:** `npm run build` + verificar que nenhuma animação existente quebrou.

---

## Fase 2 — Organização estrutural

Extrair código duplicado para módulos compartilhados. Cada etapa substitui duplicação por uma fonte única de verdade.

### 2.1 Extrair `invokeEdgeFunction` unificado
**Problema:** 3 implementações quase idênticas com diferenças sutis (retry, timeout).
**Ação:** Criar `src/lib/edgeFunctions.js` com uma função genérica:
```js
export async function invokeEdgeFunction(functionName, action, payload, options)
```
- Unifica token retrieval (fallback chain)
- Parâmetro opcional de retry (default: true para mutations, false para admin)
- Timeout configurável

**Refatorar:**
- `src/lib/queries.js`: substituir `invokeEdgeFunction` local pelo import
- `src/constants/users.js`: substituir `invokeAdmin` por chamada ao módulo compartilhado
- `src/constants/parameters.js`: substituir `invokeAdminData` por chamada ao módulo compartilhado

**Teste:** testar criar solicitação, aprovar, criar usuário, editar parâmetro.

### 2.2 Extrair `cleanName` para utilitário único
**Problema:** Função idêntica em `queries.js` (linha 121) e `parameters.js` (linha 9).
**Ação:** Mover para `src/utils/stringHelpers.js`:
```js
export function cleanName(name) { ... }
```
- Atualizar imports em `queries.js` e `parameters.js`

**Teste:** verificar que nomes de estabelecimentos aparecem sem emoji na UI.

### 2.3 Extrair `FilterPill` como componente compartilhado
**Problema:** Definido localmente em `Dashboard.jsx` (linhas 158-171) e `InventoryScreen.jsx` (linhas 35-48).
**Ação:** Criar `src/components/common/FilterPill.jsx`:
```jsx
export default function FilterPill({ label, active, onClick, activeColor })
```
- Usar a versão do Dashboard (mais completa, suporta `activeColor`)
- Substituir definição local nos dois arquivos por import

**Teste:** verificar filtros no Dashboard e no Inventário.

### 2.4 Extrair navegação compartilhada entre Sidebar e Drawer
**Problema:** Arrays `mainItems` e `adminItems` duplicados em `DesktopSidebar.jsx` (linhas 15-28) e `MobileDrawer.jsx` (linhas 12-25).
**Ação:** Criar `src/constants/navigation.js`:
```js
export function getNavItems(permissions, unreadCount) {
  return { mainItems: [...], adminItems: [...] };
}
```
- Ambos componentes importam e usam a mesma fonte

**Teste:** verificar navegação desktop e mobile — mesmos itens, mesma ordem.

### 2.5 Extrair sub-componentes inline do RequestDetail
**Problema:** `InfoGrid`, `InfoCell`, `ActionBtn` definidos inline no RequestDetail.jsx (linhas 33-77).
**Ação:** Criar `src/components/requests/RequestDetailParts.jsx`:
```jsx
export function InfoGrid({ children }) { ... }
export function InfoCell({ label, value, color, icon, span2 }) { ... }
export function ActionBtn({ label, icon, color, bg, outline, onClick, flex }) { ... }
```
- RequestDetail importa do novo arquivo

**Teste:** verificar tela de detalhe de solicitação — visual idêntico.

---

## Fase 3 — Melhorias arquiteturais

Mudanças que melhoram a manutenibilidade sem alterar comportamento.

### 3.1 Centralizar constantes hardcoded
**Ação:** Criar `src/constants/appConfig.js`:
```js
export const APP_CONFIG = {
  defaultUsdRate: 7800,
  emailDomain: 'ypoti.local',
  company: {
    name: 'GRUPO RURAL BIOENERGIA — YPOTI AGROPECUARIA',
    ruc: '80050418-6',
    address: 'Ruta 5 Km 350, Horqueta, Concepción',
  },
  whatsapp: '595986354781',
  exchangeRateApi: 'https://api.exchangerate-api.com/v4/latest/USD',
  exchangeRefreshMs: 30 * 60 * 1000,
};
```
- Atualizar referências em: `App.jsx`, `pdfGenerator.js`, `AuthContext.jsx`, `DesktopSidebar.jsx`

**Teste:** verificar PDFs gerados, taxa USD, login.

### 3.2 Padronizar boilerplate das Edge Functions
**Ação:** Criar `supabase/functions/_shared/handler.ts`:
```ts
export function handleEdgeFunction(handler: (req, caller, admin) => Promise<Response>)
```
Encapsula:
- CORS preflight
- Auth extraction + profile loading
- try/catch com error logging
- Response helpers: `successResponse(data)`, `errorResponse(message, status)`

**Refatorar** as 4 Edge Functions para usar o wrapper.

**Teste:** testar todos os fluxos de escrita (criar, aprovar, rejeitar, comentar, cotar, cancelar, criar usuário, editar parâmetro).

### 3.3 Padronizar nomenclatura de componentes
**Ação (renomear arquivos):**
- `Dashboard.jsx` → `DashboardScreen.jsx` (consistência com outros *Screen)
- Em `src/components/quotations/`: renomear `QuotationPanel.jsx` → `QuotationModal.jsx` (é um modal, não panel)

**Atualizar** imports em `App.jsx` e `RequestDetail.jsx`.

**Teste:** `npm run build` sem erros + navegação funcional.

### 3.4 Criar barrel exports para diretórios shared/common
**Ação:** Criar `src/components/common/index.js`:
```js
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as FilterPill } from './FilterPill';
export { default as KPICard } from './KPICard';
export { default as ModalBackdrop } from './ModalBackdrop';
export { default as Notification } from './Notification';
export { default as PageHeader } from './PageHeader';
export { default as SearchInput } from './SearchInput';
export { default as SummaryRow } from './SummaryRow';
export { default as BackButton } from './BackButton';
```

Criar `src/components/shared/index.js` (mesmo padrão).

Permite imports mais limpos:
```js
import { FilterPill, PageHeader, BackButton } from '../common';
```

**Teste:** `npm run build` sem erros.

---

## Resumo de impacto

| Fase | Etapas | Arquivos tocados | Risco | Tempo estimado |
|------|--------|-----------------|-------|----------------|
| **1 — Limpeza** | 4 | ~16 | Nenhum | — |
| **2 — Organização** | 5 | ~12 | Baixo | — |
| **3 — Arquitetura** | 4 | ~15 | Baixo | — |

**Total: 13 etapas independentes, todas reversíveis via git.**

Cada etapa pode ser um commit isolado. Se qualquer etapa causar regressão, basta reverter aquele commit sem afetar os demais.
