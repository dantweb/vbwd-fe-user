<template>
  <div
    class="session-history-container"
    data-testid="session-history"
  >
    <div class="card">
      <div class="card-header">
        <h2>{{ $t('taro.sessionHistory') }}</h2>
      </div>

      <!-- Empty State -->
      <div
        v-if="sessions.length === 0 && !loading"
        class="empty-state"
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
        <p>{{ $t('taro.noSessions') }}</p>
      </div>

      <!-- Sessions List -->
      <div
        v-else-if="sessions.length > 0"
        class="sessions-list"
      >
        <div
          v-for="session in sessions"
          :key="session.session_id"
          class="session-item"
        >
          <div class="session-header">
            <div class="session-title">
              <h3
                v-if="session.created_at"
                class="session-date"
              >
                {{ formatDate(session.created_at) }}
              </h3>
              <span
                class="session-status"
                :class="`status-${session.status.toLowerCase()}`"
              >
                {{ $t(`taro.status.${session.status.toLowerCase()}`) }}
              </span>
            </div>
            <div class="session-meta">
              <span class="meta-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                {{ $t('taro.followUps') }}: {{ session.follow_up_count }}
              </span>
              <span class="meta-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1m0 20c-4.96 0-9-4.04-9-9s4.04-9 9-9 9 4.04 9 9-4.04 9-9 9m.5-13H10v6l5.2 3.2.8-1.3-4.5-2.7V8z" />
                </svg>
                {{ $t('taro.tokensUsed') }}: {{ session.tokens_consumed }}
              </span>
            </div>
          </div>

          <!-- Cards Preview -->
          <div
            v-if="session.cards && session.cards.length > 0"
            class="cards-preview"
          >
            <div
              v-for="card in session.cards"
              :key="card.card_id"
              class="card-preview-item"
              :class="`position-${card.position.toLowerCase()}`"
            >
              <div class="card-preview-visual">
                <svg
                  width="40"
                  height="60"
                  viewBox="0 0 80 120"
                  fill="none"
                  stroke="currentColor"
                >
                  <rect
                    x="2"
                    y="2"
                    width="76"
                    height="116"
                    rx="4"
                    stroke-width="1.5"
                  />
                  <path
                    d="M 40 30 L 50 50 L 30 50 Z"
                    stroke-width="1.5"
                  />
                  <circle
                    cx="40"
                    cy="75"
                    r="15"
                    stroke-width="1.5"
                  />
                </svg>
              </div>
              <div class="card-preview-info">
                <div class="position-badge">
                  {{ card.position }}
                </div>
                <div
                  class="orientation-badge"
                  :class="{ reversed: card.orientation === 'REVERSED' }"
                >
                  {{ $t(`taro.orientation.${card.orientation.toLowerCase()}`) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Interpretation Preview -->
          <div
            v-if="hasInterpretations(session)"
            class="interpretation-preview"
          >
            <p>{{ $t('taro.sessionComplete') }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="spinner" />
        <p>{{ $t('common.loading') }}</p>
      </div>

      <!-- Load More Button -->
      <div
        v-if="hasMore && !loading"
        class="load-more-section"
      >
        <button
          class="btn btn-secondary"
          data-testid="load-more-btn"
          @click="$emit('load-more')"
        >
          {{ $t('taro.loadMore') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaroSession } from '@/stores';
import { defineProps, defineEmits } from 'vue';

interface Props {
  sessions: TaroSession[];
  loading?: boolean;
  hasMore?: boolean;
}

defineProps<Props>();
defineEmits<{
  'load-more': [];
}>();

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  }
};

const hasInterpretations = (session: TaroSession): boolean => {
  return session.cards?.some((card) => card.interpretation) ?? false;
};
</script>

<style scoped>
.session-history-container {
  margin-top: var(--spacing-xl);
}

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

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  color: var(--color-text-secondary);
}

.empty-state svg {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.05rem;
}

/* Sessions List */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.session-item {
  padding: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  transition: all 0.2s;
}

.session-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.05);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.session-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.session-date {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.session-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background-color: var(--color-success-light);
  color: var(--color-success-dark);
}

.status-expired {
  background-color: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.status-closed {
  background-color: var(--color-info-light);
  color: var(--color-info-dark);
}

.session-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.meta-item svg {
  color: var(--color-primary);
  opacity: 0.7;
}

/* Cards Preview */
.cards-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.card-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border);
}

.card-preview-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 80px;
  background: var(--color-background);
  border-radius: var(--border-radius-sm);
  color: var(--color-primary);
}

.card-preview-visual svg {
  opacity: 0.7;
}

.card-preview-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  text-align: center;
}

.position-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-primary);
}

.orientation-badge {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.orientation-badge.reversed {
  color: var(--color-warning);
  font-weight: 500;
}

/* Interpretation Preview */
.interpretation-preview {
  padding: var(--spacing-sm);
  background: var(--color-background);
  border-left: 3px solid var(--color-success);
  border-radius: var(--border-radius-sm);
  color: var(--color-success-dark);
  font-size: 0.9rem;
}

.interpretation-preview p {
  margin: 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.spinner {
  display: inline-block;
  width: 30px;
  height: 30px;
  border: 3px solid var(--color-border);
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

/* Load More */
.load-more-section {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-primary-light);
}

/* Responsive */
@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
  }

  .session-meta {
    width: 100%;
  }

  .cards-preview {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
