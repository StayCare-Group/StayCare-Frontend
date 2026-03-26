<script setup>
import { computed } from 'vue'

const props = defineProps({
  leftTitle: {
    type: String,
    required: true,
  },
  leftSubtitle: {
    type: String,
    default: '',
  },
  leftBackground: {
    type: String,
    default: 'linear-gradient(145deg, #0d365f 0%, #194b8e 45%, #63a3d8 100%)',
  },
  formTitle: {
    type: String,
    default: '',
  },
  formSubtitle: {
    type: String,
    default: '',
  },
  logoSrc: {
    type: String,
    default: '/brand/logo.png',
  },
  logoAlt: {
    type: String,
    default: 'StayCare logo',
  },
})

const leftStyle = computed(() => ({
  background: props.leftBackground,
}))
</script>

<template>
  <main class="auth-split-layout">
    <div v-if="logoSrc" class="auth-logo-wrap">
      <img :src="logoSrc" :alt="logoAlt" class="auth-logo" />
    </div>

    <section class="auth-left" :style="leftStyle">
      <div class="auth-left-overlay" />
      <div class="auth-left-content">
        <h1 class="auth-left-title">{{ leftTitle }}</h1>
        <p v-if="leftSubtitle" class="auth-left-subtitle">{{ leftSubtitle }}</p>
      </div>
    </section>

    <section class="auth-right">
      <div class="auth-mobile-intro">
        <h1 class="auth-mobile-title">{{ leftTitle }}</h1>
        <p v-if="leftSubtitle" class="auth-mobile-subtitle">{{ leftSubtitle }}</p>
      </div>

      <div class="auth-form-card">
        <h2 v-if="formTitle" class="auth-form-title">{{ formTitle }}</h2>
        <p v-if="formSubtitle" class="auth-form-subtitle">{{ formSubtitle }}</p>
        <slot />
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth-split-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: linear-gradient(130deg, #ffffff 0%, #ccebf6 100%);
  position: relative;
}

.auth-logo-wrap {
  position: absolute;
  top: 1.1rem;
  left: 1.1rem;
  z-index: 8;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #b0e9f6;
  border-radius: 0.8rem;
  padding: 0.35rem 0.55rem;
  box-shadow: 0 8px 18px rgba(3, 17, 46, 0.12);
}

.auth-logo {
  width: auto;
  max-width: 9.5rem;
  height: 2.1rem;
  object-fit: contain;
}

.auth-left {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  overflow: hidden;
  color: #ffffff;
}

.auth-left::before,
.auth-left::after {
  content: '';
  position: absolute;
  border-radius: 9999px;
  opacity: 0.35;
}

.auth-left::before {
  width: 22rem;
  height: 22rem;
  background: rgba(204, 235, 246, 0.35);
  top: -7rem;
  right: -4rem;
}

.auth-left::after {
  width: 14rem;
  height: 14rem;
  background: rgba(99, 163, 216, 0.38);
  bottom: -4rem;
  left: -3rem;
}

.auth-left-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(12, 22, 89, 0.12), rgba(3, 17, 46, 0.5));
}

.auth-left-content {
  position: relative;
  z-index: 1;
  max-width: 32rem;
  text-align: center;
}

.auth-left-title {
  font-family: 'Kitchakan', 'Roboto', sans-serif;
  font-size: clamp(2rem, 2.8vw, 3.2rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.15;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(3, 17, 46, 0.35);
}

.auth-left-subtitle {
  margin-top: 1rem;
  font-family: 'Montserrat', 'Roboto', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  opacity: 0.95;
  color: #ffffff;
}

.auth-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-mobile-intro {
  display: none;
}

.auth-mobile-title {
  font-family: 'Kitchakan', 'Roboto', sans-serif;
  color: #0d365f;
  font-size: 1.85rem;
  font-weight: 700;
  text-align: center;
}

.auth-mobile-subtitle {
  margin-top: 0.35rem;
  margin-bottom: 0.8rem;
  font-family: 'Montserrat', 'Roboto', sans-serif;
  color: #194b8e;
  text-align: center;
}

.auth-form-card {
  width: min(28rem, 100%);
  background: #ffffff;
  border: 1px solid #ccebf6;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(3, 17, 46, 0.12);
}

.auth-form-title {
  font-family: 'Kitchakan', 'Roboto', sans-serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: #0d365f;
}

.auth-form-subtitle {
  margin-top: 0.4rem;
  margin-bottom: 1.25rem;
  color: #194b8e;
  font-family: 'Montserrat', 'Roboto', sans-serif;
  font-size: 0.95rem;
}

@media (max-width: 960px) {
  .auth-split-layout {
    grid-template-columns: 1fr;
  }

  .auth-left {
    display: none;
  }

  .auth-right {
    padding: 5rem 1.25rem 1.25rem;
    min-height: 100vh;
    justify-content: flex-start;
  }

  .auth-mobile-intro {
    display: block;
    margin-bottom: 0.75rem;
  }

  .auth-logo-wrap {
    top: 0.8rem;
    left: 0.8rem;
    padding: 0.3rem 0.45rem;
  }

  .auth-logo {
    max-width: 7.8rem;
    height: 1.8rem;
  }

  .auth-form-card {
    padding: 1.5rem;
    margin-top: 0;
  }
}
</style>
