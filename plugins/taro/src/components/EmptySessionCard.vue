<template>
  <div class="empty-session-card card">
    <div class="empty-content">
      <h2>{{ $t('taro.title') }}</h2>

      <p class="empty-description">
        {{ $t('taro.createSessionDescription') }}
      </p>

      <div class="session-benefits">
        <div class="benefit-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
          <div>
            <h4>{{ $t('taro.benefit1Title') }}</h4>
            <p>{{ $t('taro.benefit1Desc') }}</p>
          </div>
        </div>
        <div class="benefit-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <div>
            <h4>{{ $t('taro.benefit2Title') }}</h4>
            <p>{{ $t('taro.benefit2Desc') }}</p>
          </div>
        </div>
        <div class="benefit-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m4.41-11.59L11 13.41 7.59 9.99 6.18 11.4 11 16.22l7.41-7.41-1.41-1.41z" />
          </svg>
          <div>
            <h4>{{ $t('taro.benefit3Title') }}</h4>
            <p>{{ $t('taro.benefit3Desc') }}</p>
          </div>
        </div>
      </div>

      <button
        :disabled="disabled"
        class="btn btn-primary btn-large"
        data-testid="create-session-btn"
        @click="$emit('create-session')"
      >
        <span v-if="loading">{{ $t('taro.creatingSession') }}</span>
        <span v-else>{{ $t('taro.createSession') }}</span>
      </button>

      <p v-if="!canCreate" class="limit-warning">
        {{ $t('taro.dailyLimitReached') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loading?: boolean;
  canCreate?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  canCreate: true,
});

defineEmits<{
  'create-session': [];
}>();

const disabled = (props: Props) => props.loading || !props.canCreate;
</script>

<style scoped>
.empty-session-card {
  text-align: center;
  padding: var(--spacing-xl);
}

.empty-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
}

.empty-content h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.empty-description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 1.05rem;
  line-height: 1.6;
}

.session-benefits {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.benefit-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--border-radius-sm);
}

.benefit-item svg {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.benefit-item h4 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: left;
}

.benefit-item p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  text-align: left;
}

.btn-large {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 1rem;
}

.limit-warning {
  margin: 0;
  color: var(--color-warning);
  font-size: 0.95rem;
}
</style>
