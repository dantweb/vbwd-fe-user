/**
 * Taro Store (Pinia) - Manage Tarot reading sessions and history
 */
import { defineStore } from 'pinia';
import { api } from '@/api';
import { getLocale, i18n } from '@/i18n';

/**
 * Represents a single Arcana card (card definition with image and meanings)
 */
export interface Arcana {
  id: string;
  number?: number;
  name: string;
  suit?: string;
  rank?: string;
  arcana_type: 'MAJOR_ARCANA' | 'MINOR_ARCANA';
  upright_meaning: string;
  reversed_meaning: string;
  image_url: string;
}

/**
 * Represents a single card in a spread
 */
export interface TaroCard {
  card_id: string;
  position: 'PAST' | 'PRESENT' | 'FUTURE' | 'ADDITIONAL';
  orientation: 'UPRIGHT' | 'REVERSED';
  arcana_id: string;
  arcana?: Arcana;
  ai_interpretation?: string;
  interpretation?: string;
}

/**
 * Represents a message in the Oracle conversation flow
 */
export interface ConversationMessage {
  role: 'oracle' | 'user';
  content: string;
  timestamp: string;
}

/**
 * Represents a complete Taro reading session
 */
export interface TaroSession {
  session_id: string;
  user_id?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
  cards: TaroCard[];
  created_at: string;
  expires_at?: string;
  ended_at?: string;
  tokens_consumed: number;
  follow_up_count: number;
  max_follow_ups?: number;
  spread_id?: string;
}

/**
 * Daily limits and remaining sessions
 */
export interface DailyLimits {
  daily_total: number;
  daily_remaining: number;
  daily_used: number;
  plan_name: string;
  can_create: boolean;
}

/**
 * Pagination info for history
 */
export interface PaginationInfo {
  limit: number;
  offset: number;
  total: number;
}

/**
 * History fetch parameters
 */
export interface FetchHistoryParams {
  limit?: number;
  offset?: number;
  status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
}

/**
 * Taro Store State
 */
interface TaroStoreState {
  // Current active session
  currentSession: TaroSession | null;

  // Session history
  sessionHistory: TaroSession[];
  historyPagination: PaginationInfo | null;

  // Daily limits
  dailyLimits: DailyLimits | null;

  // Oracle conversation flow
  openedCards: Set<string>;
  conversationMessages: ConversationMessage[];
  oraclePhase: 'idle' | 'asking_mode' | 'asking_situation' | 'reading' | 'done';
  situationText: string;

  // Loading states
  loading: boolean;
  historyLoading: boolean;
  limitsLoading: boolean;

  // Error state
  error: string | null;
}

export const useTaroStore = defineStore('taro', {
  state: (): TaroStoreState => ({
    currentSession: null,
    sessionHistory: [],
    historyPagination: null,
    dailyLimits: null,
    openedCards: new Set<string>(),
    conversationMessages: [],
    oraclePhase: 'idle',
    situationText: '',
    loading: false,
    historyLoading: false,
    limitsLoading: false,
    error: null,
  }),

  getters: {
    /**
     * Check if user has an active session
     */
    hasActiveSession(): boolean {
      return this.currentSession?.status === 'ACTIVE';
    },

    /**
     * Get time remaining in minutes
     */
    sessionTimeRemaining(): number {
      if (!this.currentSession?.expires_at) return 0;

      const expiresAt = new Date(this.currentSession.expires_at).getTime();
      const now = Date.now();
      const remainingMs = expiresAt - now;

      if (remainingMs <= 0) return 0;
      return Math.ceil(remainingMs / 60000); // Convert to minutes
    },

    /**
     * Check if session is expired
     */
    isSessionExpired(): boolean {
      return this.currentSession?.status === 'EXPIRED';
    },

    /**
     * Check if session is closed
     */
    isSessionClosed(): boolean {
      return this.currentSession?.status === 'CLOSED';
    },

    /**
     * Check if user can create a new session (has remaining daily limit)
     */
    canCreateSession(): boolean {
      return this.dailyLimits?.can_create ?? false;
    },

    /**
     * Get remaining sessions for today
     */
    sessionsRemaining(): number {
      return this.dailyLimits?.daily_remaining ?? 0;
    },

    /**
     * Check if user can add follow-up questions
     */
    canAddFollowUp(): boolean {
      if (!this.currentSession) return false;
      if (this.currentSession.status !== 'ACTIVE') return false;

      const maxFollowUps = this.currentSession.max_follow_ups ?? 3;
      return this.currentSession.follow_up_count < maxFollowUps;
    },

    /**
     * Get remaining follow-ups allowed
     */
    followUpsRemaining(): number {
      if (!this.currentSession) return 0;

      const maxFollowUps = this.currentSession.max_follow_ups ?? 3;
      return Math.max(0, maxFollowUps - this.currentSession.follow_up_count);
    },

    /**
     * Check if session is about to expire (less than 3 minutes)
     */
    hasExpiryWarning(): boolean {
      if (!this.currentSession?.expires_at) return false;
      return this.sessionTimeRemaining > 0 && this.sessionTimeRemaining <= 3;
    },

    /**
     * Get total sessions ever created
     */
    totalSessionsEver(): number {
      return this.historyPagination?.total ?? 0;
    },

    /**
     * Check if there are more sessions to load
     */
    hasMoreHistory(): boolean {
      if (!this.historyPagination) return false;
      const loaded = (this.historyPagination.offset || 0) + this.sessionHistory.length;
      return loaded < this.historyPagination.total;
    },

    /**
     * Check if all 3 cards have been opened
     */
    allCardsOpened(): boolean {
      return this.openedCards.size === 3;
    },
  },

  actions: {
    /**
     * Create a new Taro session
     */
    async createSession(): Promise<TaroSession> {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.post('/taro/session', {}) as any;

        if (!response.success) {
          throw new Error(response.message || 'Failed to create session');
        }

        this.currentSession = response.session;

        // Clear previous session's conversation history and state
        // (Per requirements: conversation is kept only during active session)
        this.clearSessionState();

        return response.session;
      } catch (error) {
        this.error = (error as Error).message || 'Failed to create session';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Add a follow-up question to the current session
     */
    async addFollowUp(
      question: string,
      followUpType: 'SAME_CARDS' | 'ADDITIONAL' | 'NEW_SPREAD'
    ): Promise<void> {
      if (!this.currentSession) {
        throw new Error('No active session');
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await api.post(
          `/taro/session/${this.currentSession.session_id}/follow-up`,
          {
            question,
            follow_up_type: followUpType,
          }
        ) as any;

        if (!response.success) {
          throw new Error(response.message || 'Failed to add follow-up');
        }

        // Update follow-up count
        if (this.currentSession && response.follow_up) {
          this.currentSession.follow_up_count = response.follow_up.follow_up_count;
        }
      } catch (error) {
        this.error = (error as Error).message || 'Failed to add follow-up';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch session history with optional pagination
     */
    async fetchHistory(params?: FetchHistoryParams): Promise<TaroSession[]> {
      this.historyLoading = true;
      this.error = null;

      try {
        const queryParams = {
          limit: params?.limit ?? 10,
          offset: params?.offset ?? 0,
          ...(params?.status && { status: params.status }),
        };

        const response = await api.get('/taro/history', { params: queryParams }) as any;

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch history');
        }

        this.sessionHistory = response.sessions;
        this.historyPagination = response.pagination;

        return response.sessions;
      } catch (error) {
        this.error = (error as Error).message || 'Failed to fetch history';
        throw error;
      } finally {
        this.historyLoading = false;
      }
    },

    /**
     * Load more history entries (pagination)
     */
    async loadMoreHistory(): Promise<void> {
      if (!this.hasMoreHistory) {
        return;
      }

      const nextOffset = (this.historyPagination?.offset ?? 0) + this.sessionHistory.length;
      const moreHistory = await this.fetchHistory({
        offset: nextOffset,
        limit: 10,
      });

      // Append to existing history
      this.sessionHistory = [...this.sessionHistory, ...moreHistory];
    },

    /**
     * Fetch current daily limits and remaining sessions
     */
    async fetchDailyLimits(): Promise<DailyLimits> {
      this.limitsLoading = true;
      this.error = null;

      try {
        const response = await api.get('/taro/limits') as any;

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch limits');
        }

        this.dailyLimits = response.limits;

        // Handle expiry warning if present
        if (response.session_expiry_warning?.has_warning && this.currentSession) {
          // Session has a warning - this is tracked via hasExpiryWarning getter
        }

        return response.limits;
      } catch (error) {
        this.error = (error as Error).message || 'Failed to fetch limits';
        throw error;
      } finally {
        this.limitsLoading = false;
      }
    },

    /**
     * Close the current session and clear all conversation history
     * (Per requirements: conversation history is deleted when session ends)
     */
    closeSession(): void {
      this.currentSession = null;
      this.clearSessionState();
    },

    /**
     * Clear session-specific state (conversation, opened cards, oracle phase)
     * Called when starting a new session or closing current session
     * Ensures no evidence or logs remain from previous session
     */
    clearSessionState(): void {
      this.openedCards.clear();
      this.conversationMessages = [];
      this.oraclePhase = 'idle';
      this.situationText = '';
    },

    /**
     * Refresh current session data (check if expired, update follow-ups, etc.)
     */
    async refreshSession(): Promise<void> {
      if (!this.currentSession) {
        return;
      }

      // Fetch updated limits which includes session info
      try {
        await this.fetchDailyLimits();
      } catch (error) {
        // Silently fail on refresh - limits fetch is not critical
        console.warn('Failed to refresh session data:', error);
      }
    },

    /**
     * Clear all stored state
     */
    reset(): void {
      this.currentSession = null;
      this.sessionHistory = [];
      this.historyPagination = null;
      this.dailyLimits = null;
      this.openedCards = new Set<string>();
      this.conversationMessages = [];
      this.oraclePhase = 'idle';
      this.situationText = '';
      this.loading = false;
      this.historyLoading = false;
      this.limitsLoading = false;
      this.error = null;
    },

    /**
     * Initialize store (called when user logs in)
     */
    async initialize(): Promise<void> {
      try {
        // Fetch initial limits and check for active session
        await this.fetchDailyLimits();
        // Check if current session has expired and clear state if needed
        this.checkSessionExpiration();
      } catch (error) {
        // Initialization error is not critical
        console.warn('Failed to initialize Taro store:', error);
      }
    },

    /**
     * Check if session has expired and clear conversation history
     * (Per requirements: no evidence/logs remain after session expiration)
     */
    checkSessionExpiration(): void {
      if (!this.currentSession) return;

      // Check if session has expired based on status or time
      const isExpired =
        this.currentSession.status === 'EXPIRED' ||
        this.sessionTimeRemaining <= 0;

      if (isExpired) {
        // Clear conversation history and state when session expires
        this.clearSessionState();
      }
    },

    /**
     * Open a card in the reveal flow
     */
    openCard(cardId: string): void {
      // Add card to opened set (idempotent)
      this.openedCards.add(cardId);

      // If all 3 cards are now opened, transition to asking_mode
      if (this.allCardsOpened && this.oraclePhase === 'idle') {
        this.oraclePhase = 'asking_mode';

        // Add localized Oracle message using global i18n instance
        const cardsRevealed = i18n.global.t('oracle.cardsRevealed');
        const explainMode = i18n.global.t('oracle.explainMode');
        const oracleMessage = `${cardsRevealed} ${explainMode}`;

        this.addMessage('oracle', oracleMessage);
      }
    },

    /**
     * Set Oracle phase (state machine)
     */
    setOraclePhase(phase: 'idle' | 'asking_mode' | 'asking_situation' | 'reading' | 'done'): void {
      this.oraclePhase = phase;
    },

    /**
     * Add message to conversation
     */
    addMessage(role: 'oracle' | 'user', content: string): void {
      this.conversationMessages.push({
        role,
        content,
        timestamp: new Date().toISOString(),
      });
    },

    /**
     * Submit user's situation and get contextual Oracle reading
     */
    async submitSituation(situationText: string): Promise<void> {
      // Validate input
      const trimmed = situationText.trim();
      if (!trimmed) {
        throw new Error('Situation text is required');
      }

      // Count words
      const wordCount = trimmed.split(/\s+/).length;
      if (wordCount > 100) {
        throw new Error(`Situation text must be ≤ 100 words (got ${wordCount})`);
      }

      if (!this.currentSession) {
        throw new Error('No active session');
      }

      // Store situation text
      this.situationText = trimmed;

      // Add user message to conversation
      this.addMessage('user', trimmed);

      // Transition to reading phase
      this.setOraclePhase('reading');

      this.loading = true;
      this.error = null;

      try {
        // Call backend endpoint with current language
        const response = await api.post(
          `/taro/session/${this.currentSession.session_id}/situation`,
          {
            situation_text: trimmed,
            language: getLocale()
          }
        ) as any;

        if (!response.success) {
          throw new Error(response.error || 'Failed to generate reading');
        }

        // Add Oracle's response to conversation
        this.addMessage('oracle', response.interpretation);

        // Transition to done phase
        this.setOraclePhase('done');
      } catch (error) {
        this.error = (error as Error).message || 'Failed to generate reading';
        // Revert phase on error
        this.setOraclePhase('asking_situation');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Ask a follow-up question in the Oracle chat
     */
    async askFollowUpQuestion(question: string): Promise<void> {
      // Validate input
      const trimmed = question.trim();
      if (!trimmed) {
        throw new Error('Question cannot be empty');
      }

      if (!this.currentSession) {
        throw new Error('No active session');
      }

      // Add user question to conversation
      this.addMessage('user', trimmed);

      this.loading = true;
      this.error = null;

      try {
        // Call backend endpoint for follow-up question with current language
        const response = await api.post(
          `/taro/session/${this.currentSession.session_id}/follow-up-question`,
          {
            question: trimmed,
            language: getLocale()
          }
        ) as any;

        if (!response.success) {
          throw new Error(response.error || 'Failed to get response');
        }

        // Add Oracle's response to conversation
        this.addMessage('oracle', response.answer);
      } catch (error) {
        this.error = (error as Error).message || 'Failed to process question';
        // Remove the user message we just added if there was an error
        if (this.conversationMessages.length > 0) {
          this.conversationMessages.pop();
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async askCardExplanation(): Promise<void> {
      if (!this.currentSession) {
        throw new Error('No active session');
      }

      this.loading = true;
      this.error = null;

      try {
        // Call backend endpoint for card explanation with current language
        const response = await api.post(
          `/taro/session/${this.currentSession.session_id}/card-explanation`,
          { language: getLocale() }
        ) as any;

        if (!response.success) {
          throw new Error(response.error || 'Failed to get explanation');
        }

        // Add Oracle's explanation to conversation
        this.addMessage('oracle', response.interpretation);
      } catch (error) {
        this.error = (error as Error).message || 'Failed to get card explanation';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
