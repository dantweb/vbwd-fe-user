<template>
  <div class="error-state" data-testid="taro-error">
    <div class="error-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6" stroke-width="1.5" />
      </svg>
    </div>
    <div class="error-message">
      <p class="error-title">{{ $t('common.error') }}</p>
      <p class="error-text">{{ error }}</p>
    </div>
    <button class="btn btn-primary" @click="$emit('retry')">
      {{ $t('common.retry') }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error: string;
}

defineProps<Props>();

defineEmits<{
  retry: [];
}>();
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-md);
  text-align: center;
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius);
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-error);
}

.error-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-error-dark);
}

.error-text {
  margin: 0;
  color: var(--color-error-dark);
  font-size: 0.95rem;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background-color: var(--color-error);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-error-dark);
}
</style>
