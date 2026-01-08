import { useState } from 'react';
import { useLeetCodeStore, type LeetCodeProblem } from '../../lib/stores/leetcode-store';
import { useToast } from '../ui/Toast';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

const PATTERNS = [
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'DFS',
  'BFS',
  'Dynamic Programming',
  'Backtracking',
  'Hash Map',
  'Stack',
  'Heap',
  'Graph',
  'Tree',
  'Linked List',
  'Other',
];

const difficultyColors = {
  easy: 'text-[var(--color-accent-green)]',
  medium: 'text-[var(--color-accent-orange)]',
  hard: 'text-[var(--color-accent-red)]',
};

export default function LeetCodeTracker() {
  const {
    problems,
    addProblem,
    removeProblem,
    getStatsByDifficulty,
    getStatsByPattern,
  } = useLeetCodeStore();
  const toast = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [newProblem, setNewProblem] = useState({
    id: '',
    title: '',
    difficulty: 'medium' as LeetCodeProblem['difficulty'],
    pattern: 'Two Pointers',
    notes: '',
  });

  const manualStats = getStatsByDifficulty();
  const patternStats = getStatsByPattern();
  const totalSolved = manualStats.easy + manualStats.medium + manualStats.hard;

  const handleAddProblem = () => {
    const trimmedId = newProblem.id.trim();
    const trimmedTitle = newProblem.title.trim();

    if (!trimmedId || !trimmedTitle) return;

    // Check for duplicate
    if (problems.some((p) => p.id === trimmedId)) {
      toast.warning(`Problem #${trimmedId} already exists!`);
      return;
    }

    addProblem({
      ...newProblem,
      id: trimmedId,
      title: trimmedTitle,
    });
    toast.success(`Added problem #${trimmedId}`);
    setNewProblem({
      id: '',
      title: '',
      difficulty: 'medium',
      pattern: 'Two Pointers',
      notes: '',
    });
    setIsAdding(false);
  };

  // Generate safe LeetCode URL slug
  const getLeetCodeUrl = (title: string): string => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
      .trim();
    return `https://leetcode.com/problems/${encodeURIComponent(slug)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-center">
          <p className="text-headline-1">{totalSolved}</p>
          <p className="text-caption">Total</p>
        </div>
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-center">
          <p className={`text-headline-1 ${difficultyColors.easy}`}>{manualStats.easy}</p>
          <p className="text-caption">Easy</p>
        </div>
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-center">
          <p className={`text-headline-1 ${difficultyColors.medium}`}>{manualStats.medium}</p>
          <p className="text-caption">Medium</p>
        </div>
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-center">
          <p className={`text-headline-1 ${difficultyColors.hard}`}>{manualStats.hard}</p>
          <p className="text-caption">Hard</p>
        </div>
      </div>

      {/* Pattern breakdown */}
      {Object.keys(patternStats).length > 0 && (
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
          <h3 className="font-semibold mb-3 text-body">By Pattern</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(patternStats).map(([pattern, count]) => (
              <span
                key={pattern}
                className="px-3 py-1 bg-[var(--color-surface-primary)] rounded-full text-body-small"
              >
                {pattern}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Problem Log */}
      <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-body">Problem Log</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-body-small text-[var(--color-accent-blue)]"
          >
            <Plus className="w-4 h-4" /> Add Problem
          </button>
        </div>

        {isAdding && (
          <div className="mb-4 p-4 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)] space-y-3">
            <input
              type="text"
              placeholder="Problem ID (e.g., 1)"
              value={newProblem.id}
              onChange={(e) => setNewProblem({ ...newProblem, id: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
            />
            <input
              type="text"
              placeholder="Problem Title"
              value={newProblem.title}
              onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
            />
            <div className="flex gap-3">
              <select
                value={newProblem.difficulty}
                onChange={(e) =>
                  setNewProblem({
                    ...newProblem,
                    difficulty: e.target.value as LeetCodeProblem['difficulty'],
                  })
                }
                className="px-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={newProblem.pattern}
                onChange={(e) => setNewProblem({ ...newProblem, pattern: e.target.value })}
                className="flex-1 px-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
              >
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddProblem}
                className="px-4 py-2 bg-[var(--color-accent-orange)] text-white rounded-[var(--radius-md)] font-medium"
              >
                Add
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {problems.length === 0 ? (
            <p className="text-center text-caption py-8">
              No problems logged yet. Start adding your solved problems!
            </p>
          ) : (
            problems.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)]"
              >
                <div>
                  <a
                    href={getLeetCodeUrl(p.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-[var(--color-accent-blue)] flex items-center gap-1 text-body"
                  >
                    #{p.id} {p.title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-caption">
                    <span className={difficultyColors[p.difficulty]}>{p.difficulty}</span> • {p.pattern}
                  </p>
                </div>
                <button
                  onClick={() => removeProblem(p.id)}
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-red)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
