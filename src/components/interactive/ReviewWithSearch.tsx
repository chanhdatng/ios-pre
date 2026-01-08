import { useState, useMemo } from 'react';
import { Search, X, Filter, Heart } from 'lucide-react';
import FlashcardDeck from './FlashcardDeck';
import { useFlashcardStore } from '@lib/stores/flashcard-store';
import { Brain, CheckCircle } from 'lucide-react';

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  topic: string;
}

interface ReviewWithSearchProps {
  allCards: FlashcardData[];
  topics: string[];
}

export default function ReviewWithSearch({ allCards, topics }: ReviewWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionCards, setSessionCards] = useState<FlashcardData[] | null>(null);

  const getDueCardIds = useFlashcardStore(s => s.getDueCards);
  const cardStates = useFlashcardStore(s => s.cardStates);
  const bookmarks = useFlashcardStore(s => s.bookmarks);

  // Filter cards based on search, topic, and bookmarks
  const filteredCards = useMemo(() => {
    let filtered = allCards;

    // Filter by bookmarks
    if (showBookmarksOnly) {
      const bookmarkSet = new Set(bookmarks);
      filtered = filtered.filter(card => bookmarkSet.has(card.id));
    }

    // Filter by selected topics
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(card => selectedTopics.includes(card.topic));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        card =>
          card.front.toLowerCase().includes(query) ||
          card.back.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allCards, selectedTopics, searchQuery, showBookmarksOnly, bookmarks]);

  // Get due cards from filtered set
  const dueCards = useMemo(() => {
    const dueIds = new Set(getDueCardIds());
    const existingCardIds = new Set(Object.keys(cardStates));

    const cardsToReview = filteredCards.filter(
      card => dueIds.has(card.id) || !existingCardIds.has(card.id)
    );

    return cardsToReview.slice(0, 20);
  }, [filteredCards, getDueCardIds, cardStates]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
    setIsComplete(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTopics([]);
    setShowBookmarksOnly(false);
    setIsComplete(false);
  };

  const startSession = () => {
    setSessionCards(dueCards);
    setIsComplete(false);
  };

  const startBookmarksSession = () => {
    const bookmarkSet = new Set(bookmarks);
    const bookmarkedCards = allCards.filter(card => bookmarkSet.has(card.id));
    setSessionCards(bookmarkedCards.slice(0, 20));
    setIsComplete(false);
  };

  const hasFilters = searchQuery.trim() || selectedTopics.length > 0 || showBookmarksOnly;

  // Show deck if session is active
  if (sessionCards && !isComplete) {
    return (
      <div>
        <button
          onClick={() => setSessionCards(null)}
          className="mb-4 text-body-small text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          ← Back to filters
        </button>
        <FlashcardDeck
          cards={sessionCards}
          onComplete={() => setIsComplete(true)}
        />
      </div>
    );
  }

  // Show completion state
  if (isComplete) {
    return (
      <div className="card p-[var(--spacing-xl)] text-center max-w-md mx-auto animate-scale-in">
        <CheckCircle className="w-16 h-16 text-[var(--color-accent-green)] mx-auto mb-[var(--spacing-md)]" />
        <h2 className="text-headline-2 mb-[var(--spacing-xs)]">Session Complete!</h2>
        <p className="text-caption mb-[var(--spacing-lg)]">
          Great job! You've reviewed all due cards.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSessionCards(null); setIsComplete(false); }} className="btn-secondary">
            Back to Filters
          </button>
          <button onClick={startSession} className="btn-primary">
            New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface)] border border-[var(--color-surface-secondary)] rounded-[var(--radius-lg)] text-body focus:outline-none focus:border-[var(--color-accent-orange)]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter toggle and pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-body-small font-medium transition-colors ${
            showFilters || selectedTopics.length > 0
              ? 'bg-[var(--color-accent-orange)] text-white'
              : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
          }`}
        >
          <Filter className="w-4 h-4" />
          Topics {selectedTopics.length > 0 && `(${selectedTopics.length})`}
        </button>

        <button
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-body-small font-medium transition-colors ${
            showBookmarksOnly
              ? 'bg-[var(--color-accent-red)] text-white'
              : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'
          }`}
        >
          <Heart className={`w-4 h-4 ${showBookmarksOnly ? 'fill-current' : ''}`} />
          Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-body-small text-[var(--color-accent-blue)] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Topic filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] animate-fade-in">
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-body-small font-medium transition-colors ${
                selectedTopics.includes(topic)
                  ? 'bg-[var(--color-accent-orange)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/80'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {/* Stats and start button */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-headline-3">{dueCards.length} cards due</p>
            <p className="text-caption">
              {hasFilters
                ? `Filtered from ${filteredCards.length} cards`
                : `From ${allCards.length} total cards`}
            </p>
          </div>
          {dueCards.length > 0 ? (
            <button onClick={startSession} className="btn-primary">
              Start Review
            </button>
          ) : (
            <div className="flex items-center gap-2 text-[var(--color-accent-green)]">
              <Brain className="w-5 h-5" />
              <span className="text-body-small font-medium">All caught up!</span>
            </div>
          )}
        </div>

        {/* Quick topic stats */}
        {!hasFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-[var(--color-surface-secondary)]">
            {topics.map(topic => {
              const count = allCards.filter(c => c.topic === topic).length;
              return (
                <button
                  key={topic}
                  onClick={() => {
                    setSelectedTopics([topic]);
                    setShowFilters(true);
                  }}
                  className="p-2 text-left rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  <p className="text-body-small font-medium truncate">{topic}</p>
                  <p className="text-caption">{count} cards</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
