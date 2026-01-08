#!/usr/bin/env python3
"""
Add AI-generated summaries to existing flashcards.
Uses Gemini to create concise 1-2 sentence summaries.
"""

import json
import os
import sys
import time
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

SUMMARY_PROMPT = """Given this iOS interview flashcard, create a concise summary (1-2 sentences, max 150 characters) that directly answers the question.

Question: {front}

Full Answer: {back}

Requirements:
- Summary should be a direct, standalone answer
- Focus on the key concept only
- No code in summary
- Max 150 characters

Output the summary text only, nothing else."""


def generate_summary(front: str, back: str) -> str | None:
    """Generate a concise summary for a flashcard."""
    try:
        prompt = SUMMARY_PROMPT.format(front=front, back=back[:2000])  # Limit context
        response = model.generate_content(prompt)
        summary = response.text.strip()
        # Ensure it's not too long
        if len(summary) > 200:
            summary = summary[:197] + "..."
        return summary
    except Exception as e:
        print(f"  Error generating summary: {e}")
        return None


def process_flashcards(input_path: Path, output_path: Path, limit: int | None = None):
    """Add summaries to flashcards."""
    print(f"Loading flashcards from {input_path}")

    with open(input_path, "r") as f:
        all_cards = json.load(f)

    total = len(all_cards)
    cards_to_process = all_cards[:limit] if limit else all_cards

    print(f"Processing {len(cards_to_process)} of {total} cards...")

    updated = 0
    skipped = 0

    for i, card in enumerate(cards_to_process):
        # Skip if already has summary
        if card.get("summary"):
            skipped += 1
            continue

        # Skip if back is empty
        if not card.get("back"):
            skipped += 1
            continue

        print(f"[{i+1}/{len(cards_to_process)}] {card['front'][:50]}...")

        summary = generate_summary(card["front"], card["back"])
        if summary:
            card["summary"] = summary
            updated += 1
            print(f"  → {summary}")

        # Rate limiting
        time.sleep(0.5)

    # Save ALL cards (including unprocessed ones when using limit)
    print(f"\nSaving to {output_path}")
    with open(output_path, "w") as f:
        json.dump(all_cards, f, indent=2, ensure_ascii=False, default=str)

    print(f"\nDone! Updated: {updated}, Skipped: {skipped}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Add summaries to flashcards")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/generated/flashcards.json"),
        help="Input flashcards file"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output file (default: overwrite input)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of cards to process"
    )

    args = parser.parse_args()

    output = args.output or args.input

    process_flashcards(args.input, output, args.limit)
