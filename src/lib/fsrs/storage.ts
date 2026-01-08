import { useFlashcardStore } from '@lib/stores/flashcard-store';
import { createNewCard, scheduleReview, type Card, type Grade } from './scheduler';

export function initializeCard(cardId: string): Card {
  const store = useFlashcardStore.getState();
  const existing = store.getCardState(cardId);

  if (existing) return existing;

  return createNewCard();
}

export function reviewCard(cardId: string, rating: Grade): void {
  const store = useFlashcardStore.getState();
  const currentCard = initializeCard(cardId);
  const result = scheduleReview(currentCard, rating);
  store.updateCardState(cardId, result.card, result.log);
}

export function getReviewStats() {
  const store = useFlashcardStore.getState();
  const states = Object.values(store.cardStates);
  const now = new Date();

  return {
    total: states.length,
    due: states.filter(c => new Date(c.due) <= now).length,
    new: states.filter(c => c.reps === 0).length,
    learning: states.filter(c => c.state === 1).length,
    review: states.filter(c => c.state === 2).length,
  };
}
