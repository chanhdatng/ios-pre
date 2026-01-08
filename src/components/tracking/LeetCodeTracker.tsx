import { useState, useMemo } from 'react';
import { useLeetCodeStore, type LeetCodeProblem } from '../../lib/stores/leetcode-store';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { useToast } from '../ui/Toast';
import { Plus, Trash2, ExternalLink, Search, X, ChevronDown } from 'lucide-react';

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

const difficultyBgColors = {
  easy: 'bg-[var(--color-accent-green)]',
  medium: 'bg-[var(--color-accent-orange)]',
  hard: 'bg-[var(--color-accent-red)]',
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

  // Filter state (local, ephemeral)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [isPatternFilterOpen, setIsPatternFilterOpen] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Filter logic
  const filteredProblems = useMemo(() => {
    let result = problems;

    // Search filter
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }

    // Difficulty filter (OR within)
    if (selectedDifficulties.length > 0) {
      result = result.filter((p) => selectedDifficulties.includes(p.difficulty));
    }

    // Pattern filter (OR within)
    if (selectedPatterns.length > 0) {
      result = result.filter((p) => selectedPatterns.includes(p.pattern));
    }

    return result;
  }, [problems, debouncedQuery, selectedDifficulties, selectedPatterns]);

  const hasFilters = searchQuery || selectedDifficulties.length > 0 || selectedPatterns.length > 0;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulties([]);
    setSelectedPatterns([]);
  };

  const toggleDifficulty = (diff: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  };

  const togglePattern = (pattern: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]
    );
  };

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

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search problems by title or ID"
            className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface-primary)] border border-[var(--color-surface-primary)] rounded-[var(--radius-md)] text-body focus:outline-none focus:border-[var(--color-accent-blue)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Difficulty Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter by difficulty">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => toggleDifficulty(diff)}
              aria-pressed={selectedDifficulties.includes(diff)}
              className={`px-3 py-1.5 rounded-full text-body-small font-medium transition-colors ${
                selectedDifficulties.includes(diff)
                  ? `${difficultyBgColors[diff]} text-white`
                  : 'bg-[var(--color-surface-primary)] hover:opacity-80'
              }`}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        {/* Pattern Filter - Collapsible */}
        <div className="mb-4">
          <button
            onClick={() => setIsPatternFilterOpen(!isPatternFilterOpen)}
            aria-expanded={isPatternFilterOpen}
            aria-controls="pattern-filter-panel"
            className="flex items-center gap-2 text-body-small font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isPatternFilterOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            Filter by Pattern{' '}
            {selectedPatterns.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[var(--color-accent-orange)] text-white rounded text-caption">
                {selectedPatterns.length}
              </span>
            )}
          </button>
          {isPatternFilterOpen && (
            <div
              id="pattern-filter-panel"
              role="group"
              aria-label="Filter by pattern"
              className="flex flex-wrap gap-2 mt-2 p-3 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)]"
            >
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => togglePattern(pattern)}
                  aria-pressed={selectedPatterns.includes(pattern)}
                  className={`px-2 py-1 rounded text-body-small transition-colors ${
                    selectedPatterns.includes(pattern)
                      ? 'bg-[var(--color-accent-orange)] text-white'
                      : 'bg-[var(--color-surface-secondary)] hover:opacity-80'
                  }`}
                >
                  {pattern}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-body-small mb-4">
          <span className="text-[var(--color-text-secondary)]">
            {filteredProblems.length} of {problems.length} problems
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-[var(--color-accent-blue)] hover:underline"
            >
              Clear filters
            </button>
          )}
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
          {filteredProblems.length === 0 ? (
            <p className="text-center text-caption py-8">
              {problems.length === 0
                ? 'No problems logged yet. Start adding your solved problems!'
                : 'No problems match your filters.'}
            </p>
          ) : (
            filteredProblems.map((p) => (
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
                    <span className={difficultyColors[p.difficulty]}>{p.difficulty}</span> •{' '}
                    {p.pattern}
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
