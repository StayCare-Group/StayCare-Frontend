---
name: staycare-frontend
description: Code templates and checklist for the StayCare frontend (Vue 3 + Vite + Pinia + vue-i18n + Tailwind). Use when creating or editing Vue components, API services, utils/mappers, stores, composables, modals, tables or frontend tests.
---

# StayCare Frontend Skill

Read `.agents/rules/frontend-architecture.md` and `.agents/rules/i18n.md`
first; this skill adds ready-to-copy templates. Paths relative to `StayCare/src/`.

## Golden rules

- API service: only `apiFetch` calls. No formatting, no UI logic.
- Utils: pure functions (mapping, pricing, status helpers) → easy to test.
- Component: render + interaction; uses stores, utils and API services.
- Every visible string via `t(...)`, key added to `en.json` **and** `es.json`.
- Errors → `ui.showError(formatApiErrorMessage(err, t('…'), t))`.

## API service template (`api/things.ts`)

```typescript
import { apiFetch } from './client'

export function getThings(params: { page?: number; limit?: number } = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  return apiFetch(`/api/things?${query.toString()}`)
}

export function createThing(payload: { name: string }) {
  return apiFetch('/api/things', { method: 'POST', body: JSON.stringify(payload) })
}
```

Paginated responses: the returned array exposes `result._pagination`.

## Component template (load + action + confirm modal)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'
import { formatApiErrorMessage } from '@/utils/errors'
import { getThings, deleteThing } from '@/api/things'
import LoadingPanel from '@/Components/ui/LoadingPanel.vue'
import AppModal from '@/Components/ui/AppModal.vue'
import AppButton from '@/Components/ui/AppButton.vue'

const { t } = useI18n()
const ui = useUiStore()

const things = ref([])
const loading = ref(true)
const thingToDelete = ref(null)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    things.value = await getThings()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('things.loadError'), t))
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  if (!thingToDelete.value || deleting.value) return
  deleting.value = true
  try {
    await deleteThing(thingToDelete.value.id)
    ui.showSuccess(t('things.deleted'))
    thingToDelete.value = null
    await load()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('things.deleteError'), t))
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>
```

Template: `<LoadingPanel v-if="loading" />`, explicit empty state with a
translated message, `DataTable` for lists, `AppModal` + `AppButton
variant="danger" :loading="deleting"` for the confirmation.

## Status / role logic

```typescript
import { isEditableStatus, isCancelableStatus } from '@/utils/orderFlow'
const authStore = useAuthStore()
const canEdit = computed(() => isEditableStatus(order.value?.status, authStore.isAdminOrStaff))
```

Never hardcode status arrays or role strings in components.

## Test template (`__tests__/<mirror path>/Thing.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import en from '@/i18n/en.json'

vi.mock('@/api/things', () => ({ getThings: vi.fn(), deleteThing: vi.fn() }))

function createTestI18n() {
  return createI18n({ legacy: false, locale: 'en', messages: { en } })
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})
```

## Checklist before delivering

1. No `alert`/`confirm`; confirmations use `AppModal`.
2. Errors via `formatApiErrorMessage` + `ui.showError`; no inline error cards.
3. HTTP only in `api/`; pure logic in `utils/`.
4. Status/role logic from `orderFlow.ts` / `roles.ts` / `authStore`.
5. No `null` assumptions for driver/route/stop.
6. All new text in `en.json` and `es.json` with identical keys/placeholders.
7. Base UI components reused (`TitleHeader`, `AppButton`, `DataTable`, `LoadingPanel`).
8. Mirror test added/updated; `npm test` (and `npm run build` if needed) executed.
9. Backend contract change needed? reported.
