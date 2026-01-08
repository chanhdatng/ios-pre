import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type RecordLogItem,
  type ReviewLog,
  type FSRSParameters,
  type Grade,
} from 'ts-fsrs';

// Custom parameters optimized for iOS interview prep
const params: FSRSParameters = generatorParameters({
  request_retention: 0.9,  // Target 90% retention
  maximum_interval: 365,   // Max 1 year between reviews
});

const scheduler = fsrs(params);

// Export Grade type (excludes Rating.Manual) for user interactions
export { Rating };
export type { Card, ReviewLog, Grade };

export function createNewCard(): Card {
  return createEmptyCard();
}

export function scheduleReview(card: Card, rating: Grade): RecordLogItem {
  const now = new Date();
  const scheduling = scheduler.repeat(card, now);
  return scheduling[rating];
}

export function getNextReviewDate(card: Card): Date {
  return new Date(card.due);
}

// Only include user-selectable ratings (excludes Manual)
const GRADE_RATINGS: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

export function getGradeRatings(): Grade[] {
  return GRADE_RATINGS;
}

export function getRatingLabel(rating: Grade): string {
  const labels: Record<Grade, string> = {
    [Rating.Again]: 'Again',
    [Rating.Hard]: 'Hard',
    [Rating.Good]: 'Good',
    [Rating.Easy]: 'Easy',
  };
  return labels[rating];
}

export function getRatingColor(rating: Grade): string {
  const colors: Record<Grade, string> = {
    [Rating.Again]: 'bg-[var(--color-accent-red)]',
    [Rating.Hard]: 'bg-[var(--color-warning)]',
    [Rating.Good]: 'bg-[var(--color-accent-green)]',
    [Rating.Easy]: 'bg-[var(--color-accent-blue)]',
  };
  return colors[rating];
}
