<template>
  <div
    class="chat-header"
    data-testid="chat-header"
  >
    <div class="header-left">
      <h2 class="chat-title">
        {{ $t('chat.title') }}
      </h2>
      <span
        class="balance-display"
        :class="{ 'balance-low': balance < 10 }"
        data-testid="chat-balance"
      >
        {{ $t('chat.balance') }}: {{ balance }} {{ $t('common.tokenUnit') }}
      </span>
    </div>
    <div class="header-right">
      <span
        v-if="showModel && modelName"
        class="model-name"
        data-testid="chat-model"
      >
        {{ $t('chat.model') }}: {{ modelName }}
      </span>
      <button
        class="clear-btn"
        data-testid="chat-clear"
        @click="$emit('clear')"
      >
        {{ $t('chat.clearChat') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  balance: number;
  modelName: string;
  showModel: boolean;
}>();

defineEmits<{
  clear: [];
}>();
</script>

<style scoped>
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vbwd-border-light, #eee);
  background: var(--vbwd-card-bg, #fff);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chat-title {
  margin: 0;
  font-size: 1.125rem;
  color: var(--vbwd-text-heading, #2c3e50);
}

.balance-display {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vbwd-color-success, #27ae60);
}

.balance-low {
  color: var(--vbwd-color-danger, #e74c3c);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.model-name {
  font-size: 0.8rem;
  color: var(--vbwd-text-muted, #999);
}

.clear-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--vbwd-border-color, #ddd);
  border-radius: 4px;
  color: var(--vbwd-text-body, #333);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:hover {
  background: var(--vbwd-page-bg, #f5f5f5);
}
</style>
