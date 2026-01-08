import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGradeRatings, getRatingLabel, getRatingColor, type Grade } from '@lib/fsrs/scheduler';
import { reviewCard } from '@lib/fsrs/storage';
import { useProgressStore } from '@lib/stores/progress-store';

interface Flashcard {
  id: string;
  front: string;
  back: string;
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

  const updateStreak = useProgressStore(s => s.updateStreak);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleRating = (rating: Grade) => {
    if (isAnimating || !currentCard) return;

    setIsAnimating(true);
    reviewCard(currentCard.id, rating);
    updateStreak();

    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        onComplete?.();
      }
      setIsAnimating(false);
    }, 300);
  };

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

      <p className="text-caption mb-4">
        Card {currentIndex + 1} of {cards.length}
      </p>

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
                <p className="text-caption mt-8">Click to reveal answer</p>
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
              {/* Render back content as plain text for security - HTML/markdown parsing in Phase 3 */}
              <p className="text-body whitespace-pre-wrap">{currentCard.back}</p>
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
