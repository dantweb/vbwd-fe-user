<template>
  <div
    v-if="show"
    class="warning-card card"
    data-testid="expiry-warning"
  >
    <div class="warning-content">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2v2m0-4h-2V7h2v6" />
      </svg>
      <div>
        <p class="warning-title">
          {{ $t('taro.sessionExpiring') }}
        </p>
        <p class="warning-message">
          {{ $t('taro.sessionExpiresIn', { minutes: minutesRemaining }) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  minutesRemaining: number;
}

const props = defineProps<Props>();

const show = computed(() => props.minutesRemaining > 0 && props.minutesRemaining <= 3);
</script>

<style scoped>
.warning-card {
  background: var(--color-warning-light);
  border: 1px solid var(--color-warning);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

.warning-content {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.warning-content svg {
  color: var(--color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: 600;
  color: var(--color-warning-dark);
  font-size: 0.95rem;
}

.warning-message {
  margin: 0;
  color: var(--color-warning-dark);
  font-size: 0.9rem;
}
</style>
