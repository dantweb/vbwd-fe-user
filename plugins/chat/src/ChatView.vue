<template>
  <div
    class="chat-container"
    data-testid="chat-container"
  >
    <ChatHeader
      :balance="balance"
      :model-name="config.model"
      :show-model="showModel"
      @clear="clearChat"
    />

    <div
      ref="messagesRef"
      class="messages-area"
      data-testid="chat-messages"
    >
      <div
        v-if="messages.length === 0"
        class="empty-state"
        data-testid="chat-empty"
      >
        {{ $t('chat.emptyState') }}
      </div>
      <ChatMessage
        v-for="(msg, idx) in messages"
        :key="idx"
        :role="msg.role"
        :content="msg.content"
        :tokens-used="msg.tokensUsed"
      />
      <div
        v-if="sending"
        class="typing-indicator"
        data-testid="chat-loading"
      >
        <span class="dot" /><span class="dot" /><span class="dot" />
      </div>
    </div>

    <div
      v-if="error"
      class="error-banner"
      data-testid="chat-error"
    >
      {{ error }}
    </div>

    <ChatInput
      :disabled="sending"
      :max-length="config.max_message_length"
      :estimated-cost="estimatedCost"
      :show-cost="showCost"
      @send="handleSend"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ChatHeader from './ChatHeader.vue';
import ChatMessage from './ChatMessage.vue';
import ChatInput from './ChatInput.vue';
import { sendMessage, getChatConfig } from './api';
import type { ChatConfig } from './api';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
}

const { t } = useI18n();

const messages = ref<DisplayMessage[]>([]);
const balance = ref(0);
const sending = ref(false);
const error = ref('');
const estimatedCost = ref(0);
const showCost = ref(true);
const showModel = ref(true);
const messagesRef = ref<HTMLElement | null>(null);

const config = ref<ChatConfig>({
  model: '',
  max_message_length: 4000,
  counting_mode: 'words',
});

onMounted(async () => {
  try {
    const cfg = await getChatConfig();
    config.value = cfg;
  } catch {
    error.value = t('chat.configError');
  }

  try {
    const res = await fetch('/api/v1/user/tokens/balance', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
    });
    if (res.ok) {
      const data = await res.json();
      balance.value = data.balance ?? 0;
    }
  } catch {
    // Balance fetch failed, leave at 0
  }
});

async function handleSend(message: string) {
  error.value = '';
  sending.value = true;

  messages.value.push({ role: 'user', content: message });
  await scrollToBottom();

  const history = messages.value
    .filter(m => !m.tokensUsed || m.role === 'user')
    .map(m => ({ role: m.role, content: m.content }));

  try {
    const result = await sendMessage(message, history.slice(0, -1));
    messages.value.push({
      role: 'assistant',
      content: result.response,
      tokensUsed: result.tokens_used,
    });
    balance.value = result.balance;
  } catch (err: unknown) {
    const errorObj = err as { error?: string };
    if (errorObj.error && errorObj.error.toLowerCase().includes('insufficient')) {
      error.value = t('chat.insufficientBalance');
    } else {
      error.value = t('chat.errorSending');
    }
  } finally {
    sending.value = false;
    await scrollToBottom();
  }
}

function clearChat() {
  messages.value = [];
  error.value = '';
  estimatedCost.value = 0;
}

async function scrollToBottom() {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}

// Debounced cost estimation is handled reactively — for simplicity
// the cost estimate is refreshed when the user focus changes
watch(messages, () => {
  scrollToBottom();
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--vbwd-card-bg, #fff);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vbwd-text-muted, #999);
  font-size: 0.95rem;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  align-self: flex-start;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vbwd-text-muted, #999);
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.error-banner {
  padding: 8px 16px;
  background: #fef2f2;
  color: var(--vbwd-color-danger, #e74c3c);
  font-size: 0.85rem;
  border-top: 1px solid #fecaca;
}
</style>
