<template>
  <div class="oracle-section">
    <!-- Conversation Messages -->
    <ConversationBox v-if="messages.length > 0" :messages="messages" />

    <!-- Oracle Phase: asking_mode -->
    <div v-if="phase === 'asking_mode'" class="oracle-dialog">
      <div class="dialog-buttons">
        <button class="btn btn-primary" @click="$emit('explain-cards')">
          {{ $t('oracle.explainButton') }}
        </button>
        <button class="btn btn-secondary" @click="$emit('discuss-situation')">
          {{ $t('oracle.discussButton') }}
        </button>
      </div>
    </div>

    <!-- Oracle Phase: asking_situation -->
    <div v-if="phase === 'asking_situation'" class="oracle-dialog">
      <div class="form-group">
        <label class="form-label">{{ $t('oracle.situationLabel') }}</label>
        <textarea
          :value="situationText"
          :placeholder="$t('oracle.situationPrompt')"
          class="form-control"
          rows="4"
          maxlength="500"
          data-testid="situation-input"
          @input="$emit('update-situation', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="word-counter">
          {{ wordCount }} / 100 {{ $t('oracle.words') }}
        </div>
      </div>

      <button
        :disabled="loading || wordCount === 0 || wordCount > 100"
        class="btn btn-primary"
        data-testid="submit-situation-btn"
        @click="$emit('submit-situation')"
      >
        {{ loading ? $t('common.submitting') : $t('common.submit') }}
      </button>
    </div>

    <!-- Oracle Phase: reading -->
    <div v-if="phase === 'reading'" class="oracle-dialog loading">
      <div class="spinner-small" />
      <p>{{ $t('oracle.reading') }}</p>
    </div>

    <!-- Chat Input - Ask More Questions -->
    <div v-if="phase === 'done'" class="chat-continue-section">
      <div class="form-group">
        <textarea
          :value="followUpQuestion"
          :placeholder="$t('oracle.chatInputPlaceholder')"
          class="form-control"
          rows="2"
          data-testid="chat-input"
          @input="$emit('update-question', ($event.target as HTMLTextAreaElement).value)"
          @keyup.enter.ctrl="$emit('submit-question')"
        />
        <div class="chat-hint">
          {{ $t('oracle.chatHint') }}
        </div>
      </div>

      <button
        :disabled="loading || !followUpQuestion.trim()"
        class="btn btn-primary"
        data-testid="submit-chat-btn"
        @click="$emit('submit-question')"
      >
        {{ loading ? $t('common.submitting') : $t('common.send') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConversationMessage } from '@/stores';
import { computed } from 'vue';
import ConversationBox from './ConversationBox.vue';

interface Props {
  phase: 'idle' | 'asking_mode' | 'asking_situation' | 'reading' | 'done';
  messages: ConversationMessage[];
  situationText: string;
  followUpQuestion: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

defineEmits<{
  'explain-cards': [];
  'discuss-situation': [];
  'update-situation': [text: string];
  'submit-situation': [];
  'update-question': [text: string];
  'submit-question': [];
}>();

const wordCount = computed(() => {
  return props.situationText.trim().split(/\s+/).filter(w => w.length > 0).length;
});
</script>

<style scoped>
.oracle-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-background-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
}

.oracle-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.oracle-dialog.loading {
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.dialog-buttons {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.form-control {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
}

.word-counter {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-align: right;
}

.chat-hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.spinner-small {
  width: 30px;
  height: 30px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: var(--color-background);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: rgba(var(--color-primary-rgb), 0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
