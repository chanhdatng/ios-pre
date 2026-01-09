import { useState, useMemo } from 'react';
import { useLeetCodeStore, type LeetCodeProblem } from '../../lib/stores/leetcode-store';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { useToast } from '../ui/Toast';
import {
  Plus,
  Trash2,
  ExternalLink,
  Search,
  X,
  ChevronDown,
  Calendar,
  Tag,
  RotateCcw,
} from 'lucide-react';
import {
  ProgressLineChart,
  DifficultyPieChart,
  PatternBarChart,
  StreakDisplay,
} from '../charts/LeetCodeCharts';

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

type SortOption = 'date-desc' | 'date-asc' | 'difficulty' | 'title' | 'retry';

export default function LeetCodeTracker() {
  const {
    problems,
    addProblem,
    removeProblem,
    removeBulk,
    getStatsByDifficulty,
    getStatsByPattern,
  } = useLeetCodeStore();
  const toast = useToast();

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [newProblem, setNewProblem] = useState({
    id: '',
    title: '',
    difficulty: 'medium' as LeetCodeProblem['difficulty'],
    pattern: 'Two Pointers',
    notes: '',
    solvedAt: new Date().toISOString().split('T')[0],
  });
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{ id?: string; title?: string }>({});

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [isPatternFilterOpen, setIsPatternFilterOpen] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Expand state for notes
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Bulk select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Filter logic
  const filteredProblems = useMemo(() => {
    let result = problems;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }

    if (selectedDifficulties.length > 0) {
      result = result.filter((p) => selectedDifficulties.includes(p.difficulty));
    }

    if (selectedPatterns.length > 0) {
      result = result.filter((p) => selectedPatterns.includes(p.pattern));
    }

    return result;
  }, [problems, debouncedQuery, selectedDifficulties, selectedPatterns]);

  // Sort logic
  const sortedProblems = useMemo(() => {
    const sorted = [...filteredProblems];
    const diffOrder = { easy: 0, medium: 1, hard: 2 };

    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => b.solvedAt.localeCompare(a.solvedAt));
      case 'date-asc':
        return sorted.sort((a, b) => a.solvedAt.localeCompare(b.solvedAt));
      case 'difficulty':
        return sorted.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'retry':
        return sorted.sort((a, b) => (b.retryCount || 0) - (a.retryCount || 0));
      default:
        return sorted;
    }
  }, [filteredProblems, sortBy]);

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

  // Tag handlers
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formTags.includes(tag)) {
      setFormTags([...formTags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormTags(formTags.filter((t) => t !== tag));
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!newProblem.id.trim()) {
      newErrors.id = 'Problem ID is required';
    } else if (problems.some((p) => p.id === newProblem.id.trim())) {
      newErrors.id = 'Problem already exists';
    }

    if (!newProblem.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProblem = () => {
    if (!validateForm()) return;

    const trimmedId = newProblem.id.trim();
    const trimmedTitle = newProblem.title.trim();

    addProblem({
      ...newProblem,
      id: trimmedId,
      title: trimmedTitle,
      notes: newProblem.notes.trim() || undefined,
      tags: formTags.length > 0 ? formTags : undefined,
      solvedAt: newProblem.solvedAt
        ? new Date(newProblem.solvedAt).toISOString()
        : new Date().toISOString(),
    });
    toast.success(`Added problem #${trimmedId}`);
    resetForm();
  };

  const resetForm = () => {
    setNewProblem({
      id: '',
      title: '',
      difficulty: 'medium',
      pattern: 'Two Pointers',
      notes: '',
      solvedAt: new Date().toISOString().split('T')[0],
    });
    setFormTags([]);
    setTagInput('');
    setErrors({});
    setIsAdding(false);
  };

  // Bulk select handlers
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(sortedProblems.map((p) => p.id)));
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} problem(s)?`)) return;

    removeBulk(Array.from(selectedIds));
    toast.success(`Deleted ${selectedIds.size} problem(s)`);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const getLeetCodeUrl = (title: string): string => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return `https://leetcode.com/problems/${encodeURIComponent(slug)}`;
  };

  const manualStats = getStatsByDifficulty();
  const patternStats = getStatsByPattern();
  const totalSolved = manualStats.easy + manualStats.medium + manualStats.hard;

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

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
          <h3 className="font-semibold mb-3 text-body">Progress Over Time</h3>
          <ProgressLineChart />
        </div>
        <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
          <h3 className="font-semibold mb-3 text-body">Difficulty Distribution</h3>
          <DifficultyPieChart />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
          <h3 className="font-semibold mb-3 text-body">Top Patterns</h3>
          <PatternBarChart />
        </div>
        <StreakDisplay />
      </div>

      {/* Problem Log */}
      <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-body">Problem Log</h3>
          <div className="flex items-center gap-3">
            {!isSelectMode ? (
              <>
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="text-body-small text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  Select
                </button>
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1 text-body-small text-[var(--color-accent-blue)]"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </>
            ) : (
              <button
                onClick={exitSelectMode}
                className="text-body-small text-[var(--color-text-secondary)]"
              >
                Done
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {isSelectMode && selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 mb-4 bg-[var(--color-accent-orange)]/10 rounded-[var(--radius-md)]">
            <span className="text-body-small">{selectedIds.size} selected</span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-body-small text-[var(--color-accent-blue)]"
              >
                Select all ({sortedProblems.length})
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1 bg-[var(--color-accent-red)] text-white rounded text-body-small"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]"
            aria-hidden="true"
          />
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

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Difficulty Chips */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by difficulty">
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

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort problems"
            className="px-3 py-1.5 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)] text-body-small"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="difficulty">By difficulty</option>
            <option value="title">By title</option>
            <option value="retry">By retry count</option>
          </select>
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
            {sortedProblems.length} of {problems.length} problems
          </span>
          {hasFilters && (
            <button onClick={clearFilters} className="text-[var(--color-accent-blue)] hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Add Problem Form */}
        {isAdding && (
          <div className="mb-4 p-4 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)] space-y-3">
            {/* Problem ID */}
            <div>
              <input
                type="text"
                placeholder="Problem ID (e.g., 1)"
                value={newProblem.id}
                onChange={(e) => {
                  setNewProblem({ ...newProblem, id: e.target.value });
                  if (errors.id) setErrors({ ...errors, id: undefined });
                }}
                className={`w-full px-3 py-2 bg-[var(--color-surface-secondary)] border rounded-[var(--radius-md)] text-body ${
                  errors.id
                    ? 'border-[var(--color-accent-red)]'
                    : 'border-[var(--color-surface-secondary)]'
                }`}
              />
              {errors.id && (
                <p className="text-caption text-[var(--color-accent-red)] mt-1">{errors.id}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Problem Title"
                value={newProblem.title}
                onChange={(e) => {
                  setNewProblem({ ...newProblem, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                className={`w-full px-3 py-2 bg-[var(--color-surface-secondary)] border rounded-[var(--radius-md)] text-body ${
                  errors.title
                    ? 'border-[var(--color-accent-red)]'
                    : 'border-[var(--color-surface-secondary)]'
                }`}
              />
              {errors.title && (
                <p className="text-caption text-[var(--color-accent-red)] mt-1">{errors.title}</p>
              )}
            </div>

            {/* Difficulty & Pattern */}
            <div className="flex flex-wrap gap-3">
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
                className="flex-1 min-w-[140px] px-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
              >
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
              <input
                type="date"
                value={newProblem.solvedAt}
                onChange={(e) => setNewProblem({ ...newProblem, solvedAt: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                aria-label="Date solved"
                className="px-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
              />
            </div>

            {/* Notes */}
            <textarea
              placeholder="Notes (optional)"
              value={newProblem.notes}
              onChange={(e) => setNewProblem({ ...newProblem, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body resize-none"
            />

            {/* Tags Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    placeholder="Add tag (press Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface-secondary)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small"
                >
                  Add
                </button>
              </div>
              {formTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] rounded text-caption flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-[var(--color-accent-red)]"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleAddProblem}
                className="px-4 py-2 bg-[var(--color-accent-orange)] text-white rounded-[var(--radius-md)] font-medium"
              >
                Add
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Problem List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {sortedProblems.length === 0 ? (
            <p className="text-center text-caption py-8">
              {problems.length === 0
                ? 'No problems logged yet. Start adding your solved problems!'
                : 'No problems match your filters.'}
            </p>
          ) : (
            sortedProblems.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)]"
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox for bulk select */}
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="mt-1 w-5 h-5 accent-[var(--color-accent-orange)]"
                      aria-label={`Select problem ${p.id}`}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <a
                        href={getLeetCodeUrl(p.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-[var(--color-accent-blue)] flex items-center gap-1 text-body truncate"
                      >
                        #{p.id} {p.title}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>

                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {/* Expand notes button */}
                        {p.notes && (
                          <button
                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-blue)]"
                            aria-expanded={expandedId === p.id}
                            aria-label={expandedId === p.id ? 'Collapse notes' : 'Expand notes'}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                expandedId === p.id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        )}

                        {/* Delete button */}
                        {!isSelectMode && (
                          <button
                            onClick={() => removeProblem(p.id)}
                            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-red)]"
                            aria-label={`Delete problem ${p.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-caption">
                      <span className={difficultyColors[p.difficulty]}>{p.difficulty}</span> •{' '}
                      {p.pattern}
                      {p.retryCount && p.retryCount > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[var(--color-text-tertiary)]">
                          <RotateCcw className="w-3 h-3" />
                          {p.retryCount}
                        </span>
                      )}
                    </p>

                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] rounded text-caption"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded Notes */}
                    {expandedId === p.id && p.notes && (
                      <div className="mt-2 pt-2 border-t border-[var(--color-surface-secondary)] text-body-small text-[var(--color-text-secondary)]">
                        {p.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
