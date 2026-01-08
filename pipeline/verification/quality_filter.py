"""Quality filtering for flashcards."""

from dataclasses import dataclass

from ..utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class QualityIssue:
    """A quality issue with a flashcard."""

    card_id: str
    issue_type: str
    message: str


class QualityFilter:
    """Filters flashcards based on quality criteria."""

    def __init__(
        self,
        min_confidence: float = 0.7,
        max_front_length: int = 500,
        max_back_length: int = 2000,
        min_back_length: int = 30,
    ):
        """Initialize filter.

        Args:
            min_confidence: Minimum confidence score
            max_front_length: Maximum question length
            max_back_length: Maximum answer length
            min_back_length: Minimum answer length
        """
        self.min_confidence = min_confidence
        self.max_front_length = max_front_length
        self.max_back_length = max_back_length
        self.min_back_length = min_back_length

    def check(self, flashcard) -> list[QualityIssue]:
        """Check a flashcard for quality issues.

        Args:
            flashcard: Flashcard to check

        Returns:
            List of quality issues found
        """
        issues = []

        # Confidence check
        if flashcard.confidence < self.min_confidence:
            issues.append(
                QualityIssue(
                    card_id=flashcard.id,
                    issue_type="low_confidence",
                    message=f"Confidence {flashcard.confidence:.2f} < {self.min_confidence}",
                )
            )

        # Front length check
        if len(flashcard.front) > self.max_front_length:
            issues.append(
                QualityIssue(
                    card_id=flashcard.id,
                    issue_type="front_too_long",
                    message=f"Front {len(flashcard.front)} > {self.max_front_length}",
                )
            )

        # Back length checks
        if len(flashcard.back) > self.max_back_length:
            issues.append(
                QualityIssue(
                    card_id=flashcard.id,
                    issue_type="back_too_long",
                    message=f"Back {len(flashcard.back)} > {self.max_back_length}",
                )
            )

        if len(flashcard.back) < self.min_back_length:
            issues.append(
                QualityIssue(
                    card_id=flashcard.id,
                    issue_type="back_too_short",
                    message=f"Back {len(flashcard.back)} < {self.min_back_length}",
                )
            )

        # Sources check
        if not flashcard.sources:
            issues.append(
                QualityIssue(
                    card_id=flashcard.id,
                    issue_type="no_sources",
                    message="No source URLs",
                )
            )

        # Code verification check
        if flashcard.code_example and not flashcard.verified:
            issues.append(
                QualityIssue(
                    card_id=flashcard.id,
                    issue_type="unverified_code",
                    message="Code example not verified",
                )
            )

        return issues

    def filter(
        self, flashcards: list, strict: bool = False
    ) -> tuple[list, list[tuple]]:
        """Filter flashcards by quality.

        Args:
            flashcards: List of flashcards
            strict: If True, reject any card with issues

        Returns:
            Tuple of (passed_flashcards, failed_with_issues)
        """
        passed = []
        failed = []

        for card in flashcards:
            issues = self.check(card)

            if not issues:
                passed.append(card)
            elif strict:
                failed.append((card, issues))
            elif any(i.issue_type == "low_confidence" for i in issues):
                # Only reject low confidence in non-strict mode
                failed.append((card, issues))
            else:
                passed.append(card)

        logger.info(f"Quality filter: {len(passed)} passed, {len(failed)} failed")
        return passed, failed
