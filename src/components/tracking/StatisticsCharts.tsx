import { useMemo } from 'react';
import { useFlashcardStore } from '@lib/stores/flashcard-store';
import { useProgressStore } from '@lib/stores/progress-store';
import { getReviewStats } from '@lib/fsrs/storage';
import { BarChart3, Calendar, Target, TrendingUp } from 'lucide-react';

interface TopicStats {
  topic: string;
  total: number;
  reviewed: number;
  retention: number;
}

interface StatisticsChartsProps {
  topics: string[];
  cardsByTopic: Record<string, number>;
}

export default function StatisticsCharts({ topics, cardsByTopic }: StatisticsChartsProps) {
  const cardStates = useFlashcardStore(s => s.cardStates);
  const reviewsToday = useFlashcardStore(s => s.reviewsToday);
  const streak = useProgressStore(s => s.streak);
  const stats = getReviewStats();

  // Calculate topic-wise stats
  const topicStats = useMemo<TopicStats[]>(() => {
    return topics.map(topic => {
      const total = cardsByTopic[topic] || 0;
      // Count cards that have been reviewed (exist in cardStates)
      const reviewed = Object.keys(cardStates).filter(id =>
        id.toLowerCase().includes(topic.toLowerCase().replace(/\s+/g, '_').slice(0, 10))
      ).length;
      const retention = total > 0 ? Math.round((reviewed / total) * 100) : 0;

      return { topic, total, reviewed, retention };
    });
  }, [topics, cardsByTopic, cardStates]);

  // Overall retention
  const overallRetention = stats.total > 0
    ? Math.round((stats.total - stats.due) / stats.total * 100)
    : 0;

  // Max retention for scaling
  const maxRetention = Math.max(...topicStats.map(t => t.retention), 1);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <BarChart3 className="w-6 h-6 mx-auto mb-2 text-[var(--color-accent-blue)]" />
          <p className="text-headline-2 font-bold">{stats.total}</p>
          <p className="text-caption">Total Reviews</p>
        </div>
        <div className="card p-4 text-center">
          <Target className="w-6 h-6 mx-auto mb-2 text-[var(--color-accent-green)]" />
          <p className="text-headline-2 font-bold">{overallRetention}%</p>
          <p className="text-caption">Retention Rate</p>
        </div>
        <div className="card p-4 text-center">
          <Calendar className="w-6 h-6 mx-auto mb-2 text-[var(--color-accent-orange)]" />
          <p className="text-headline-2 font-bold">{reviewsToday}</p>
          <p className="text-caption">Today</p>
        </div>
        <div className="card p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-[var(--color-accent-purple)]" />
          <p className="text-headline-2 font-bold">{streak}</p>
          <p className="text-caption">Day Streak</p>
        </div>
      </div>

      {/* Topic Retention Chart */}
      <div className="card p-6">
        <h3 className="text-headline-3 mb-4">Progress by Topic</h3>
        <div className="space-y-3">
          {topicStats.map(({ topic, total, reviewed, retention }) => (
            <div key={topic}>
              <div className="flex justify-between text-body-small mb-1">
                <span className="font-medium">{topic}</span>
                <span className="text-[var(--color-text-secondary)]">
                  {reviewed}/{total} cards • {retention}%
                </span>
              </div>
              <div className="progress-bar h-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(retention / 100) * 100}%`,
                    background: retention >= 80
                      ? 'var(--color-accent-green)'
                      : retention >= 50
                      ? 'var(--color-accent-orange)'
                      : 'var(--color-accent-red)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Due Info */}
      <div className="card p-6">
        <h3 className="text-headline-3 mb-4">Review Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
            <p className="text-display font-bold text-[var(--color-accent-orange)]">{stats.due}</p>
            <p className="text-body-small text-[var(--color-text-secondary)]">Cards Due Now</p>
          </div>
          <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
            <p className="text-display font-bold text-[var(--color-accent-blue)]">{stats.total - stats.due}</p>
            <p className="text-body-small text-[var(--color-text-secondary)]">Cards Mastered</p>
          </div>
        </div>
      </div>

      {/* Study Tips */}
      {stats.due > 10 && (
        <div className="card p-4 border-l-4 border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/5">
          <p className="text-body-small">
            <strong>Tip:</strong> You have {stats.due} cards due. Try reviewing 20 cards daily to stay on track!
          </p>
        </div>
      )}

      {streak >= 7 && (
        <div className="card p-4 border-l-4 border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/5">
          <p className="text-body-small">
            <strong>Great job!</strong> You're on a {streak}-day streak. Keep it up!
          </p>
        </div>
      )}
    </div>
  );
}
