"""Quality report generation."""

import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from ..utils.logging import get_logger

logger = get_logger(__name__)


class ReportGenerator:
    """Generates quality reports for flashcard generation."""

    def generate(
        self,
        flashcards: list,
        link_results: dict,
        duplicates: list,
        quality_failed: list,
    ) -> dict:
        """Generate a comprehensive quality report.

        Args:
            flashcards: Passed flashcards
            link_results: URL validation results
            duplicates: Duplicate pairs found
            quality_failed: Failed flashcards with issues

        Returns:
            Report dictionary
        """
        total_generated = len(flashcards) + len(quality_failed)

        report = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "total_generated": total_generated,
                "passed": len(flashcards),
                "failed": len(quality_failed),
                "duplicates_removed": len(duplicates),
                "pass_rate": len(flashcards) / total_generated if total_generated else 0,
            },
            "by_topic": self._group_by_topic(flashcards),
            "link_validation": {
                "total_urls": link_results.get("total", 0),
                "valid_urls": link_results.get("valid", 0),
                "invalid_urls": [
                    asdict(r) for r in link_results.get("invalid", [])
                ],
            },
            "duplicates": [asdict(d) for d in duplicates],
            "quality_failures": [
                {
                    "id": card.id,
                    "front": card.front[:100],
                    "issues": [asdict(i) for i in issues],
                }
                for card, issues in quality_failed
            ],
            "confidence_stats": self._confidence_stats(flashcards),
            "code_stats": self._code_stats(flashcards),
        }

        logger.info(
            f"Report: {report['summary']['passed']}/{report['summary']['total_generated']} passed"
        )

        return report

    def _group_by_topic(self, flashcards: list) -> dict:
        """Group flashcards by topic."""
        topics = {}
        for card in flashcards:
            topic = card.topic
            if topic not in topics:
                topics[topic] = {"count": 0, "verified_code": 0, "with_code": 0}
            topics[topic]["count"] += 1
            if card.code_example:
                topics[topic]["with_code"] += 1
            if card.verified:
                topics[topic]["verified_code"] += 1
        return topics

    def _confidence_stats(self, flashcards: list) -> dict:
        """Calculate confidence statistics."""
        if not flashcards:
            return {"min": 0, "max": 0, "avg": 0}

        confidences = [c.confidence for c in flashcards]
        return {
            "min": round(min(confidences), 2),
            "max": round(max(confidences), 2),
            "avg": round(sum(confidences) / len(confidences), 2),
        }

    def _code_stats(self, flashcards: list) -> dict:
        """Calculate code example statistics."""
        with_code = sum(1 for c in flashcards if c.code_example)
        verified = sum(1 for c in flashcards if c.verified)
        return {
            "total_with_code": with_code,
            "verified": verified,
            "verification_rate": verified / with_code if with_code else 0,
        }

    def save(self, report: dict, path: str | Path) -> None:
        """Save report to JSON file.

        Args:
            report: Report dictionary
            path: Output file path
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        with open(path, "w") as f:
            json.dump(report, f, indent=2)

        logger.info(f"Report saved to {path}")

    def print_summary(self, report: dict) -> None:
        """Print report summary to console."""
        summary = report["summary"]

        print("\n" + "=" * 50)
        print("QUALITY REPORT SUMMARY")
        print("=" * 50)
        print(f"Total Generated: {summary['total_generated']}")
        print(f"Passed:          {summary['passed']}")
        print(f"Failed:          {summary['failed']}")
        print(f"Duplicates:      {summary['duplicates_removed']}")
        print(f"Pass Rate:       {summary['pass_rate']:.1%}")
        print()
        print("By Topic:")
        for topic, stats in report["by_topic"].items():
            print(f"  {topic}: {stats['count']} cards, {stats['verified_code']} verified")
        print()
        print("Confidence:", report["confidence_stats"])
        print("Code Stats:", report["code_stats"])
        print("=" * 50 + "\n")
