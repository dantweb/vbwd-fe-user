<template>
  <div class="limits-card card" data-testid="daily-limits-card">
    <div class="card-header">
      <h2>{{ $t('taro.dailyLimits') }}</h2>
      <button
        :disabled="loading"
        class="btn-icon"
        :title="$t('common.refresh')"
        data-testid="refresh-limits-btn"
        @click="$emit('refresh')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64M3.51 15A9 9 0 0 0 18.36 18.36" />
        </svg>
      </button>
    </div>

    <div class="limits-content">
      <div class="limit-item">
        <span class="label">{{ $t('taro.dailyTotal') }}</span>
        <span class="value">{{ dailyTotal }}</span>
      </div>
      <div class="limit-item">
        <span class="label">{{ $t('taro.dailyRemaining') }}</span>
        <span class="value highlight" :class="{ 'text-warning': sessionsRemaining === 0 }">
          {{ sessionsRemaining }}
        </span>
      </div>
      <div class="limit-item">
        <span class="label">{{ $t('taro.planName') }}</span>
        <span class="value">{{ planName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DailyLimits } from '@/stores';
import { computed } from 'vue';

interface Props {
  limits: DailyLimits | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<{
  refresh: [];
}>();

const dailyTotal = computed(() => props.limits?.daily_total || 0);
const sessionsRemaining = computed(() => props.limits?.daily_remaining || 0);
const planName = computed(() => props.limits?.plan_name || 'Unknown');
</script>

<style scoped>
.limits-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.card-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: color 0.2s;
}

.btn-icon:hover:not(:disabled) {
  color: var(--color-primary);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.limits-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.limit-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-background);
  border-radius: var(--border-radius-sm);
}

.label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.value.highlight {
  color: var(--color-success);
}

.value.text-warning {
  color: var(--color-warning);
}
</style>
