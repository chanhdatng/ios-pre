"""Duplicate detection for flashcards."""

from dataclasses import dataclass
from difflib import SequenceMatcher

from ..utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class DuplicatePair:
    """A pair of similar flashcards."""

    card1_id: str
    card2_id: str
    similarity: float
    card1_front: str
    card2_front: str


class DuplicateDetector:
    """Detects duplicate or similar flashcards."""

    def __init__(self, threshold: float = 0.8):
        """Initialize detector.

        Args:
            threshold: Similarity threshold (0-1) for duplicate detection
        """
        self.threshold = threshold

    def similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity ratio (0-1)
        """
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

    def find_duplicates(self, flashcards: list) -> list[DuplicatePair]:
        """Find all duplicate pairs in flashcards.

        Args:
            flashcards: List of flashcards

        Returns:
            List of duplicate pairs above threshold
        """
        duplicates = []
        n = len(flashcards)

        for i in range(n):
            for j in range(i + 1, n):
                sim = self.similarity(flashcards[i].front, flashcards[j].front)

                if sim >= self.threshold:
                    duplicates.append(
                        DuplicatePair(
                            card1_id=flashcards[i].id,
                            card2_id=flashcards[j].id,
                            similarity=sim,
                            card1_front=flashcards[i].front,
                            card2_front=flashcards[j].front,
                        )
                    )

        if duplicates:
            logger.info(f"Found {len(duplicates)} duplicate pairs")

        return duplicates

    def deduplicate(self, flashcards: list) -> tuple[list, list]:
        """Remove duplicate flashcards, keeping higher confidence ones.

        Args:
            flashcards: List of flashcards

        Returns:
            Tuple of (kept_flashcards, removed_flashcards)
        """
        duplicates = self.find_duplicates(flashcards)
        removed_ids = set()

        # For each duplicate pair, remove the lower confidence one
        card_by_id = {c.id: c for c in flashcards}

        for dup in duplicates:
            if dup.card1_id in removed_ids or dup.card2_id in removed_ids:
                continue

            card1 = card_by_id.get(dup.card1_id)
            card2 = card_by_id.get(dup.card2_id)

            if not card1 or not card2:
                continue

            # Keep higher confidence card
            if card1.confidence >= card2.confidence:
                removed_ids.add(dup.card2_id)
            else:
                removed_ids.add(dup.card1_id)

        kept = [c for c in flashcards if c.id not in removed_ids]
        removed = [c for c in flashcards if c.id in removed_ids]

        if removed:
            logger.info(f"Deduplicated: kept {len(kept)}, removed {len(removed)}")

        return kept, removed
