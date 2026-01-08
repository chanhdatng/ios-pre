import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressState {
  // Weekly checklist: "month1-week1-item1" -> completed
  checklist: Record<string, boolean>;

  // Notes per topic: "closures" -> "My notes..."
  notes: Record<string, string>;

  // Streak tracking
  streak: number;
  lastStudyDate: string;

  // Actions
  toggleChecklistItem: (itemId: string) => void;
  updateNote: (topicId: string, content: string) => void;
  updateStreak: () => void;
  getWeekProgress: (month: number, week: number) => number;
  exportData: () => string;
  importData: (json: string) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      checklist: {},
      notes: {},
      streak: 0,
      lastStudyDate: '',

      toggleChecklistItem: (itemId) => set((state) => ({
        checklist: {
          ...state.checklist,
          [itemId]: !state.checklist[itemId],
        },
      })),

      updateNote: (topicId, content) => set((state) => ({
        notes: { ...state.notes, [topicId]: content },
      })),

      updateStreak: () => {
        const today = new Date().toDateString();
        const { lastStudyDate, streak } = get();

        if (lastStudyDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const isConsecutive = lastStudyDate === yesterday.toDateString();

        set({
          streak: isConsecutive ? streak + 1 : 1,
          lastStudyDate: today,
        });
      },

      getWeekProgress: (month, week) => {
        const prefix = `month${month}-week${week}`;
        const { checklist } = get();
        const items = Object.entries(checklist).filter(([k]) => k.startsWith(prefix));
        if (items.length === 0) return 0;
        const completed = items.filter(([, v]) => v).length;
        return Math.round((completed / items.length) * 100);
      },

      exportData: () => {
        const { checklist, notes, streak, lastStudyDate } = get();
        return JSON.stringify({ checklist, notes, streak, lastStudyDate }, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            checklist: data.checklist || {},
            notes: data.notes || {},
            streak: data.streak || 0,
            lastStudyDate: data.lastStudyDate || '',
          });
        } catch (e) {
          console.error('Import failed:', e);
        }
      },
    }),
    { name: 'ios-prep-progress' }
  )
);
