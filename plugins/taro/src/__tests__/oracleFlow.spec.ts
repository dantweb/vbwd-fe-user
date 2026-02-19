/**
 * Tests for Oracle Conversation Flow (TDD)
 * Card reveal mechanic, Oracle dialog, situation-based reading
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTaroStore } from '../stores/taro';
import { api } from '@/api';

vi.mock('@/api');

describe('Oracle Conversation Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Card Opening (Reveal Mechanic)', () => {
    it('openCard should add card to openedCards set', async () => {
      const store = useTaroStore();
      const cardId = 'card-1';

      store.openCard(cardId);

      expect(store.openedCards.has(cardId)).toBe(true);
    });

    it('openCard on already-opened card should be idempotent', async () => {
      const store = useTaroStore();
      const cardId = 'card-1';

      store.openCard(cardId);
      const sizeAfterFirst = store.openedCards.size;

      store.openCard(cardId);
      const sizeAfterSecond = store.openedCards.size;

      expect(sizeAfterFirst).toBe(sizeAfterSecond);
      expect(sizeAfterSecond).toBe(1);
    });

    it('allCardsOpened should be true when 3 cards opened', async () => {
      const store = useTaroStore();

      store.openCard('card-1');
      expect(store.allCardsOpened).toBe(false);

      store.openCard('card-2');
      expect(store.allCardsOpened).toBe(false);

      store.openCard('card-3');
      expect(store.allCardsOpened).toBe(true);
    });

    it('should transition to asking_mode when all 3 cards opened', async () => {
      const store = useTaroStore();
      expect(store.oraclePhase).toBe('idle');

      store.openCard('card-1');
      store.openCard('card-2');
      store.openCard('card-3');

      expect(store.oraclePhase).toBe('asking_mode');
    });
  });

  describe('Oracle Phase Transitions', () => {
    it('setOraclePhase should update phase', async () => {
      const store = useTaroStore();

      store.setOraclePhase('asking_situation');
      expect(store.oraclePhase).toBe('asking_situation');

      store.setOraclePhase('reading');
      expect(store.oraclePhase).toBe('reading');

      store.setOraclePhase('done');
      expect(store.oraclePhase).toBe('done');
    });
  });

  describe('Conversation Messages', () => {
    it('addMessage should append message with timestamp', async () => {
      const store = useTaroStore();

      store.addMessage('oracle', 'Hello, seeker');

      expect(store.conversationMessages).toHaveLength(1);
      expect(store.conversationMessages[0].role).toBe('oracle');
      expect(store.conversationMessages[0].content).toBe('Hello, seeker');
      expect(store.conversationMessages[0].timestamp).toBeDefined();
    });

    it('should maintain conversation history', async () => {
      const store = useTaroStore();

      store.addMessage('oracle', 'Message 1');
      store.addMessage('user', 'Message 2');
      store.addMessage('oracle', 'Message 3');

      expect(store.conversationMessages).toHaveLength(3);
      expect(store.conversationMessages[0].content).toBe('Message 1');
      expect(store.conversationMessages[1].content).toBe('Message 2');
      expect(store.conversationMessages[2].content).toBe('Message 3');
    });
  });

  describe('Situation Submission', () => {
    it('submitSituation should validate word count (≤ 100 words)', async () => {
      const store = useTaroStore();

      // Create text with 101 words
      const tooLongText = Array(101).fill('word').join(' ');

      await expect(store.submitSituation(tooLongText)).rejects.toThrow('100 words');
    });

    it('submitSituation should accept ≤ 100 words', async () => {
      const store = useTaroStore();
      const validText = Array(100).fill('word').join(' ');

      // Mock API response
      (api.post as any).mockResolvedValue({
        success: true,
        interpretation: 'Oracle reading',
      });

      store.currentSession = {
        session_id: 'test-session',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      await store.submitSituation(validText);

      expect(store.situationText).toBe(validText);
    });

    it('submitSituation should fail on empty text', async () => {
      const store = useTaroStore();

      await expect(store.submitSituation('')).rejects.toThrow();
      await expect(store.submitSituation('   ')).rejects.toThrow();
    });

    it('submitSituation should call API endpoint', async () => {
      const store = useTaroStore();
      const situationText = 'I face a career decision';

      store.currentSession = {
        session_id: 'test-session',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      (api.post as any).mockResolvedValue({
        success: true,
        interpretation: 'Your cards reveal...',
      });

      await store.submitSituation(situationText);

      expect(api.post).toHaveBeenCalledWith(
        '/taro/session/test-session/situation',
        { situation_text: situationText }
      );
    });

    it('submitSituation should transition to reading phase', async () => {
      const store = useTaroStore();
      const situationText = 'My situation';

      store.currentSession = {
        session_id: 'test-session',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      (api.post as any).mockResolvedValue({
        success: true,
        interpretation: 'Oracle reading',
      });

      store.setOraclePhase('asking_situation');
      await store.submitSituation(situationText);

      // Should have transitioned to reading during call
      expect(store.oraclePhase).toBe('done');
    });

    it('submitSituation should add Oracle message to conversation', async () => {
      const store = useTaroStore();
      const situationText = 'My situation';
      const oracleResponse = 'The cards speak clearly...';

      store.currentSession = {
        session_id: 'test-session',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      (api.post as any).mockResolvedValue({
        success: true,
        interpretation: oracleResponse,
      });

      await store.submitSituation(situationText);

      // Should have added user message and oracle message
      const messages = store.conversationMessages;
      expect(messages.some(m => m.role === 'user' && m.content === situationText)).toBe(true);
      expect(messages.some(m => m.role === 'oracle' && m.content === oracleResponse)).toBe(true);
    });
  });

  describe('Store Integration', () => {
    it('should reset oracle state', async () => {
      const store = useTaroStore();

      store.openCard('card-1');
      store.openCard('card-2');
      store.openCard('card-3');
      store.addMessage('oracle', 'Hello');
      store.situationText = 'My situation';
      store.setOraclePhase('done');

      store.reset();

      expect(store.openedCards.size).toBe(0);
      expect(store.conversationMessages).toHaveLength(0);
      expect(store.oraclePhase).toBe('idle');
      expect(store.situationText).toBe('');
    });
  });
});
