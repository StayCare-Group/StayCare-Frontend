<template>
  <div class="bg-white rounded-xl shadow-sm p-5 space-y-6">
    <!-- ─── Roles Section ──────────────────────────────────────────────── -->
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {{ $t('subUsers.rolesTitle', { count: roles.length }) }}
        </h3>
        <button
          v-if="!readonly"
          type="button"
          class="text-xs font-semibold text-brand-700 hover:underline"
          @click="openRoleModal(null)"
        >
          {{ $t('subUsers.addRole') }}
        </button>
      </div>

      <LoadingPanel v-if="loadingRoles" :label="$t('common.loading')" />

      <template v-if="!loadingRoles">
        <p v-if="roles.length === 0" class="text-sm text-gray-400">
          {{ $t('subUsers.rolesEmpty') }}
        </p>

        <div v-else class="space-y-2">
          <div
            v-for="role in roles"
            :key="role.id"
            class="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ role.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5 truncate">
                {{ role.permissions.map(p => p.name).join(', ') || $t('subUsers.noPermissions') }}
              </p>
            </div>
            <div v-if="!readonly" class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="text-xs text-brand-600 hover:text-brand-800 font-medium px-2 py-1 rounded hover:bg-brand-50"
                @click="openRoleModal(role)"
              >
                {{ $t('common.edit') }}
              </button>
              <button
                type="button"
                class="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                @click="confirmDeleteRole(role)"
              >
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <hr class="border-gray-100" />

    <!-- ─── Sub-Users Section ─────────────────────────────────────────── -->
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {{ $t('subUsers.usersTitle', { count: subUsersTotal }) }}
        </h3>
        <button
          v-if="!readonly"
          type="button"
          class="text-xs font-semibold text-brand-700 hover:underline"
          :disabled="roles.length === 0"
          :title="roles.length === 0 ? $t('subUsers.needRoleFirst') : undefined"
          @click="openUserModal(null)"
        >
          {{ $t('subUsers.addUser') }}
        </button>
      </div>

      <!-- Search -->
      <input
        v-model="search"
        type="search"
        :placeholder="$t('subUsers.searchPlaceholder')"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        @input="onSearch"
      />

      <LoadingPanel v-if="loadingUsers" :label="$t('common.loading')" />

      <template v-if="!loadingUsers">
        <p v-if="subUsers.length === 0" class="text-sm text-gray-400">
          {{ $t('subUsers.usersEmpty') }}
        </p>

        <DataTable
          v-else
          :headers="userHeaders"
          :items="subUsers"
          :empty-text="$t('subUsers.usersEmpty')"
          row-key="id"
          min-width="500px"
        >
          <template #cell-is_active="{ value }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >
              {{ value ? $t('common.active') : $t('common.inactive') }}
            </span>
          </template>
          <template #cell-role="{ value }">
            <span class="text-xs text-gray-500">{{ value }}</span>
          </template>
          <template v-if="!readonly" #cell-actions="{ item }">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="text-xs text-brand-600 hover:text-brand-800 font-medium px-2 py-1 rounded hover:bg-brand-50"
                @click="openUserModal(item)"
              >
                {{ $t('common.edit') }}
              </button>
              <button
                type="button"
                class="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                @click="confirmDeleteUser(item)"
              >
                {{ $t('common.delete') }}
              </button>
            </div>
          </template>
        </DataTable>

        <!-- Pagination -->
        <div v-if="subUsersTotal > pageLimit" class="flex items-center justify-between text-xs text-gray-500">
          <span>{{ $t('subUsers.page', { page: currentPage, total: totalPages }) }}</span>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1 rounded border border-gray-200 disabled:opacity-40"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              {{ $t('common.previous') }}
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded border border-gray-200 disabled:opacity-40"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              {{ $t('common.next') }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- ─── Role Modal ─────────────────────────────────────────────────── -->
    <AppModal
      :show="showRoleModal"
      :title="editingRole ? $t('subUsers.editRole') : $t('subUsers.createRole')"
      size="sm"
      @close="closeRoleModal"
    >
      <form id="role-form" class="space-y-4" @submit.prevent="saveRole">
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ $t('subUsers.roleName') }} *</label>
          <input
            v-model="roleForm.name"
            type="text"
            required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">{{ $t('subUsers.permissions') }} *</label>
          <div class="grid grid-cols-1 gap-2 mt-1">
            <label
              v-for="perm in allPermissions"
              :key="perm.id"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="perm.name"
                v-model="roleForm.permissions"
                class="rounded border-gray-300 text-brand-600 focus:ring-brand-400"
              />
              <span class="text-sm text-gray-700">{{ perm.name }}</span>
              <span v-if="perm.description" class="text-xs text-gray-400">— {{ perm.description }}</span>
            </label>
          </div>
        </div>
      </form>

      <template #footer>
        <AppButton variant="secondary" size="sm" :disabled="savingRole" @click="closeRoleModal">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton type="submit" form="role-form" size="sm" :loading="savingRole">
          {{ $t('common.save') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- ─── Delete Role Modal ──────────────────────────────────────────── -->
    <AppModal
      :show="showDeleteRoleModal"
      :title="$t('subUsers.deleteRoleTitle')"
      size="sm"
      @close="showDeleteRoleModal = false"
    >
      <p class="text-sm text-gray-600">
        {{ $t('subUsers.deleteRoleConfirm', { name: roleToDelete?.name }) }}
      </p>
      <template #footer>
        <AppButton variant="secondary" size="sm" :disabled="deletingRole" @click="showDeleteRoleModal = false">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton variant="danger" size="sm" :loading="deletingRole" @click="executeDeleteRole">
          {{ $t('common.delete') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- ─── Sub-User Modal ────────────────────────────────────────────── -->
    <AppModal
      :show="showUserModal"
      :title="editingUser ? $t('subUsers.editUser') : $t('subUsers.createUser')"
      size="md"
      @close="closeUserModal"
    >
      <form id="user-form" class="space-y-4" @submit.prevent="saveUser">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">{{ $t('common.name') }} *</label>
            <input
              v-model="userForm.name"
              type="text"
              required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">{{ $t('common.email') }} *</label>
            <input
              v-model="userForm.email"
              type="email"
              required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">
              {{ editingUser ? $t('subUsers.newPassword') : $t('subUsers.password') }}
              {{ editingUser ? '' : '*' }}
            </label>
            <input
              v-model="userForm.password"
              type="password"
              :required="!editingUser"
              minlength="6"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">{{ $t('settings.phone') }}</label>
            <input
              v-model="userForm.phone"
              type="tel"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 outline-none"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs text-gray-500 mb-1">{{ $t('subUsers.role') }} *</label>
            <select
              v-model="userForm.role_id"
              required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 outline-none bg-white"
            >
              <option value="" disabled>{{ $t('subUsers.selectRole') }}</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>
          <div v-if="editingUser" class="sm:col-span-2 flex items-center gap-2">
            <input
              id="user-active"
              v-model="userForm.is_active"
              type="checkbox"
              class="rounded border-gray-300 text-brand-600 focus:ring-brand-400"
            />
            <label for="user-active" class="text-sm text-gray-700 cursor-pointer">
              {{ $t('common.activeUser') }}
            </label>
          </div>
        </div>
      </form>

      <template #footer>
        <AppButton variant="secondary" size="sm" :disabled="savingUser" @click="closeUserModal">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton type="submit" form="user-form" size="sm" :loading="savingUser">
          {{ $t('common.save') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- ─── Delete User Modal ──────────────────────────────────────────── -->
    <AppModal
      :show="showDeleteUserModal"
      :title="$t('subUsers.deleteUserTitle')"
      size="sm"
      @close="showDeleteUserModal = false"
    >
      <p class="text-sm text-gray-600">
        {{ $t('subUsers.deleteUserConfirm', { name: userToDelete?.name }) }}
      </p>
      <template #footer>
        <AppButton variant="secondary" size="sm" :disabled="deletingUser" @click="showDeleteUserModal = false">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton variant="danger" size="sm" :loading="deletingUser" @click="executeDeleteUser">
          {{ $t('common.delete') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../../../stores/ui.js'
import { formatApiErrorMessage } from '../../../utils/errors'
import {
  getAllPermissions,
  getClientRoles,
  createClientRole,
  updateClientRole,
  deleteClientRole,
  getClientSubUsers,
  createClientSubUser,
  updateClientSubUser,
  deleteClientSubUser,
} from '../../../api/clientSubUsers'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import AppModal from '../../ui/AppModal.vue'

const props = defineProps({
  clientId: { type: String, required: true },
  /** If true, hides all edit/create/delete buttons (read-only view) */
  readonly: { type: Boolean, default: false },
})

const { t } = useI18n()
const ui = useUiStore()

// ─── Permissions ──────────────────────────────────────────────────────────────
const allPermissions = ref([])

// ─── Roles state ──────────────────────────────────────────────────────────────
const roles = ref([])
const loadingRoles = ref(false)

// ─── Sub-users state ──────────────────────────────────────────────────────────
const subUsers = ref([])
const subUsersTotal = ref(0)
const loadingUsers = ref(false)
const currentPage = ref(1)
const pageLimit = 10
const search = ref('')
let searchTimeout = null

const totalPages = computed(() => Math.ceil(subUsersTotal.value / pageLimit))

// ─── Table headers ────────────────────────────────────────────────────────────
const userHeaders = computed(() => {
  const base = [
    { key: 'name', label: t('common.name') },
    { key: 'email', label: t('common.email') },
    { key: 'role', label: t('subUsers.role') },
    { key: 'is_active', label: t('common.status') },
  ]
  if (!props.readonly) {
    base.push({ key: 'actions', label: '' })
  }
  return base
})

// ─── Modals: Roles ────────────────────────────────────────────────────────────
const showRoleModal = ref(false)
const editingRole = ref(null)
const savingRole = ref(false)
const roleForm = ref({ name: '', permissions: [] })

const showDeleteRoleModal = ref(false)
const roleToDelete = ref(null)
const deletingRole = ref(false)

// ─── Modals: Users ────────────────────────────────────────────────────────────
const showUserModal = ref(false)
const editingUser = ref(null)
const savingUser = ref(false)
const userForm = ref({
  name: '',
  email: '',
  password: '',
  phone: '',
  role_id: '',
  is_active: true,
})

const showDeleteUserModal = ref(false)
const userToDelete = ref(null)
const deletingUser = ref(false)

// ─── Data loading ─────────────────────────────────────────────────────────────
async function loadPermissions() {
  try {
    allPermissions.value = await getAllPermissions()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('subUsers.loadPermissionsFailed'), t))
  }
}

async function loadRoles() {
  if (!props.clientId) return
  loadingRoles.value = true
  try {
    roles.value = await getClientRoles(props.clientId)
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('subUsers.loadRolesFailed'), t))
  } finally {
    loadingRoles.value = false
  }
}

async function loadSubUsers() {
  if (!props.clientId) return
  loadingUsers.value = true
  try {
    const result = await getClientSubUsers(props.clientId, {
      page: currentPage.value,
      limit: pageLimit,
      search: search.value || undefined,
    })
    subUsers.value = Array.isArray(result) ? result : (result.users ?? result)
    subUsersTotal.value = result?._pagination?.total ?? subUsers.value.length
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('subUsers.loadUsersFailed'), t))
  } finally {
    loadingUsers.value = false
  }
}

// ─── Pagination & search ──────────────────────────────────────────────────────
function changePage(page) {
  currentPage.value = page
  loadSubUsers()
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadSubUsers()
  }, 350)
}

// ─── Role modal actions ───────────────────────────────────────────────────────
function openRoleModal(role) {
  editingRole.value = role
  roleForm.value = {
    name: role?.name ?? '',
    permissions: role?.permissions?.map(p => p.name) ?? [],
  }
  showRoleModal.value = true
}

function closeRoleModal() {
  showRoleModal.value = false
  editingRole.value = null
}

async function saveRole() {
  if (savingRole.value) return
  if (roleForm.value.permissions.length === 0) {
    ui.showError(t('subUsers.permissionRequired'))
    return
  }
  savingRole.value = true
  try {
    if (editingRole.value) {
      await updateClientRole(props.clientId, editingRole.value.id, roleForm.value)
      ui.showSuccess(t('subUsers.roleUpdated'))
    } else {
      await createClientRole(props.clientId, roleForm.value)
      ui.showSuccess(t('subUsers.roleCreated'))
    }
    closeRoleModal()
    await loadRoles()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('subUsers.saveFailed'), t))
  } finally {
    savingRole.value = false
  }
}

function confirmDeleteRole(role) {
  roleToDelete.value = role
  showDeleteRoleModal.value = true
}

async function executeDeleteRole() {
  if (!roleToDelete.value || deletingRole.value) return
  deletingRole.value = true
  try {
    await deleteClientRole(props.clientId, roleToDelete.value.id)
    ui.showSuccess(t('subUsers.roleDeleted'))
    showDeleteRoleModal.value = false
    roleToDelete.value = null
    await loadRoles()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('subUsers.deleteFailed'), t))
  } finally {
    deletingRole.value = false
  }
}

// ─── User modal actions ───────────────────────────────────────────────────────
function openUserModal(user) {
  editingUser.value = user
  userForm.value = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    phone: user?.phone ?? '',
    role_id: user?.role_id ?? '',
    is_active: user?.is_active ?? true,
  }
  showUserModal.value = true
}

function closeUserModal() {
  showUserModal.value = false
  editingUser.value = null
}

async function saveUser() {
  if (savingUser.value) return
  savingUser.value = true
  try {
    const payload = {
      name: userForm.value.name,
      email: userForm.value.email,
      phone: userForm.value.phone || null,
      role_id: userForm.value.role_id,
    }
    if (userForm.value.password) payload.password = userForm.value.password
    if (editingUser.value) {
      payload.is_active = userForm.value.is_active
      await updateClientSubUser(props.clientId, editingUser.value.id, payload)
      ui.showSuccess(t('subUsers.userUpdated'))
    } else {
      await createClientSubUser(props.clientId, payload)
      ui.showSuccess(t('subUsers.userCreated'))
    }
    closeUserModal()
    await loadSubUsers()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('subUsers.saveFailed'), t))
  } finally {
    savingUser.value = false
  }
}

function confirmDeleteUser(user) {
  userToDelete.value = user
  showDeleteUserModal.value = true
}

async function executeDeleteUser() {
  if (!userToDelete.value || deletingUser.value) return
  deletingUser.value = true
  try {
    await deleteClientSubUser(props.clientId, userToDelete.value.id)
    ui.showSuccess(t('subUsers.userDeleted'))
    showDeleteUserModal.value = false
    userToDelete.value = null
    await loadSubUsers()
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('subUsers.deleteFailed'), t))
  } finally {
    deletingUser.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadPermissions(), loadRoles(), loadSubUsers()])
})

watch(() => props.clientId, async (newId) => {
  if (newId) {
    currentPage.value = 1
    search.value = ''
    await Promise.all([loadPermissions(), loadRoles(), loadSubUsers()])
  }
})
</script>
