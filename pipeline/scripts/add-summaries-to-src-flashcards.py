#!/usr/bin/env python3
"""
Add AI-generated summaries to src/data/flashcards/*.json files.
These files have a nested structure: { topic, title, cards: [...] }
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
        prompt = SUMMARY_PROMPT.format(front=front, back=back[:2000])
        response = model.generate_content(prompt)
        summary = response.text.strip()
        if len(summary) > 200:
            summary = summary[:197] + "..."
        return summary
    except Exception as e:
        print(f"  Error: {e}")
        return None


def process_file(file_path: Path):
    """Add summaries to a single flashcard file."""
    print(f"\nProcessing {file_path.name}")

    with open(file_path, "r") as f:
        data = json.load(f)

    # Handle both formats: array or object with cards
    if isinstance(data, list):
        cards = data
        is_nested = False
    elif isinstance(data, dict) and "cards" in data:
        cards = data["cards"]
        is_nested = True
    else:
        print(f"  Unknown format, skipping")
        return 0

    updated = 0
    for i, card in enumerate(cards):
        # Skip if already has summary or no back
        if card.get("summary") or not card.get("back"):
            continue

        print(f"  [{i+1}/{len(cards)}] {card.get('front', '')[:50]}...")

        summary = generate_summary(card["front"], card["back"])
        if summary:
            card["summary"] = summary
            updated += 1
            print(f"    → {summary}")

        time.sleep(0.3)

    # Save
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

    print(f"  Updated {updated} cards")
    return updated


def main():
    flashcards_dir = Path("src/data/flashcards")
    if not flashcards_dir.exists():
        print(f"Directory not found: {flashcards_dir}")
        return

    json_files = list(flashcards_dir.glob("*.json"))
    print(f"Found {len(json_files)} files")

    total_updated = 0
    for file_path in sorted(json_files):
        total_updated += process_file(file_path)

    print(f"\n✓ Total updated: {total_updated} cards")


if __name__ == "__main__":
    main()
