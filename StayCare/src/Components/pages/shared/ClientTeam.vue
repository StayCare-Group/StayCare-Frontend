<template>
  <div class="space-y-6">
    <TitleHeader
      :title="$t('subUsers.pageTitle')"
      :on-back="() => navStore.setPage('dashboard')"
    />

    <LoadingPanel v-if="!clientId" :label="$t('common.loading')" />

    <ClientSubUsersManager
      v-else
      :client-id="clientId"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../../stores/auth.js'
import { useNavStore } from '../../../stores/nav.js'
import TitleHeader from '../../ui/TitleHeader.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import ClientSubUsersManager from './ClientSubUsersManager.vue'

const authStore = useAuthStore()
const navStore = useNavStore()

/**
 * For the main client account: their own user.id IS the clientId.
 * For sub-users (parentClientId is set): use the parentClientId.
 * The backend accepts both thanks to ensureClientAccess().
 */
const clientId = computed(() => {
  const u = authStore.user
  if (!u) return null
  // parentClientId is set in the JWT for sub-users
  return u.parentClientId ?? String(u.id ?? '')
})
</script>
