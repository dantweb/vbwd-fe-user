<template>
  <div
    class="chat-input-wrapper"
    data-testid="chat-input-wrapper"
  >
    <div class="input-row">
      <textarea
        ref="inputRef"
        v-model="messageText"
        class="chat-input"
        data-testid="chat-input"
        :placeholder="$t('chat.placeholder')"
        :disabled="disabled"
        :maxlength="maxLength"
        rows="1"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      />
      <button
        class="send-btn"
        data-testid="chat-send"
        :disabled="disabled || !messageText.trim()"
        @click="handleSend"
      >
        {{ $t('chat.send') }}
      </button>
    </div>
    <div
      v-if="showCost && messageText.trim()"
      class="cost-estimate"
      data-testid="chat-cost"
    >
      {{ $t('chat.estimatedCost', { count: estimatedCost }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  disabled: boolean;
  maxLength: number;
  estimatedCost: number;
  showCost: boolean;
}>();

const emit = defineEmits<{
  send: [message: string];
}>();

const messageText = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);

function handleSend() {
  const text = messageText.value.trim();
  if (!text || props.disabled) return;
  emit('send', text);
  messageText.value = '';
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
  }
}

function autoResize() {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
</script>

<style scoped>
.chat-input-wrapper {
  padding: 12px 16px;
  border-top: 1px solid var(--vbwd-border-light, #eee);
  background: var(--vbwd-card-bg, #fff);
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--vbwd-border-color, #ddd);
  border-radius: 8px;
  font-size: 0.875rem;
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: var(--vbwd-color-primary, #3498db);
}

.chat-input:disabled {
  background: var(--vbwd-page-bg, #f5f5f5);
  cursor: not-allowed;
}

.send-btn {
  padding: 10px 20px;
  background: var(--vbwd-color-primary, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: var(--vbwd-color-primary-hover, #2980b9);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cost-estimate {
  font-size: 0.75rem;
  color: var(--vbwd-text-muted, #999);
  margin-top: 4px;
  padding-left: 4px;
}
</style>
