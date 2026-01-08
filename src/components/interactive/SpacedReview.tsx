import { useState, useEffect } from 'react';
import FlashcardDeck from './FlashcardDeck';
import { useFlashcardStore } from '@lib/stores/flashcard-store';
import { Brain, CheckCircle, Loader2 } from 'lucide-react';

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  topic: string;
}

interface SpacedReviewProps {
  allCards: FlashcardData[];
}

export default function SpacedReview({ allCards }: SpacedReviewProps) {
  const [dueCards, setDueCards] = useState<FlashcardData[] | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const getDueCardIds = useFlashcardStore(s => s.getDueCards);
  const cardStates = useFlashcardStore(s => s.cardStates);

  useEffect(() => {
    const dueIds = getDueCardIds();
    const existingCardIds = new Set(Object.keys(cardStates));

    // Include due cards and new cards not yet in store
    const cardsToReview = allCards.filter(card =>
      dueIds.includes(card.id) || !existingCardIds.has(card.id)
    );

    // Limit to 20 cards per session
    setDueCards(cardsToReview.slice(0, 20));
  }, [allCards, getDueCardIds, cardStates]);

  const refreshCards = () => {
    const dueIds = getDueCardIds();
    const existingCardIds = new Set(Object.keys(cardStates));
    const cardsToReview = allCards.filter(card =>
      dueIds.includes(card.id) || !existingCardIds.has(card.id)
    );
    setDueCards(cardsToReview.slice(0, 20));
    setIsComplete(false);
  };

  // Loading state while store hydrates
  if (dueCards === null) {
    return (
      <div className="card p-[var(--spacing-xl)] text-center max-w-md mx-auto animate-fade-in">
        <Loader2 className="w-12 h-12 text-[var(--color-accent-orange)] mx-auto mb-[var(--spacing-md)] animate-spin" />
        <p className="text-caption">Loading cards...</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="card p-[var(--spacing-xl)] text-center max-w-md mx-auto animate-scale-in">
        <CheckCircle className="w-16 h-16 text-[var(--color-accent-green)] mx-auto mb-[var(--spacing-md)]" />
        <h2 className="text-headline-2 mb-[var(--spacing-xs)]">Session Complete!</h2>
        <p className="text-caption mb-[var(--spacing-lg)]">
          Great job! You've reviewed all due cards.
        </p>
        <button onClick={refreshCards} className="btn-primary">
          Start New Session
        </button>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="card p-[var(--spacing-xl)] text-center max-w-md mx-auto animate-fade-in">
        <Brain className="w-16 h-16 text-[var(--color-accent-orange)] mx-auto mb-[var(--spacing-md)]" />
        <h2 className="text-headline-2 mb-[var(--spacing-xs)]">All caught up!</h2>
        <p className="text-caption">
          No cards due for review. Come back later or add new cards.
        </p>
      </div>
    );
  }

  return (
    <FlashcardDeck
      cards={dueCards}
      onComplete={() => setIsComplete(true)}
    />
  );
}
