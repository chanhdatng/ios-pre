import { useState, useMemo } from 'react';
import { useLeetCodeStore } from '../../lib/stores/leetcode-store';
import suggestionsData from '../../data/leetcode-suggestions.json';
import { Check, Plus, ExternalLink, ChevronDown } from 'lucide-react';

interface SuggestedProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  relevance: string;
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

export function TopicSuggestions() {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const solvedProblems = useLeetCodeStore((s) => s.problems);
  const addProblem = useLeetCodeStore((s) => s.addProblem);

  const topics = suggestionsData.topics as Topic[];

  // Check if problem is already solved
  const isSolved = (problemId: string) =>
    solvedProblems.some((p) => p.id === problemId);

  // Filter problems by selected topic
  const filteredProblems = useMemo(() => {
    if (selectedTopic === 'all') {
      // Flatten all problems with topic info
      return topics.flatMap((t) =>
        t.problems.map((p) => ({ ...p, topicName: t.name, topicId: t.id }))
      );
    }
    const topic = topics.find((t) => t.id === selectedTopic);
    return topic
      ? topic.problems.map((p) => ({
          ...p,
          topicName: topic.name,
          topicId: topic.id,
        }))
      : [];
  }, [selectedTopic, topics]);

  // Get selected topic name for display
  const selectedTopicName =
    selectedTopic === 'all'
      ? 'All Topics'
      : topics.find((t) => t.id === selectedTopic)?.name || 'All Topics';

  // Handle add to tracker
  const handleAdd = (problem: SuggestedProblem) => {
    if (isSolved(problem.id)) return;
    addProblem({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      pattern: problem.pattern,
    });
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

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-body font-semibold">Suggested Problems</h3>
          <span className="text-caption text-[var(--color-text-secondary)]">
            {solvedCount}/{filteredProblems.length} solved
          </span>
        </div>

        {/* Topic dropdown */}
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
              <button
                onClick={() => {
                  setSelectedTopic('all');
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-body-small hover:bg-[var(--color-surface-secondary)] ${
                  selectedTopic === 'all' ? 'bg-[var(--color-surface-secondary)]' : ''
                }`}
                role="option"
                aria-selected={selectedTopic === 'all'}
              >
                All Topics
              </button>
              {topics.map((topic) => (
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
                    ({topic.problems.length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Problem list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredProblems.map((problem) => {
          const solved = isSolved(problem.id);
          return (
            <div
              key={`${problem.topicId}-${problem.id}`}
              className={`p-3 rounded-[var(--radius-md)] border transition-colors ${
                solved
                  ? 'bg-[var(--color-accent-green)]/5 border-[var(--color-accent-green)]/20'
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
                  <p className="text-caption text-[var(--color-text-tertiary)] mt-1">
                    {problem.relevance}
                  </p>
                </div>

                {/* Add button */}
                {!solved && (
                  <button
                    onClick={() => handleAdd(problem)}
                    className="flex-shrink-0 p-2 rounded-[var(--radius-md)] bg-[var(--color-accent-blue)] text-white hover:bg-[var(--color-accent-blue)]/80 transition-colors"
                    title="Add to tracker"
                    aria-label={`Add ${problem.title} to tracker`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProblems.length === 0 && (
        <p className="text-center text-caption text-[var(--color-text-secondary)] py-8">
          No suggestions for this topic yet
        </p>
      )}
    </div>
  );
}
