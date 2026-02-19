<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="modal-overlay"
      data-testid="session-expired-modal"
    >
      <div class="modal">
        <div class="modal-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2>{{ $t('components.sessionExpiredModal.title') }}</h2>
        <p>{{ message || $t('components.sessionExpiredModal.defaultMessage') }}</p>
        <button
          class="btn primary"
          data-testid="session-login-btn"
          @click="handleLogin"
        >
          {{ $t('components.sessionExpiredModal.loginButton') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { sessionExpired, sessionExpiredMessage, clearSessionExpiry } from '../api';

const router = useRouter();

const show = computed(() => sessionExpired.value);
const message = computed(() => sessionExpiredMessage.value);

function handleLogin(): void {
  clearSessionExpiry();
  router.push({ name: 'login' });
}

// Auto-redirect after a delay if modal is ignored
watch(show, (isShown) => {
  if (isShown) {
    // Auto redirect after 30 seconds
    const timeout = setTimeout(() => {
      if (sessionExpired.value) {
        handleLogin();
      }
    }, 30000);

    return () => clearTimeout(timeout);
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal {
  background: white;
  padding: 40px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-icon {
  color: #e74c3c;
  margin-bottom: 20px;
}

.modal h2 {
  margin: 0 0 15px;
  color: #2c3e50;
}

.modal p {
  margin: 0 0 25px;
  color: #666;
  line-height: 1.5;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn.primary {
  background-color: #3498db;
  color: white;
}

.btn.primary:hover {
  background-color: #2980b9;
}
</style>
