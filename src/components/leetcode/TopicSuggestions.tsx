import { useState, useMemo } from 'react';
import { useLeetCodeStore } from '../../lib/stores/leetcode-store';
import { useSuggestionStore, type CustomSuggestion } from '../../lib/stores/suggestion-store';
import suggestionsData from '../../data/leetcode-suggestions.json';
import { Check, Plus, ExternalLink, ChevronDown, X, UserPlus } from 'lucide-react';

interface SuggestedProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  relevance: string;
  isCustom?: boolean;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  problems: SuggestedProblem[];
}

const DIFFICULTY_COLORS = {
  easy: 'text-[var(--color-accent-green)]',
  medium: 'text-[var(--color-accent-orange)]',
  hard: 'text-[var(--color-accent-red)]',
};

const PATTERNS = [
  'Two Pointers', 'Sliding Window', 'Binary Search', 'DFS', 'BFS',
  'Dynamic Programming', 'Backtracking', 'Hash Map', 'Stack', 'Heap',
  'Graph', 'Tree', 'Linked List', 'Other'
];

interface TopicSuggestionsProps {
  /** Filter to show only specific topics by ID. If not provided, shows all with dropdown. */
  filterTopics?: string[];
  /** Hide the header section */
  compact?: boolean;
}

export function TopicSuggestions({ filterTopics, compact = false }: TopicSuggestionsProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>(
    filterTopics?.length === 1 ? filterTopics[0] : 'all'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProblem, setNewProblem] = useState({
    id: '',
    title: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    pattern: 'Other',
    relevance: '',
  });

  const solvedProblems = useLeetCodeStore((s) => s.problems);
  const addProblemToTracker = useLeetCodeStore((s) => s.addProblem);

  const customSuggestions = useSuggestionStore((s) => s.customSuggestions);
  const addCustomSuggestion = useSuggestionStore((s) => s.addSuggestion);
  const removeCustomSuggestion = useSuggestionStore((s) => s.removeSuggestion);

  // Filter topics if filterTopics prop is provided
  const allTopics = suggestionsData.topics as Topic[];
  const topics = filterTopics
    ? allTopics.filter((t) => filterTopics.includes(t.id))
    : allTopics;

  // Show dropdown only when not filtering or filtering multiple topics
  const showDropdown = !filterTopics || filterTopics.length > 1;

  // Check if problem is already solved
  const isSolved = (problemId: string) =>
    solvedProblems.some((p) => p.id === problemId);

  // Merge curated + custom suggestions
  const filteredProblems = useMemo(() => {
    let problems: (SuggestedProblem & { topicName: string; topicId: string })[] = [];

    if (selectedTopic === 'all') {
      // Flatten all curated problems
      problems = topics.flatMap((t) =>
        t.problems.map((p) => ({ ...p, topicName: t.name, topicId: t.id, isCustom: false }))
      );
      // Add all custom suggestions
      customSuggestions.forEach((cs) => {
        const topic = topics.find((t) => t.id === cs.topicId);
        problems.push({
          ...cs,
          relevance: cs.relevance || 'Custom suggestion',
          topicName: topic?.name || cs.topicId,
          isCustom: true,
        });
      });
    } else {
      // Get curated for selected topic
      const topic = topics.find((t) => t.id === selectedTopic);
      if (topic) {
        problems = topic.problems.map((p) => ({
          ...p,
          topicName: topic.name,
          topicId: topic.id,
          isCustom: false,
        }));
      }
      // Add custom for selected topic
      customSuggestions
        .filter((cs) => cs.topicId === selectedTopic)
        .forEach((cs) => {
          problems.push({
            ...cs,
            relevance: cs.relevance || 'Custom suggestion',
            topicName: topic?.name || selectedTopic,
            topicId: selectedTopic,
            isCustom: true,
          });
        });
    }

    return problems;
  }, [selectedTopic, topics, customSuggestions]);

  // Get selected topic name for display
  const selectedTopicName =
    selectedTopic === 'all'
      ? 'All Topics'
      : topics.find((t) => t.id === selectedTopic)?.name || 'All Topics';

  // Handle add to tracker
  const handleAddToTracker = (problem: SuggestedProblem) => {
    if (isSolved(problem.id)) return;
    addProblemToTracker({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      pattern: problem.pattern,
    });
  };

  // Handle add custom suggestion
  const handleAddCustom = () => {
    if (!newProblem.id.trim() || !newProblem.title.trim()) return;
    if (selectedTopic === 'all') return; // Must select a topic

    addCustomSuggestion({
      id: newProblem.id.trim(),
      title: newProblem.title.trim(),
      difficulty: newProblem.difficulty,
      pattern: newProblem.pattern,
      topicId: selectedTopic,
      relevance: newProblem.relevance.trim() || undefined,
    });

    // Reset form
    setNewProblem({ id: '', title: '', difficulty: 'medium', pattern: 'Other', relevance: '' });
    setShowAddForm(false);
  };

  // Get LeetCode URL
  const getLeetCodeUrl = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return `https://leetcode.com/problems/${slug}/`;
  };

  // Stats
  const solvedCount = filteredProblems.filter((p) => isSolved(p.id)).length;
  const customCount = filteredProblems.filter((p) => p.isCustom).length;

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {!compact && <h3 className="text-body font-semibold">Suggested Problems</h3>}
          <span className="text-caption text-[var(--color-text-secondary)]">
            {solvedCount}/{filteredProblems.length} solved
            {customCount > 0 && ` • ${customCount} custom`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add custom button */}
          {selectedTopic !== 'all' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] text-body-small transition-colors ${
                showAddForm
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)]'
              }`}
              aria-expanded={showAddForm}
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Custom</span>
            </button>
          )}

          {/* Topic dropdown - only show when multiple topics */}
          {showDropdown && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small hover:bg-[var(--color-surface-tertiary)] transition-colors"
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
              >
                {selectedTopicName}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-[var(--color-surface-primary)] border border-[var(--color-surface-tertiary)] rounded-[var(--radius-md)] shadow-lg z-10 max-h-64 overflow-y-auto"
                  role="listbox"
                >
                  {!filterTopics && (
                    <button
                      onClick={() => {
                        setSelectedTopic('all');
                        setIsDropdownOpen(false);
                        setShowAddForm(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-body-small hover:bg-[var(--color-surface-secondary)] ${
                        selectedTopic === 'all' ? 'bg-[var(--color-surface-secondary)]' : ''
                      }`}
                      role="option"
                      aria-selected={selectedTopic === 'all'}
                    >
                      All Topics
                    </button>
                  )}
                  {topics.map((topic) => {
                    const customForTopic = customSuggestions.filter((c) => c.topicId === topic.id).length;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setSelectedTopic(topic.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-body-small hover:bg-[var(--color-surface-secondary)] ${
                          selectedTopic === topic.id ? 'bg-[var(--color-surface-secondary)]' : ''
                        }`}
                        role="option"
                        aria-selected={selectedTopic === topic.id}
                      >
                        <span>{topic.name}</span>
                        <span className="text-caption text-[var(--color-text-tertiary)] ml-2">
                          ({topic.problems.length}{customForTopic > 0 ? `+${customForTopic}` : ''})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add custom form */}
      {showAddForm && selectedTopic !== 'all' && (
        <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-accent-blue)]/30 rounded-[var(--radius-md)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-body-small font-medium">Add Custom Problem</span>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-[var(--color-surface-secondary)] rounded"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Problem ID (e.g., 146)"
              value={newProblem.id}
              onChange={(e) => setNewProblem({ ...newProblem, id: e.target.value })}
              className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small"
            />
            <input
              type="text"
              placeholder="Title (e.g., LRU Cache)"
              value={newProblem.title}
              onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
              className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={newProblem.difficulty}
              onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
              className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              value={newProblem.pattern}
              onChange={(e) => setNewProblem({ ...newProblem, pattern: e.target.value })}
              className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small"
            >
              {PATTERNS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Why relevant? (optional)"
            value={newProblem.relevance}
            onChange={(e) => setNewProblem({ ...newProblem, relevance: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small"
          />

          <button
            onClick={handleAddCustom}
            disabled={!newProblem.id.trim() || !newProblem.title.trim()}
            className="w-full py-2 bg-[var(--color-accent-blue)] text-white rounded-[var(--radius-md)] text-body-small font-medium hover:bg-[var(--color-accent-blue)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Suggestion
          </button>
        </div>
      )}

      {/* Problem list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredProblems.map((problem) => {
          const solved = isSolved(problem.id);
          return (
            <div
              key={`${problem.topicId}-${problem.id}-${problem.isCustom ? 'custom' : 'curated'}`}
              className={`p-3 rounded-[var(--radius-md)] border transition-colors ${
                solved
                  ? 'bg-[var(--color-accent-green)]/5 border-[var(--color-accent-green)]/20'
                  : problem.isCustom
                    ? 'bg-[var(--color-accent-blue)]/5 border-[var(--color-accent-blue)]/20'
                    : 'bg-[var(--color-surface-primary)] border-[var(--color-surface-tertiary)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={getLeetCodeUrl(problem.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-small font-medium hover:text-[var(--color-accent-blue)] inline-flex items-center gap-1"
                    >
                      #{problem.id} {problem.title}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {solved && (
                      <span className="inline-flex items-center gap-1 text-caption text-[var(--color-accent-green)]">
                        <Check className="w-3 h-3" />
                        Solved
                      </span>
                    )}
                    {problem.isCustom && (
                      <span className="text-caption text-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10 px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-caption font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}
                    >
                      {problem.difficulty}
                    </span>
                    <span className="text-caption text-[var(--color-text-tertiary)]">•</span>
                    <span className="text-caption text-[var(--color-text-secondary)]">
                      {problem.pattern}
                    </span>
                    {selectedTopic === 'all' && (
                      <>
                        <span className="text-caption text-[var(--color-text-tertiary)]">•</span>
                        <span className="text-caption text-[var(--color-accent-blue)]">
                          {problem.topicName}
                        </span>
                      </>
                    )}
                  </div>
                  {problem.relevance && (
                    <p className="text-caption text-[var(--color-text-tertiary)] mt-1">
                      {problem.relevance}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Remove custom button */}
                  {problem.isCustom && (
                    <button
                      onClick={() => removeCustomSuggestion(problem.id, problem.topicId)}
                      className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-accent-red)]/10 text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-red)] transition-colors"
                      title="Remove custom suggestion"
                      aria-label={`Remove ${problem.title}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Add to tracker button */}
                  {!solved && (
                    <button
                      onClick={() => handleAddToTracker(problem)}
                      className="p-2 rounded-[var(--radius-md)] bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue)]/80 transition-colors"
                      title="Add to tracker"
                      aria-label={`Add ${problem.title} to tracker`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProblems.length === 0 && (
        <p className="text-center text-caption text-[var(--color-text-secondary)] py-8">
          No suggestions for this topic yet.
          {selectedTopic !== 'all' && ' Click "Add Custom" to add your own!'}
        </p>
      )}
    </div>
  );
}
