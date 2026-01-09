import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomSuggestion {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  topicId: string;
  relevance?: string;
  addedAt: string;
}

interface SuggestionState {
  customSuggestions: CustomSuggestion[];
  addSuggestion: (suggestion: Omit<CustomSuggestion, 'addedAt'>) => void;
  removeSuggestion: (id: string, topicId: string) => void;
  getSuggestionsByTopic: (topicId: string) => CustomSuggestion[];
}

export const useSuggestionStore = create<SuggestionState>()(
  persist(
    (set, get) => ({
      customSuggestions: [],

      addSuggestion: (suggestion) =>
        set((state) => {
          // Prevent duplicates (same id + topicId)
          const exists = state.customSuggestions.some(
            (s) => s.id === suggestion.id && s.topicId === suggestion.topicId
          );
          if (exists) return state;

          return {
            customSuggestions: [
              ...state.customSuggestions,
              {
                ...suggestion,
                addedAt: new Date().toISOString(),
              },
            ],
          };
        }),

      removeSuggestion: (id, topicId) =>
        set((state) => ({
          customSuggestions: state.customSuggestions.filter(
            (s) => !(s.id === id && s.topicId === topicId)
          ),
        })),

      getSuggestionsByTopic: (topicId) => {
        const { customSuggestions } = get();
        return customSuggestions.filter((s) => s.topicId === topicId);
      },
    }),
    { name: 'ios-prep-custom-suggestions' }
  )
);
