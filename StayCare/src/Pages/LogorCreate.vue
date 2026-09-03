<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthSplitLayout from '../Components/layout/AuthSplitLayout.vue'

const router = useRouter()
const { t } = useI18n()

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <AuthSplitLayout
    :left-title="t('common.laundryManagement')"
    :left-subtitle="t('common.welcomeBack')"
    :form-title="t('common.login')"
    :form-subtitle="t('auth.loginHeading', { brand: 'StayFresh' })"
    left-background="linear-gradient(145deg, #0d365f 0%, #194b8e 45%, #63a3d8 100%)"
  >
    <div class="auth-choice">
      <button @click="goToLogin" class="auth-choice-btn">{{ t('common.signIn') }}</button>
      <button
        disabled
        class="auth-choice-btn auth-choice-btn-disabled"
        :title="t('auth.registrationDisabledHint')"
      >
        {{ t('common.signUp') }}
      </button>
      <div class="registration-disabled-notice">
        <p>{{ t('auth.registrationDisabledMessage') }}</p>
      </div>
    </div>
  </AuthSplitLayout>
</template>

<style scoped>
.auth-choice {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.auth-choice-btn {
  border: none;
  border-radius: 0.7rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, #194b8e, #0c1659);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.auth-choice-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(12, 22, 89, 0.28);
}

.auth-choice-btn-disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.85;
}

.registration-disabled-notice {
  margin-top: 0.25rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.6rem;
  background-color: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
  text-align: center;
}
</style>