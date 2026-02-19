<template>
  <div class="session-info">
    <div class="info-row">
      <span class="label">{{ $t('taro.followUps') }}</span>
      <span class="value">
        {{ followUpsUsed }}/{{ maxFollowUps }}
      </span>
    </div>
    <div class="info-row">
      <span class="label">{{ $t('taro.tokensUsed') }}</span>
      <span class="value">{{ tokensUsed }}</span>
    </div>
    <div class="info-row">
      <span class="label">{{ $t('taro.timeRemaining') }}</span>
      <span
        class="value"
        :class="{ 'text-warning': timeRemaining <= 3 }"
      >
        {{ timeRemaining }} min
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  followUpsUsed: number;
  maxFollowUps: number;
  tokensUsed: number;
  timeRemaining: number;
}

defineProps<Props>();
</script>

<style scoped>
.session-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.value.text-warning {
  color: var(--color-warning);
}
</style>
