import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, ReviewLog } from 'ts-fsrs';

interface FlashcardState {
  // Card states (FSRS data)
  cardStates: Record<string, Card>;

  // Bookmarks
  bookmarks: string[];

  // Review session
  currentSession: string[];
  sessionIndex: number;

  // Stats
  reviewsToday: number;
  lastReviewDate: string;

  // Actions
  getCardState: (cardId: string) => Card | null;
  updateCardState: (cardId: string, card: Card, log: ReviewLog) => void;
  getDueCards: (topicFilter?: string) => string[];
  startSession: (cardIds: string[]) => void;
  nextCard: () => void;
  resetDailyStats: () => void;

  // Bookmark actions
  toggleBookmark: (cardId: string) => void;
  isBookmarked: (cardId: string) => boolean;
  getBookmarkedCards: () => string[];
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      cardStates: {},
      bookmarks: [],
      currentSession: [],
      sessionIndex: 0,
      reviewsToday: 0,
      lastReviewDate: new Date().toDateString(),

      getCardState: (cardId) => get().cardStates[cardId] || null,

      updateCardState: (cardId, card, log) => {
        const today = new Date().toDateString();
        set((state) => ({
          cardStates: { ...state.cardStates, [cardId]: card },
          reviewsToday: state.lastReviewDate === today
            ? state.reviewsToday + 1
            : 1,
          lastReviewDate: today,
        }));
      },

      getDueCards: (topicFilter) => {
        const now = new Date();
        const { cardStates } = get();
        return Object.entries(cardStates)
          .filter(([id, card]) => {
            const isDue = new Date(card.due) <= now;
            const matchesTopic = !topicFilter || id.startsWith(topicFilter);
            return isDue && matchesTopic;
          })
          .map(([id]) => id);
      },

      startSession: (cardIds) => set({
        currentSession: cardIds,
        sessionIndex: 0,
      }),

      nextCard: () => set((state) => ({
        sessionIndex: state.sessionIndex + 1,
      })),

      resetDailyStats: () => set({
        reviewsToday: 0,
        lastReviewDate: new Date().toDateString(),
      }),

      // Bookmark functions
      toggleBookmark: (cardId) => set((state) => ({
        bookmarks: state.bookmarks.includes(cardId)
          ? state.bookmarks.filter(id => id !== cardId)
          : [...state.bookmarks, cardId],
      })),

      isBookmarked: (cardId) => get().bookmarks.includes(cardId),

      getBookmarkedCards: () => get().bookmarks,
    }),
    { name: 'ios-prep-flashcards' }
  )
);
