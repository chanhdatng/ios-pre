import { useProgressStore } from '@lib/stores/progress-store';
import { useFlashcardStore } from '@lib/stores/flashcard-store';
import { getReviewStats } from '@lib/fsrs/storage';
import { Flame, BarChart3, Target } from 'lucide-react';

export default function DashboardStats() {
  const streak = useProgressStore(s => s.streak);
  const reviewsToday = useFlashcardStore(s => s.reviewsToday);
  const stats = getReviewStats();

  // Calculate retention rate (cards reviewed that were marked good/easy vs total)
  const retentionRate = stats.total > 0
    ? Math.round((stats.total - stats.due) / stats.total * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
      <div className="card p-6 animate-scale-in">
        <div className="flex items-center gap-3">
          <div className="btn-icon">
            <BarChart3 className="w-5 h-5 text-[var(--color-accent-blue)]" />
          </div>
          <div>
            <h3 className="text-caption text-[var(--color-text-secondary)]">Cards Reviewed</h3>
            <p className="text-headline-2 font-bold">{stats.total}</p>
            <p className="text-caption text-[var(--color-accent-green)]">+{reviewsToday} today</p>
          </div>
        </div>
      </div>

      <div className="card p-6 animate-scale-in">
        <div className="flex items-center gap-3">
          <div className="btn-icon">
            <Target className="w-5 h-5 text-[var(--color-accent-green)]" />
          </div>
          <div>
            <h3 className="text-caption text-[var(--color-text-secondary)]">Retention Rate</h3>
            <p className="text-headline-2 font-bold">{retentionRate}%</p>
            <p className="text-caption text-[var(--color-text-tertiary)]">{stats.due} cards due</p>
          </div>
        </div>
      </div>

      <div className="card p-6 animate-scale-in">
        <div className="flex items-center gap-3">
          <div className="btn-icon">
            <Flame className="w-5 h-5 text-[var(--color-accent-orange)]" />
          </div>
          <div>
            <h3 className="text-caption text-[var(--color-text-secondary)]">Current Streak</h3>
            <p className="text-headline-2 font-bold">{streak} days</p>
            <p className="text-caption text-[var(--color-text-tertiary)]">Keep it up!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
