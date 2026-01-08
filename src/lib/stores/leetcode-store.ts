import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  solvedAt: string;
  notes?: string;
}

interface LeetCodeState {
  username: string;
  problems: LeetCodeProblem[];
  apiStats: {
    easy: number;
    medium: number;
    hard: number;
    lastFetch: string;
  } | null;

  setUsername: (username: string) => void;
  addProblem: (problem: Omit<LeetCodeProblem, 'solvedAt'>) => void;
  removeProblem: (id: string) => void;
  updateApiStats: (stats: LeetCodeState['apiStats']) => void;
  getStatsByDifficulty: () => { easy: number; medium: number; hard: number };
  getStatsByPattern: () => Record<string, number>;
}

export const useLeetCodeStore = create<LeetCodeState>()(
  persist(
    (set, get) => ({
      username: '',
      problems: [],
      apiStats: null,

      setUsername: (username) => set({ username }),

      addProblem: (problem) =>
        set((state) => ({
          problems: [
            ...state.problems,
            { ...problem, solvedAt: new Date().toISOString() },
          ],
        })),

      removeProblem: (id) =>
        set((state) => ({
          problems: state.problems.filter((p) => p.id !== id),
        })),

      updateApiStats: (stats) => set({ apiStats: stats }),

      getStatsByDifficulty: () => {
        const { problems } = get();
        return problems.reduce(
          (acc, p) => {
            acc[p.difficulty]++;
            return acc;
          },
          { easy: 0, medium: 0, hard: 0 }
        );
      },

      getStatsByPattern: () => {
        const { problems } = get();
        return problems.reduce(
          (acc, p) => {
            acc[p.pattern] = (acc[p.pattern] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      },
    }),
    { name: 'ios-prep-leetcode' }
  )
);
