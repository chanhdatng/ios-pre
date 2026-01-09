import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Milliseconds per day constant
const MS_PER_DAY = 86400000; // 24 * 60 * 60 * 1000

// Get local date string (YYYY-MM-DD) to avoid timezone issues
const getLocalDateString = (timestamp: number = Date.now()): string => {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  solvedAt: string;
  notes?: string;
  tags?: string[];
  retryCount?: number;
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
  addProblem: (problem: Omit<LeetCodeProblem, 'solvedAt'> & { solvedAt?: string }) => void;
  removeProblem: (id: string) => void;
  removeBulk: (ids: string[]) => void;
  updateProblem: (id: string, updates: Partial<LeetCodeProblem>) => void;
  updateApiStats: (stats: LeetCodeState['apiStats']) => void;
  getStatsByDifficulty: () => { easy: number; medium: number; hard: number };
  getStatsByPattern: () => Record<string, number>;
  getProgressByDate: () => { date: string; count: number }[];
  getStreak: () => number;
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
            {
              ...problem,
              solvedAt: problem.solvedAt || new Date().toISOString(),
            },
          ],
        })),

      removeProblem: (id) =>
        set((state) => ({
          problems: state.problems.filter((p) => p.id !== id),
        })),

      removeBulk: (ids) =>
        set((state) => ({
          problems: state.problems.filter((p) => !ids.includes(p.id)),
        })),

      updateProblem: (id, updates) =>
        set((state) => ({
          problems: state.problems.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
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

      getProgressByDate: () => {
        const { problems } = get();
        const dateMap = new Map<string, number>();

        problems.forEach((p) => {
          const date = p.solvedAt.split('T')[0]; // YYYY-MM-DD
          dateMap.set(date, (dateMap.get(date) || 0) + 1);
        });

        // Sort by date, return last 30 days
        return Array.from(dateMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30);
      },

      getStreak: () => {
        const { problems } = get();
        if (problems.length === 0) return 0;

        // Extract local dates from problems and dedupe
        const dates = [
          ...new Set(
            problems.map((p) => {
              const d = new Date(p.solvedAt);
              return getLocalDateString(d.getTime());
            })
          ),
        ].sort().reverse();

        const today = getLocalDateString();
        const yesterday = getLocalDateString(Date.now() - MS_PER_DAY);

        // Must include today or yesterday to count as active streak
        if (dates[0] !== today && dates[0] !== yesterday) return 0;

        let streak = 1;
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1]);
          const curr = new Date(dates[i]);
          const diffMs = prev.getTime() - curr.getTime();
          const diffDays = Math.round(diffMs / MS_PER_DAY);
          if (diffDays === 1) streak++;
          else break;
        }
        return streak;
      },
    }),
    { name: 'ios-prep-leetcode' }
  )
);
