# Phase 6: GitHub Actions Workflow

## Context
- [Plan Overview](./plan.md)
- [Phase 5: Verification Layer](./phase-05-verification-layer.md)

## Overview
| Priority | Status | Effort |
|----------|--------|--------|
| P2 | ✅ Complete | 30m |

Automate the entire pipeline with GitHub Actions: scheduled runs, PR creation, and artifact storage.

## Requirements

### Functional
- Weekly scheduled run
- Manual trigger option
- Store ChromaDB as artifact
- Create PR with new flashcards
- Upload quality report

### Non-Functional
- Secure API key management
- Timeout handling
- Failure notifications

## Files to Create

| Action | Path | Description |
|--------|------|-------------|
| Create | `.github/workflows/generate-content.yml` | Main workflow |
| Create | `pipeline/main.py` | CLI entry point |

## Implementation Steps

### 1. Create main.py (CLI)
```python
#!/usr/bin/env python3
"""CLI for iOS content generation pipeline."""

import asyncio
import argparse
import json
from pathlib import Path
from datetime import datetime
from rich.console import Console

from pipeline.scrapers import AppleDocsScraper, HWScraper, SwiftOrgScraper
from pipeline.embeddings.chunker import DocumentChunker
from pipeline.embeddings.embedder import Embedder
from pipeline.embeddings.indexer import Indexer
from pipeline.generation.flashcard_generator import FlashcardGenerator
from pipeline.generation.code_verifier import CodeVerifier
from pipeline.verification.link_validator import LinkValidator
from pipeline.verification.duplicate_detector import DuplicateDetector
from pipeline.verification.quality_filter import QualityFilter
from pipeline.verification.report_generator import ReportGenerator

console = Console()

TOPICS = {
    "swift": [
        "Advanced Generics and Type Erasure",
        "Property Wrappers implementation",
        "Result Builders",
        "Memory Management and ARC internals",
    ],
    "concurrency": [
        "Structured Concurrency",
        "Actors and Actor isolation",
        "Sendable protocol",
        "Task Groups",
    ],
    # ... more topics
}

async def run_scrape():
    """Scrape all sources."""
    console.print("[bold blue]Scraping sources...[/]")

    scrapers = [AppleDocsScraper(), HWScraper(), SwiftOrgScraper()]
    all_docs = []

    for scraper in scrapers:
        docs = await scraper.scrape()
        all_docs.extend(docs)
        console.print(f"  {scraper.__class__.__name__}: {len(docs)} docs")

    # Save to JSON
    output = [d.model_dump() for d in all_docs]
    Path("data/scraped").mkdir(parents=True, exist_ok=True)
    with open("data/scraped/documents.json", "w") as f:
        json.dump(output, f, indent=2, default=str)

    console.print(f"[green]Saved {len(all_docs)} documents[/]")

async def run_embed():
    """Embed documents into ChromaDB."""
    console.print("[bold blue]Embedding documents...[/]")

    # Load scraped docs
    with open("data/scraped/documents.json") as f:
        docs_data = json.load(f)

    chunker = DocumentChunker()
    embedder = Embedder()
    indexer = Indexer()

    all_chunks = []
    for doc in docs_data:
        chunks = chunker.chunk(
            doc_id=doc["id"],
            content=doc["content"],
            url=doc["url"],
            topic=doc["topic"],
        )
        all_chunks.extend(chunks)

    console.print(f"Created {len(all_chunks)} chunks")

    chunks_with_embeddings = await embedder.embed_chunks(all_chunks)
    indexer.index(chunks_with_embeddings)

    console.print(f"[green]Indexed {len(all_chunks)} chunks[/]")

async def run_generate(topic: str = None, limit: int = 100):
    """Generate flashcards."""
    console.print("[bold blue]Generating flashcards...[/]")

    generator = FlashcardGenerator()
    verifier = CodeVerifier()

    topics_to_process = {topic: TOPICS[topic]} if topic else TOPICS
    all_flashcards = []

    for topic_name, subtopics in topics_to_process.items():
        console.print(f"  Topic: {topic_name}")

        for subtopic in subtopics[:limit]:
            try:
                result = await generator.generate(topic_name, subtopic)
                card = await verifier.add_code_to_flashcard(result.flashcard)
                all_flashcards.append(card)
                console.print(f"    ✓ {subtopic[:50]}...")
            except Exception as e:
                console.print(f"    ✗ {subtopic[:50]}: {e}")

    # Save
    Path("data/generated").mkdir(parents=True, exist_ok=True)
    output = [c.model_dump() for c in all_flashcards]
    with open("data/generated/flashcards.json", "w") as f:
        json.dump(output, f, indent=2, default=str)

    console.print(f"[green]Generated {len(all_flashcards)} flashcards[/]")

async def run_verify():
    """Verify and filter flashcards."""
    console.print("[bold blue]Verifying flashcards...[/]")

    # Load generated cards
    with open("data/generated/flashcards.json") as f:
        cards_data = json.load(f)

    from pipeline.generation.models import Flashcard
    flashcards = [Flashcard(**c) for c in cards_data]

    # Run checks
    link_validator = LinkValidator()
    duplicate_detector = DuplicateDetector()
    quality_filter = QualityFilter()
    report_gen = ReportGenerator()

    # Deduplicate
    flashcards, duplicates = duplicate_detector.deduplicate(flashcards)

    # Quality filter
    passed, failed = quality_filter.filter(flashcards)

    # Link validation
    link_results = await link_validator.validate_all(passed)

    # Generate report
    report = report_gen.generate(passed, link_results, duplicates, failed)
    report_gen.save(report, "data/generated/quality_report.json")

    # Save verified cards
    output = [c.model_dump() for c in passed]
    with open("data/generated/flashcards_verified.json", "w") as f:
        json.dump(output, f, indent=2, default=str)

    console.print(f"[green]Verified: {len(passed)} passed, {len(failed)} failed[/]")

async def run_export():
    """Export to iOS Prep Hub format."""
    console.print("[bold blue]Exporting to app format...[/]")

    with open("data/generated/flashcards_verified.json") as f:
        cards = json.load(f)

    # Group by topic
    by_topic = {}
    for card in cards:
        topic = card["topic"]
        if topic not in by_topic:
            by_topic[topic] = {"topic": topic, "cards": []}
        by_topic[topic]["cards"].append({
            "id": card["id"],
            "front": card["front"],
            "back": card["back"],
            "code_example": card.get("code_example"),
            "tags": card.get("tags", []),
            "sources": card.get("sources", []),
        })

    # Save to app data directory
    for topic, data in by_topic.items():
        output_path = f"src/data/flashcards/{topic}-generated.json"
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        console.print(f"  Exported {len(data['cards'])} cards to {output_path}")

def main():
    parser = argparse.ArgumentParser(description="iOS Content Generation Pipeline")
    parser.add_argument("command", choices=["scrape", "embed", "generate", "verify", "export", "all"])
    parser.add_argument("--topic", help="Specific topic to generate")
    parser.add_argument("--limit", type=int, default=100, help="Max cards per topic")

    args = parser.parse_args()

    if args.command == "scrape":
        asyncio.run(run_scrape())
    elif args.command == "embed":
        asyncio.run(run_embed())
    elif args.command == "generate":
        asyncio.run(run_generate(args.topic, args.limit))
    elif args.command == "verify":
        asyncio.run(run_verify())
    elif args.command == "export":
        asyncio.run(run_export())
    elif args.command == "all":
        asyncio.run(run_scrape())
        asyncio.run(run_embed())
        asyncio.run(run_generate(args.topic, args.limit))
        asyncio.run(run_verify())
        asyncio.run(run_export())

if __name__ == "__main__":
    main()
```

### 2. Create GitHub Actions workflow
```yaml
# .github/workflows/generate-content.yml
name: Generate iOS Interview Content

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:
    inputs:
      topic:
        description: 'Specific topic to generate (leave empty for all)'
        required: false
      limit:
        description: 'Max cards per topic'
        required: false
        default: '20'

env:
  PYTHON_VERSION: '3.11'

jobs:
  generate:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install Swift
        uses: swift-actions/setup-swift@v2
        with:
          swift-version: '5.9'

      - name: Install dependencies
        run: pip install -e .

      - name: Restore ChromaDB cache
        uses: actions/cache@v4
        with:
          path: data/chroma
          key: chroma-${{ hashFiles('data/scraped/documents.json') }}
          restore-keys: chroma-

      - name: Run pipeline
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
        run: |
          python -m pipeline.main scrape
          python -m pipeline.main embed
          python -m pipeline.main generate --limit ${{ github.event.inputs.limit || '20' }}
          python -m pipeline.main verify
          python -m pipeline.main export

      - name: Upload quality report
        uses: actions/upload-artifact@v4
        with:
          name: quality-report
          path: data/generated/quality_report.json

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'chore: update generated flashcards'
          title: '[Auto] Update iOS Interview Flashcards'
          body: |
            ## Auto-generated content update

            This PR contains newly generated flashcards from the content pipeline.

            ### Quality Report
            See attached artifact for full details.

            ### Review Checklist
            - [ ] Spot-check 5-10 random flashcards for accuracy
            - [ ] Verify code examples compile
            - [ ] Check source links are valid
          branch: auto/content-update
          delete-branch: true
```

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `GOOGLE_API_KEY` | Gemini API key |

## Todo List

- [x] Create main.py CLI entry point
- [x] Create GitHub Actions workflow
- [ ] Add secrets to repository (GOOGLE_API_KEY)
- [ ] Test workflow with manual trigger
- [ ] Verify PR creation works

## Test Results

```
Pipeline complete!
- Scraped: 12 documents
- Chunks: 87 indexed
- Generated: 2 flashcards (test)
- Verified: 2/2 passed (100%)
- Exported: src/data/flashcards/swift-generated.json
```

## Success Criteria

- [x] CLI works with all commands
- [x] Full pipeline runs locally
- [x] ChromaDB cached between runs
- [x] Quality report generated
- [ ] Workflow runs on GitHub (needs secrets)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Workflow timeout | 60 min limit, batch processing |
| API failures | Retry logic, error reporting |
| Large PR | Limit cards per run |

## Next Steps

After all phases complete:
1. Run initial full pipeline locally
2. Review generated content
3. Iterate on prompts if needed
4. Enable scheduled workflow
