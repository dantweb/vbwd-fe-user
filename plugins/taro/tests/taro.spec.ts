import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTaroStore } from '../taro';

// Mock API client
vi.mock('@/api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { api } from '@/api/client';

describe('Taro Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useTaroStore();

      expect(store.currentSession).toBeNull();
      expect(store.sessionHistory).toEqual([]);
      expect(store.dailyLimits).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.historyLoading).toBe(false);
      expect(store.limitsLoading).toBe(false);
    });
  });

  describe('Getters', () => {
    it('hasActiveSession should return true when currentSession exists', () => {
      const store = useTaroStore();
      store.currentSession = {
        session_id: 'test-id',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      expect(store.hasActiveSession).toBe(true);
    });

    it('hasActiveSession should return false when currentSession is null', () => {
      const store = useTaroStore();
      expect(store.hasActiveSession).toBe(false);
    });

    it('sessionTimeRemaining should calculate remaining minutes', () => {
      const store = useTaroStore();
      const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes
      store.currentSession = {
        session_id: 'test-id',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      const remaining = store.sessionTimeRemaining;
      expect(remaining).toBeGreaterThan(9);
      expect(remaining).toBeLessThanOrEqual(10);
    });

    it('sessionTimeRemaining should return 0 if session is null', () => {
      const store = useTaroStore();
      expect(store.sessionTimeRemaining).toBe(0);
    });

    it('isSessionExpired should return true when session status is EXPIRED', () => {
      const store = useTaroStore();
      store.currentSession = {
        session_id: 'test-id',
        status: 'EXPIRED',
        cards: [],
        created_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      expect(store.isSessionExpired).toBe(true);
    });

    it('canCreateSession should return true when limit allows', () => {
      const store = useTaroStore();
      store.dailyLimits = {
        daily_total: 3,
        daily_remaining: 1,
        daily_used: 2,
        plan_name: 'Star',
        can_create: true,
      };

      expect(store.canCreateSession).toBe(true);
    });

    it('canCreateSession should return false when limit exceeded', () => {
      const store = useTaroStore();
      store.dailyLimits = {
        daily_total: 3,
        daily_remaining: 0,
        daily_used: 3,
        plan_name: 'Star',
        can_create: false,
      };

      expect(store.canCreateSession).toBe(false);
    });

    it('canAddFollowUp should return true when follow-ups available', () => {
      const store = useTaroStore();
      store.currentSession = {
        session_id: 'test-id',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        tokens_consumed: 10,
        follow_up_count: 1,
        max_follow_ups: 3,
      };

      expect(store.canAddFollowUp).toBe(true);
    });

    it('canAddFollowUp should return false when max follow-ups reached', () => {
      const store = useTaroStore();
      store.currentSession = {
        session_id: 'test-id',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        tokens_consumed: 10,
        follow_up_count: 3,
        max_follow_ups: 3,
      };

      expect(store.canAddFollowUp).toBe(false);
    });

    it('hasExpiryWarning should return true when time < 3 minutes', () => {
      const store = useTaroStore();
      store.currentSession = {
        session_id: 'test-id',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60000).toISOString(), // 2 minutes
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      expect(store.hasExpiryWarning).toBe(true);
    });

    it('hasExpiryWarning should return false when time > 3 minutes', () => {
      const store = useTaroStore();
      store.currentSession = {
        session_id: 'test-id',
        status: 'ACTIVE',
        cards: [],
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60000).toISOString(), // 5 minutes
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      expect(store.hasExpiryWarning).toBe(false);
    });
  });

  describe('Actions', () => {
    describe('createSession', () => {
      it('should create a new session successfully', async () => {
        const mockResponse = {
          success: true,
          session: {
            session_id: 'new-session',
            status: 'ACTIVE',
            cards: [
              { card_id: 'card1', position: 'PAST', orientation: 'UPRIGHT' },
              { card_id: 'card2', position: 'PRESENT', orientation: 'REVERSED' },
              { card_id: 'card3', position: 'FUTURE', orientation: 'UPRIGHT' },
            ],
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
            tokens_consumed: 10,
            follow_up_count: 0,
          },
        };

        vi.mocked(api.post).mockResolvedValue(mockResponse);

        const store = useTaroStore();
        await store.createSession();

        expect(api.post).toHaveBeenCalledWith('/taro/session', {});
        expect(store.currentSession).toEqual(mockResponse.session);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('should handle creation error', async () => {
        const mockError = new Error('Failed to create session');
        vi.mocked(api.post).mockRejectedValue(mockError);

        const store = useTaroStore();
        await expect(store.createSession()).rejects.toThrow();

        expect(store.error).toContain('Failed to create session');
        expect(store.loading).toBe(false);
      });

      it('should set loading state during creation', async () => {
        const store = useTaroStore();
        let loadingDuringCall = false;

        vi.mocked(api.post).mockImplementation(async () => {
          loadingDuringCall = store.loading;
          return { success: true, session: {} };
        });

        await store.createSession();
        expect(loadingDuringCall).toBe(true);
      });
    });

    describe('addFollowUp', () => {
      it('should add follow-up with SAME_CARDS type', async () => {
        const mockResponse = {
          success: true,
          follow_up: {
            session_id: 'test-session',
            question: 'Tell me more',
            follow_up_type: 'SAME_CARDS',
            follow_up_count: 1,
          },
        };

        vi.mocked(api.post).mockResolvedValue(mockResponse);

        const store = useTaroStore();
        store.currentSession = {
          session_id: 'test-session',
          status: 'ACTIVE',
          cards: [],
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
          tokens_consumed: 10,
          follow_up_count: 0,
        };

        await store.addFollowUp('Tell me more', 'SAME_CARDS');

        expect(api.post).toHaveBeenCalledWith('/taro/session/test-session/follow-up', {
          question: 'Tell me more',
          follow_up_type: 'SAME_CARDS',
        });
        expect(store.currentSession!.follow_up_count).toBe(1);
      });

      it('should add follow-up with ADDITIONAL type', async () => {
        const mockResponse = {
          success: true,
          follow_up: {
            follow_up_count: 2,
          },
        };

        vi.mocked(api.post).mockResolvedValue(mockResponse);

        const store = useTaroStore();
        store.currentSession = {
          session_id: 'test-session',
          status: 'ACTIVE',
          cards: [],
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
          tokens_consumed: 10,
          follow_up_count: 1,
        };

        await store.addFollowUp('Show me more', 'ADDITIONAL');

        expect(api.post).toHaveBeenCalledWith('/taro/session/test-session/follow-up', {
          question: 'Show me more',
          follow_up_type: 'ADDITIONAL',
        });
      });

      it('should add follow-up with NEW_SPREAD type', async () => {
        const mockResponse = {
          success: true,
          follow_up: {
            follow_up_count: 3,
          },
        };

        vi.mocked(api.post).mockResolvedValue(mockResponse);

        const store = useTaroStore();
        store.currentSession = {
          session_id: 'test-session',
          status: 'ACTIVE',
          cards: [],
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
          tokens_consumed: 10,
          follow_up_count: 2,
        };

        await store.addFollowUp('New spread', 'NEW_SPREAD');

        expect(api.post).toHaveBeenCalledWith('/taro/session/test-session/follow-up', {
          question: 'New spread',
          follow_up_type: 'NEW_SPREAD',
        });
      });

      it('should handle follow-up error', async () => {
        const mockError = new Error('Follow-up failed');
        vi.mocked(api.post).mockRejectedValue(mockError);

        const store = useTaroStore();
        store.currentSession = {
          session_id: 'test-session',
          status: 'ACTIVE',
          cards: [],
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
          tokens_consumed: 10,
          follow_up_count: 0,
        };

        await expect(store.addFollowUp('Ask', 'SAME_CARDS')).rejects.toThrow();
        expect(store.error).toContain('Follow-up failed');
      });
    });

    describe('fetchHistory', () => {
      it('should fetch session history successfully', async () => {
        const mockResponse = {
          success: true,
          sessions: [
            {
              session_id: 'session1',
              status: 'CLOSED',
              cards: [],
              created_at: new Date().toISOString(),
              follow_up_count: 2,
            },
            {
              session_id: 'session2',
              status: 'CLOSED',
              cards: [],
              created_at: new Date().toISOString(),
              follow_up_count: 0,
            },
          ],
          pagination: { limit: 10, offset: 0, total: 2 },
        };

        vi.mocked(api.get).mockResolvedValue(mockResponse);

        const store = useTaroStore();
        await store.fetchHistory();

        expect(api.get).toHaveBeenCalledWith('/taro/history', expect.any(Object));
        expect(store.sessionHistory).toEqual(mockResponse.sessions);
        expect(store.historyLoading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('should fetch history with pagination', async () => {
        const mockResponse = {
          success: true,
          sessions: [],
          pagination: { limit: 5, offset: 10, total: 25 },
        };

        vi.mocked(api.get).mockResolvedValue(mockResponse);

        const store = useTaroStore();
        await store.fetchHistory({ limit: 5, offset: 10 });

        expect(api.get).toHaveBeenCalledWith('/taro/history', {
          params: { limit: 5, offset: 10 },
        });
      });

      it('should handle history fetch error', async () => {
        const mockError = new Error('Failed to fetch history');
        vi.mocked(api.get).mockRejectedValue(mockError);

        const store = useTaroStore();
        await expect(store.fetchHistory()).rejects.toThrow();

        expect(store.error).toContain('Failed to fetch history');
        expect(store.historyLoading).toBe(false);
      });

      it('should set historyLoading during fetch', async () => {
        const store = useTaroStore();
        let loadingDuringCall = false;

        vi.mocked(api.get).mockImplementation(async () => {
          loadingDuringCall = store.historyLoading;
          return { success: true, sessions: [] };
        });

        await store.fetchHistory();
        expect(loadingDuringCall).toBe(true);
      });
    });

    describe('fetchDailyLimits', () => {
      it('should fetch daily limits successfully', async () => {
        const mockResponse = {
          success: true,
          limits: {
            daily_total: 3,
            daily_remaining: 2,
            daily_used: 1,
            plan_name: 'Star',
            can_create: true,
          },
          session_expiry_warning: null,
        };

        vi.mocked(api.get).mockResolvedValue(mockResponse);

        const store = useTaroStore();
        await store.fetchDailyLimits();

        expect(api.get).toHaveBeenCalledWith('/taro/limits');
        expect(store.dailyLimits).toEqual(mockResponse.limits);
        expect(store.limitsLoading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('should handle limits fetch error', async () => {
        const mockError = new Error('Failed to fetch limits');
        vi.mocked(api.get).mockRejectedValue(mockError);

        const store = useTaroStore();
        await expect(store.fetchDailyLimits()).rejects.toThrow();

        expect(store.error).toContain('Failed to fetch limits');
        expect(store.limitsLoading).toBe(false);
      });

      it('should set limitsLoading during fetch', async () => {
        const store = useTaroStore();
        let loadingDuringCall = false;

        vi.mocked(api.get).mockImplementation(async () => {
          loadingDuringCall = store.limitsLoading;
          return { success: true, limits: {} };
        });

        await store.fetchDailyLimits();
        expect(loadingDuringCall).toBe(true);
      });
    });

    describe('closeSession', () => {
      it('should close current session', async () => {
        const store = useTaroStore();
        store.currentSession = {
          session_id: 'test-session',
          status: 'ACTIVE',
          cards: [],
          created_at: new Date().toISOString(),
          expires_at: new Date().toISOString(),
          tokens_consumed: 10,
          follow_up_count: 1,
        };

        store.closeSession();

        expect(store.currentSession).toBeNull();
      });

      it('should handle close when no session active', () => {
        const store = useTaroStore();
        expect(() => store.closeSession()).not.toThrow();
      });
    });

    describe('reset', () => {
      it('should reset all state', () => {
        const store = useTaroStore();
        store.currentSession = {
          session_id: 'test',
          status: 'ACTIVE',
          cards: [],
          created_at: new Date().toISOString(),
          expires_at: new Date().toISOString(),
          tokens_consumed: 10,
          follow_up_count: 0,
        };
        store.sessionHistory = [
          {
            session_id: 'old',
            status: 'CLOSED',
            cards: [],
            created_at: new Date().toISOString(),
            follow_up_count: 0,
          },
        ];
        store.error = 'Some error';
        store.loading = true;

        store.reset();

        expect(store.currentSession).toBeNull();
        expect(store.sessionHistory).toEqual([]);
        expect(store.dailyLimits).toBeNull();
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
        expect(store.historyLoading).toBe(false);
        expect(store.limitsLoading).toBe(false);
      });
    });
  });

  describe('Session State Management', () => {
    it('should maintain session state across multiple operations', async () => {
      const mockSession = {
        session_id: 'test-id',
        status: 'ACTIVE',
        cards: [
          { card_id: 'c1', position: 'PAST' },
          { card_id: 'c2', position: 'PRESENT' },
          { card_id: 'c3', position: 'FUTURE' },
        ],
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        tokens_consumed: 10,
        follow_up_count: 0,
      };

      const mockFollowUp = {
        success: true,
        follow_up: { follow_up_count: 1 },
      };

      vi.mocked(api.post)
        .mockResolvedValueOnce({ success: true, session: mockSession })
        .mockResolvedValueOnce(mockFollowUp);

      const store = useTaroStore();

      // Create session
      await store.createSession();
      expect(store.currentSession).not.toBeNull();
      expect(store.currentSession!.cards.length).toBe(3);
      expect(store.currentSession!.follow_up_count).toBe(0);

      // Add follow-up
      await store.addFollowUp('Tell me more', 'SAME_CARDS');
      expect(store.currentSession!.follow_up_count).toBe(1);
    });
  });
});
