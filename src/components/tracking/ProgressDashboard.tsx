import { useProgressStore } from '@lib/stores/progress-store';
import { useFlashcardStore } from '@lib/stores/flashcard-store';
import { getReviewStats } from '@lib/fsrs/storage';
import { BarChart3, Flame, Target, Calendar } from 'lucide-react';

interface WeekData {
  month: number;
  week: number;
  title: string;
  items: { id: string; label: string }[];
}

interface ProgressDashboardProps {
  weeks: WeekData[];
}

export default function ProgressDashboard({ weeks }: ProgressDashboardProps) {
  const { checklist, toggleChecklistItem, streak, getWeekProgress } = useProgressStore();
  const reviewsToday = useFlashcardStore(s => s.reviewsToday);

  const stats = getReviewStats();

  return (
    <div className="space-y-[var(--spacing-xl)]">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--spacing-md)]">
        <StatCard
          icon={<Flame className="text-[var(--color-accent-orange)]" />}
          label="Current Streak"
          value={`${streak} days`}
        />
        <StatCard
          icon={<BarChart3 className="text-[var(--color-accent-blue)]" />}
          label="Reviews Today"
          value={reviewsToday.toString()}
        />
        <StatCard
          icon={<Target className="text-[var(--color-accent-green)]" />}
          label="Cards Due"
          value={stats.due.toString()}
        />
        <StatCard
          icon={<Calendar className="text-[var(--color-accent-purple)]" />}
          label="Total Cards"
          value={stats.total.toString()}
        />
      </div>

      {/* Weekly Progress */}
      <div className="card p-[var(--spacing-lg)]">
        <h3 className="text-headline-3 mb-[var(--spacing-md)]">Weekly Progress</h3>

        <div className="space-y-[var(--spacing-lg)]">
          {weeks.map((week) => {
            const progress = getWeekProgress(week.month, week.week);

            return (
              <div key={`m${week.month}w${week.week}`}>
                <div className="flex justify-between items-center mb-[var(--spacing-xs)]">
                  <span className="text-body font-medium">
                    Month {week.month}, Week {week.week}: {week.title}
                  </span>
                  <span className="text-caption">{progress}%</span>
                </div>

                <div className="progress-bar mb-[var(--spacing-sm)]">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-[var(--spacing-xs)]">
                  {week.items.map((item) => {
                    const itemId = `month${week.month}-week${week.week}-${item.id}`;
                    const isChecked = checklist[itemId] || false;

                    return (
                      <label
                        key={itemId}
                        className="flex items-center gap-[var(--spacing-xs)] text-body-small cursor-pointer hover:text-[var(--color-accent-orange)] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecklistItem(itemId)}
                          className="rounded border-[var(--color-surface-secondary)] accent-[var(--color-accent-orange)]"
                        />
                        <span className={isChecked ? 'line-through text-[var(--color-text-tertiary)]' : ''}>
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-[var(--spacing-md)] animate-scale-in">
      <div className="flex items-center gap-[var(--spacing-sm)]">
        <div className="btn-icon">
          {icon}
        </div>
        <div className="metric-card">
          <span className="metric-label">{label}</span>
          <span className="metric-value text-xl">{value}</span>
        </div>
      </div>
    </div>
  );
}
