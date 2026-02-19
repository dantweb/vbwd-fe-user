<template>
  <div
    class="chat-message"
    :class="[`message-${role}`]"
    :data-testid="`chat-message-${role}`"
  >
    <div class="message-content">
      {{ content }}
    </div>
    <div
      v-if="role === 'assistant' && tokensUsed"
      class="message-meta"
      data-testid="message-tokens"
    >
      {{ $t('chat.tokensUsed', { count: tokensUsed }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  role: 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
}>();
</script>

<style scoped>
.chat-message {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.message-user {
  align-self: flex-end;
  background: var(--vbwd-color-primary, #3498db);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-assistant {
  align-self: flex-start;
  background: var(--vbwd-page-bg, #f5f5f5);
  color: var(--vbwd-text-body, #333);
  border-bottom-left-radius: 4px;
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-meta {
  font-size: 0.75rem;
  margin-top: 4px;
  opacity: 0.7;
}
</style>
