import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { getGradeRatings, getRatingLabel, getRatingColor, type Grade } from '@lib/fsrs/scheduler';
import { reviewCard } from '@lib/fsrs/storage';
import { useProgressStore } from '@lib/stores/progress-store';
import { useFlashcardStore } from '@lib/stores/flashcard-store';
import MarkdownRenderer from '@components/content/MarkdownRenderer';

// Extract summary from content (first paragraph or first ~250 chars)
function extractSummary(content: string): { summary: string; hasMore: boolean } {
  if (!content) return { summary: '', hasMore: false };

  // Find first paragraph break or code block
  const firstBreak = content.search(/\n\n|```/);

  if (firstBreak > 0 && firstBreak < 300) {
    return { summary: content.slice(0, firstBreak), hasMore: content.length > firstBreak + 2 };
  }

  // If no good break point, truncate at ~250 chars at word boundary
  if (content.length > 300) {
    const truncated = content.slice(0, 250);
    const lastSpace = truncated.lastIndexOf(' ');
    return {
      summary: truncated.slice(0, lastSpace > 150 ? lastSpace : 250) + '...',
      hasMore: true
    };
  }

  return { summary: content, hasMore: false };
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  summary?: string; // AI-generated concise summary
  topic: string;
}

interface FlashcardDeckProps {
  cards: Flashcard[];
  onComplete?: () => void;
}

export default function FlashcardDeck({ cards, onComplete }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateStreak = useProgressStore(s => s.updateStreak);
  const toggleBookmark = useFlashcardStore(s => s.toggleBookmark);
  const isBookmarked = useFlashcardStore(s => s.isBookmarked);

  const currentCard = cards[currentIndex];
  const bookmarked = currentCard ? isBookmarked(currentCard.id) : false;
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const ratings = getGradeRatings();

  // Use AI-generated summary if available, otherwise extract from content
  const { summary, hasMore } = useMemo(() => {
    if (!currentCard) return { summary: '', hasMore: false };
    // Prefer AI-generated summary
    if (currentCard.summary) {
      return { summary: currentCard.summary, hasMore: currentCard.back.length > 300 };
    }
    // Fallback: extract from content for old data
    return extractSummary(currentCard.back);
  }, [currentCard]);

  const handleRating = useCallback((rating: Grade) => {
    if (isAnimating || !currentCard) return;

    setIsAnimating(true);
    reviewCard(currentCard.id, rating);
    updateStreak();

    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setIsExpanded(false); // Reset expanded state for new card
      } else {
        onComplete?.();
      }
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentCard, currentIndex, cards.length, updateStreak, onComplete]);

  // Keyboard navigation: Space/Enter to flip, 1-4 for rating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating || !currentCard) return;

      // Space or Enter to flip card
      if ((e.key === ' ' || e.key === 'Enter') && !isFlipped) {
        e.preventDefault();
        setIsFlipped(true);
        return;
      }

      // Number keys 1-4 for rating when card is flipped
      if (isFlipped && e.key >= '1' && e.key <= '4') {
        const ratingIndex = parseInt(e.key) - 1;
        if (ratingIndex < ratings.length) {
          handleRating(ratings[ratingIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAnimating, currentCard, isFlipped, ratings, handleRating]);

  if (!currentCard) {
    return (
      <div className="text-center p-8">
        <p className="text-headline-3 text-[var(--color-text-secondary)]">No cards to review!</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress bar */}
      <div className="progress-bar mb-6">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-caption">
          Card {currentIndex + 1} of {cards.length}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(currentCard.id);
          }}
          className={`p-2 rounded-full transition-colors ${
            bookmarked
              ? 'text-[var(--color-accent-red)] bg-[var(--color-accent-red)]/10'
              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-red)] hover:bg-[var(--color-surface-secondary)]'
          }`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Heart className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card */}
      <div
        className="card p-[var(--spacing-lg)] min-h-[300px] cursor-pointer"
        onClick={() => !isFlipped && setIsFlipped(true)}
        style={{ perspective: '1000px' }}
      >
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -180, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center min-h-[250px]"
            >
              <div className="text-center">
                <p className="text-micro text-[var(--color-text-tertiary)] mb-4 uppercase tracking-wide">
                  {currentCard.topic}
                </p>
                <p className="text-headline-2">{currentCard.front}</p>
                <p className="text-caption mt-8">Click or press Space to reveal answer</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: -180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 180, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="min-h-[250px]"
            >
              <p className="text-micro text-[var(--color-text-tertiary)] mb-4 uppercase tracking-wide">
                Answer
              </p>
              <div className="text-body max-h-[400px] overflow-y-auto">
                <MarkdownRenderer content={isExpanded ? currentCard.back : summary} />

                {/* Expand/Collapse button */}
                {hasMore && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1 mt-4 text-[var(--color-accent-blue)] hover:text-[var(--color-accent-blue)]/80 text-body-small font-medium transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Xem thêm chi tiết
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating buttons */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex justify-center gap-3 mt-6"
        >
          {getGradeRatings().map((rating) => (
            <button
              key={rating}
              onClick={() => handleRating(rating)}
              disabled={isAnimating}
              className={`px-6 py-3 rounded-[var(--radius-lg)] text-white font-semibold transition-transform hover:scale-105 disabled:opacity-50 ${getRatingColor(rating)}`}
            >
              {getRatingLabel(rating)}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
