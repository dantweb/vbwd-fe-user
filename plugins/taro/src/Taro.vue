<template>
  <div
    class="taro-container"
    data-testid="taro-dashboard"
  >
    <!-- Page Header -->
    <div class="taro-header">
      <h1>{{ $t('taro.title') }}</h1>
      <p class="subtitle">
        {{ $t('taro.subtitle') }}
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="taroStore.loading && !taroStore.currentSession"
      class="loading-state"
    >
      <div class="spinner" />
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="taroStore.error"
      class="error-state"
      data-testid="taro-error"
    >
      <div class="error-message">
        <p>{{ $t('common.error') }}: {{ taroStore.error }}</p>
        <button
          class="btn btn-primary"
          @click="retryOperation"
        >
          {{ $t('common.retry') }}
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div
      v-else
      class="taro-content"
    >
      <!-- Daily Limits Card -->
      <div
        class="limits-card card"
        data-testid="daily-limits-card"
      >
        <div class="card-header">
          <h2>{{ $t('taro.dailyLimits') }}</h2>
          <button
            :disabled="taroStore.limitsLoading"
            class="btn-icon"
            :title="$t('common.refresh')"
            data-testid="refresh-limits-btn"
            @click="refreshLimits"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64M3.51 15A9 9 0 0 0 18.36 18.36" />
            </svg>
          </button>
        </div>

        <div class="limits-content">
          <div class="limit-item">
            <span class="label">{{ $t('taro.dailyTotal') }}</span>
            <span class="value">{{ taroStore.dailyLimits?.daily_total || 0 }}</span>
          </div>
          <div class="limit-item">
            <span class="label">{{ $t('taro.dailyRemaining') }}</span>
            <span
              class="value highlight"
              :class="{ 'text-warning': taroStore.sessionsRemaining === 0 }"
            >
              {{ taroStore.sessionsRemaining }}
            </span>
          </div>
          <div class="limit-item">
            <span class="label">{{ $t('taro.planName') }}</span>
            <span class="value">{{ taroStore.dailyLimits?.plan_name || 'Unknown' }}</span>
          </div>
        </div>
      </div>

      <!-- Session Expiry Warning -->
      <div
        v-if="taroStore.hasExpiryWarning"
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
              {{ $t('taro.sessionExpiresIn', { minutes: taroStore.sessionTimeRemaining }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Active Session Card -->
      <div
        v-if="taroStore.hasActiveSession"
        class="session-card card"
        data-testid="active-session-card"
      >
        <div class="card-header">
          <h2>{{ $t('taro.currentSession') }}</h2>
          <span class="badge badge-active">{{ $t('taro.active') }}</span>
        </div>

        <div class="session-content">
          <!-- Cards Grid -->
          <div class="cards-grid">
            <CardDisplay
              v-for="card in taroStore.currentSession?.cards"
              :key="card.card_id"
              :card="card"
              :is-opened="taroStore.openedCards.has(card.card_id)"
              @card-click="taroStore.openCard"
              @card-fullscreen="showCardFullscreen"
            />
          </div>

          <!-- Session Info -->
          <div class="session-info">
            <div class="info-row">
              <span class="label">{{ $t('taro.followUps') }}</span>
              <span class="value">
                {{ taroStore.currentSession?.follow_up_count || 0 }}/{{
                  taroStore.currentSession?.max_follow_ups || 3
                }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('taro.tokensUsed') }}</span>
              <span class="value">{{ taroStore.currentSession?.tokens_consumed || 0 }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('taro.timeRemaining') }}</span>
              <span
                class="value"
                :class="{ 'text-warning': taroStore.sessionTimeRemaining <= 3 }"
              >
                {{ taroStore.sessionTimeRemaining }} min
              </span>
            </div>
          </div>

          <!-- Oracle Dialog Section (appears after cards opened) -->
          <div
            v-if="taroStore.openedCards.size > 0"
            class="oracle-section"
          >
            <!-- Conversation Messages -->
            <div class="conversation-box">
              <div
                v-for="(msg, idx) in taroStore.conversationMessages"
                :key="idx"
                :class="['conversation-message', `${msg.role}-message`]"
              >
                <div class="message-role">
                  {{ msg.role === 'oracle' ? $t('taro.assistant') : $t('taro.you') }}
                </div>
                <div class="message-content">
                  <FormattedMessage :content="msg.content" />
                </div>
              </div>
            </div>

            <!-- Oracle Phase: asking_mode -->
            <div
              v-if="taroStore.oraclePhase === 'asking_mode'"
              class="oracle-dialog"
            >
              <div class="dialog-buttons">
                <button
                  class="btn btn-primary"
                  @click="askCardExplanation"
                >
                  {{ $t('oracle.explainButton') }}
                </button>
                <button
                  class="btn btn-secondary"
                  @click="taroStore.setOraclePhase('asking_situation')"
                >
                  {{ $t('oracle.discussButton') }}
                </button>
              </div>
            </div>

            <!-- Oracle Phase: asking_situation -->
            <div
              v-if="taroStore.oraclePhase === 'asking_situation'"
              class="oracle-dialog"
            >
              <div class="form-group">
                <label class="form-label">{{ $t('oracle.situationLabel') }}</label>
                <textarea
                  v-model="situationText"
                  :placeholder="$t('oracle.situationPrompt')"
                  class="form-control"
                  rows="4"
                  maxlength="500"
                  data-testid="situation-input"
                />
                <div class="word-counter">
                  {{ situationWordCount }} / 100 {{ $t('oracle.words') }}
                </div>
              </div>

              <button
                :disabled="taroStore.loading || situationWordCount === 0 || situationWordCount > 100"
                class="btn btn-primary"
                data-testid="submit-situation-btn"
                @click="submitSituation"
              >
                {{ taroStore.loading ? $t('common.submitting') : $t('common.submit') }}
              </button>
            </div>

            <!-- Oracle Phase: reading -->
            <div
              v-if="taroStore.oraclePhase === 'reading'"
              class="oracle-dialog loading"
            >
              <div class="spinner-small" />
              <p>{{ $t('oracle.reading') }}</p>
            </div>

            <!-- Oracle Phase: done - Chat continues below -->
            <div
              v-if="taroStore.oraclePhase === 'done'"
              class="oracle-dialog"
            >
              <!-- Messages are displayed above in conversation-box -->
            </div>

            <!-- Chat Input - Ask More Questions -->
            <div
              v-if="taroStore.oraclePhase === 'done'"
              class="chat-continue-section"
            >
              <div class="form-group">
                <textarea
                  v-model="followUpQuestion"
                  :placeholder="$t('oracle.chatInputPlaceholder')"
                  class="form-control"
                  rows="2"
                  data-testid="chat-input"
                  @keyup.enter.ctrl="submitFollowUpQuestion"
                />
                <div class="chat-hint">
                  {{ $t('oracle.chatHint') }}
                </div>
              </div>

              <button
                :disabled="taroStore.loading || !followUpQuestion.trim()"
                class="btn btn-primary"
                data-testid="submit-chat-btn"
                @click="submitFollowUpQuestion"
              >
                {{ taroStore.loading ? $t('common.submitting') : $t('common.send') }}
              </button>
            </div>
          </div>

          <!-- Close Session Button -->
          <button
            class="btn btn-secondary"
            data-testid="close-session-btn"
            @click="closeCurrentSession"
          >
            {{ $t('taro.closeSession') }}
          </button>
        </div>
      </div>

      <!-- Create New Session Card -->
      <div
        v-else
        class="create-session-card card"
        data-testid="create-session-card"
      >
        <div class="card-header">
          <h2>{{ $t('taro.startNewSession') }}</h2>
        </div>

        <div class="create-content">
          <p class="description">
            {{ $t('taro.createSessionDescription') }}
          </p>

          <div class="session-benefits">
            <div class="benefit-item">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
              <div>
                <h4>{{ $t('taro.benefit1Title') }}</h4>
                <p>{{ $t('taro.benefit1Desc') }}</p>
              </div>
            </div>
            <div class="benefit-item">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              <div>
                <h4>{{ $t('taro.benefit2Title') }}</h4>
                <p>{{ $t('taro.benefit2Desc') }}</p>
              </div>
            </div>
            <div class="benefit-item">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m4.41-11.59L11 13.41 7.59 9.99 6.18 11.4 11 16.22l7.41-7.41-1.41-1.41z" />
              </svg>
              <div>
                <h4>{{ $t('taro.benefit3Title') }}</h4>
                <p>{{ $t('taro.benefit3Desc') }}</p>
              </div>
            </div>
          </div>

          <button
            :disabled="taroStore.loading || !taroStore.canCreateSession"
            class="btn btn-primary btn-large"
            data-testid="create-session-btn"
            @click="createNewSession"
          >
            <span v-if="taroStore.loading">{{ $t('taro.creatingSession') }}</span>
            <span v-else>{{ $t('taro.createSession') }}</span>
          </button>

          <p
            v-if="!taroStore.canCreateSession"
            class="limit-warning"
          >
            {{ $t('taro.dailyLimitReached') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Selected Card Detail Modal -->
    <CardDetailModal
      v-if="selectedCardId"
      :card-id="selectedCardId"
      :fullscreen="selectedCardFullscreen"
      @close="closeCardModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTaroStore } from '@/stores';
import CardDisplay from './components/CardDisplay.vue';
import CardDetailModal from './components/CardDetailModal.vue';
import FormattedMessage from './components/FormattedMessage.vue';

const taroStore = useTaroStore();
const selectedCardId = ref<string | null>(null);
const selectedCardFullscreen = ref(false);
const situationText = ref('');
const followUpQuestion = ref('');

const situationWordCount = computed(() => {
  return situationText.value.trim().split(/\s+/).filter(w => w.length > 0).length;
});

onMounted(async () => {
  // Initialize store if needed
  if (!taroStore.dailyLimits) {
    await taroStore.initialize();
  }
});

const createNewSession = async () => {
  try {
    await taroStore.createSession();
    // Refresh limits after creation
    await taroStore.fetchDailyLimits();
  } catch (error) {
    console.error('Failed to create session:', error);
  }
};

const closeCurrentSession = () => {
  taroStore.closeSession();
};

const showCardFullscreen = (cardId: string) => {
  selectedCardId.value = cardId;
  selectedCardFullscreen.value = true;
};

const closeCardModal = () => {
  selectedCardId.value = null;
  selectedCardFullscreen.value = false;
};


const refreshLimits = async () => {
  try {
    await taroStore.fetchDailyLimits();
  } catch (error) {
    console.error('Failed to refresh limits:', error);
  }
};

const retryOperation = async () => {
  taroStore.error = null;
  await taroStore.initialize();
};

const submitSituation = async () => {
  try {
    await taroStore.submitSituation(situationText.value);
    // Reset form
    situationText.value = '';
  } catch (error) {
    console.error('Failed to submit situation:', error);
  }
};

const submitFollowUpQuestion = async () => {
  if (!followUpQuestion.value.trim()) {
    return;
  }

  try {
    await taroStore.askFollowUpQuestion(followUpQuestion.value);
    // Reset form
    followUpQuestion.value = '';
  } catch (error) {
    console.error('Failed to submit question:', error);
  }
};

const askCardExplanation = async () => {
  try {
    taroStore.setOraclePhase('reading');
    await taroStore.askCardExplanation();
    taroStore.setOraclePhase('done');
  } catch (error) {
    console.error('Failed to get card explanation:', error);
    taroStore.setOraclePhase('asking_mode');
  }
};
</script>

<style scoped>
.taro-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.taro-header {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.taro-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.subtitle {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
}

.taro-content {
  display: grid;
  gap: var(--spacing-lg);
}

/* Cards */
.card {
  background: var(--color-background-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

/* Limits Card */
.limits-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.limit-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.limit-item .label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.limit-item .value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.limit-item .value.highlight {
  color: var(--color-success);
}

.limit-item .value.text-warning {
  color: var(--color-warning);
}

/* Warning Card */
.warning-card {
  background: linear-gradient(135deg, var(--color-warning-light) 0%, var(--color-warning-lighter) 100%);
  border-color: var(--color-warning);
  border-left: 4px solid var(--color-warning);
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
  font-weight: 600;
  color: var(--color-warning-dark);
  margin-bottom: var(--spacing-xs);
}

.warning-message {
  color: var(--color-warning-dark);
  opacity: 0.9;
}

/* Session Card */
.session-card .cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.session-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.info-row .value {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.info-row .value.text-warning {
  color: var(--color-warning);
}

/* Conversation Section */
.conversation-section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.conversation-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.conversation-box {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.conversation-message {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.llm-message {
  background: var(--color-background);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid var(--color-info, var(--color-primary));
}

.user-message {
  background: var(--color-background);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid var(--color-success, var(--color-primary));
  align-self: flex-end;
  max-width: 80%;
}

.message-role {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-content {
  color: var(--color-text-primary);
  line-height: 1.5;
}

.message-content p {
  margin: 0;
}

.message-placeholder {
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Follow-up Section */
.follow-up-section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.follow-up-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: background-color 0.2s;
}

.radio-option:hover {
  background-color: var(--color-background);
}

.radio-option input[type="radio"] {
  cursor: pointer;
}

/* Create Session Card */
.create-session-card .create-content {
  text-align: center;
}

.description {
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.session-benefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  text-align: left;
}

.benefit-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.benefit-item svg {
  color: var(--color-primary);
  flex-shrink: 0;
}

.benefit-item h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  font-weight: 600;
}

.benefit-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.btn-large {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: 1.1rem;
  margin-bottom: var(--spacing-md);
}

.limit-warning {
  color: var(--color-warning);
  font-size: 0.9rem;
}

/* Info Message */
.info-message {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-left: 4px solid var(--color-info);
  border-radius: var(--border-radius-sm);
  color: var(--color-info);
  margin-bottom: var(--spacing-md);
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-active {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

/* Loading & Error */
.loading-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  background: var(--color-error-light);
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.error-message {
  color: var(--color-error-dark);
  text-align: center;
}

.error-message p {
  margin-bottom: var(--spacing-md);
}

/* Buttons */
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-primary-light);
}

.btn-icon {
  background: none;
  border: none;
  padding: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  color: var(--color-text-primary);
}

/* Oracle Dialog Section */
.oracle-section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.oracle-section .conversation-box {
  margin-bottom: var(--spacing-md);
}

.oracle-section .conversation-message {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.oracle-message {
  background: var(--color-info-light);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid var(--color-primary);
}

.user-message {
  background: var(--color-background-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid var(--color-text-secondary);
  text-align: right;
}

.message-role {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-content {
  color: var(--color-text-primary);
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.oracle-dialog {
  background: var(--color-background-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.oracle-dialog.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dialog-buttons {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.dialog-buttons .btn {
  flex: 1;
  min-width: 150px;
}

/* Chat Continue Section */
.chat-continue-section {
  background: var(--color-background-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chat-continue-section .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.chat-continue-section .form-control {
  resize: vertical;
  font-family: inherit;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background: var(--color-background);
  color: var(--color-text-primary);
}

.chat-continue-section .form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.chat-hint {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.chat-continue-section .btn {
  align-self: flex-start;
  min-width: 120px;
}

.word-counter {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
  text-align: right;
}

.word-counter.warning {
  color: var(--color-warning);
}

/* Card Interpretations Section (before Oracle) */
.card-interpretations-section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.card-interpretations-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.card-interpretations {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.card-interpretation-item {
  background: var(--color-background-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.interpretation-position {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.5px;
}

.interpretation-content {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  line-height: 1.6;
}

.interpretation-content .placeholder {
  font-style: italic;
  color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .taro-header h1 {
    font-size: 1.8rem;
  }

  .session-benefits {
    grid-template-columns: 1fr;
  }

  .limit-item .value {
    font-size: 1.5rem;
  }

  .card {
    padding: var(--spacing-md);
  }

  .card-interpretations {
    grid-template-columns: 1fr;
  }

  .dialog-buttons {
    flex-direction: column;
  }

  .dialog-buttons .btn {
    width: 100%;
  }
}
</style>
