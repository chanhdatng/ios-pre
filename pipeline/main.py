#!/usr/bin/env python3
"""CLI for iOS content generation pipeline."""

import argparse
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from rich.console import Console

from .embeddings import DocumentChunker, Embedder, Indexer
from .generation import CodeVerifier, Flashcard, FlashcardGenerator
from .generation.prompts import SENIOR_IOS_TOPICS
from .scrapers import (
    AppleDocsScraper,
    HWSScraper,
    KodecoScraper,
    ObjcIOScraper,
    SwiftLeeScraper,
    SwiftOrgScraper,
)
from .verification import (
    DuplicateDetector,
    LinkValidator,
    QualityFilter,
    ReportGenerator,
)

console = Console()


async def run_scrape() -> None:
    """Scrape all documentation sources."""
    console.print("[bold blue]Step 1: Scraping sources...[/]")

    scrapers = [
        HWSScraper(rate_limit=0.5),
        SwiftOrgScraper(rate_limit=0.5),
        AppleDocsScraper(rate_limit=0.5),
        SwiftLeeScraper(rate_limit=0.5),
        KodecoScraper(rate_limit=0.5),
        ObjcIOScraper(rate_limit=0.5),
    ]
    all_docs = []

    for scraper in scrapers:
        async with scraper:
            docs = await scraper.scrape()
            all_docs.extend(docs)
            console.print(f"  {scraper.__class__.__name__}: {len(docs)} docs")

    # Save to JSON
    Path("data/scraped").mkdir(parents=True, exist_ok=True)
    output = [d.model_dump() for d in all_docs]
    with open("data/scraped/documents.json", "w") as f:
        json.dump(output, f, indent=2, default=str)

    console.print(f"[green]✓ Saved {len(all_docs)} documents[/]")


async def run_embed() -> None:
    """Embed documents into ChromaDB."""
    console.print("[bold blue]Step 2: Embedding documents...[/]")

    # Load scraped docs
    with open("data/scraped/documents.json") as f:
        docs_data = json.load(f)

    chunker = DocumentChunker()
    embedder = Embedder()
    indexer = Indexer()

    # Reset for fresh index
    indexer.reset()

    all_chunks = []
    for doc in docs_data:
        chunks = chunker.chunk(
            doc_id=doc["id"],
            content=doc["content"],
            url=doc["url"],
            topic=doc["topic"],
            metadata={"source": doc["source"], "title": doc["title"]},
        )
        all_chunks.extend(chunks)

    console.print(f"  Created {len(all_chunks)} chunks")

    chunks_with_embeddings = await embedder.embed_chunks(all_chunks)
    indexer.index(chunks_with_embeddings)

    console.print(f"[green]✓ Indexed {len(all_chunks)} chunks[/]")


async def run_generate(topic: str | None = None, limit: int = 10) -> None:
    """Generate flashcards using RAG."""
    console.print("[bold blue]Step 3: Generating flashcards...[/]")

    generator = FlashcardGenerator()
    verifier = CodeVerifier()

    topics_to_process = (
        {topic: SENIOR_IOS_TOPICS[topic]} if topic else SENIOR_IOS_TOPICS
    )
    all_flashcards = []

    for topic_name, subtopics in topics_to_process.items():
        console.print(f"  Topic: {topic_name}")
        subtopics_to_process = subtopics[:limit]

        for subtopic in subtopics_to_process:
            try:
                result = await generator.generate(topic_name, subtopic)
                # Add code example (optional - can be slow)
                # card = await verifier.add_code_to_flashcard(result.flashcard)
                all_flashcards.append(result.flashcard)
                console.print(f"    ✓ {subtopic[:50]}...")
            except Exception as e:
                console.print(f"    ✗ {subtopic[:50]}: {e}")

            await asyncio.sleep(0.5)  # Rate limit

    # Save
    Path("data/generated").mkdir(parents=True, exist_ok=True)
    output = [c.model_dump() for c in all_flashcards]
    with open("data/generated/flashcards.json", "w") as f:
        json.dump(output, f, indent=2, default=str)

    console.print(f"[green]✓ Generated {len(all_flashcards)} flashcards[/]")


async def run_verify() -> None:
    """Verify and filter flashcards."""
    console.print("[bold blue]Step 4: Verifying flashcards...[/]")

    # Load generated cards
    with open("data/generated/flashcards.json") as f:
        cards_data = json.load(f)

    flashcards = [Flashcard(**c) for c in cards_data]

    # Run checks
    link_validator = LinkValidator()
    duplicate_detector = DuplicateDetector()
    quality_filter = QualityFilter()
    report_gen = ReportGenerator()

    # Deduplicate
    kept, removed = duplicate_detector.deduplicate(flashcards)
    console.print(f"  Deduplication: kept {len(kept)}, removed {len(removed)}")

    # Quality filter
    passed, failed = quality_filter.filter(kept)
    console.print(f"  Quality: {len(passed)} passed, {len(failed)} failed")

    # Link validation
    link_results = await link_validator.validate_all(passed)
    console.print(
        f"  Links: {link_results['valid']}/{link_results['total']} valid"
    )

    # Generate report
    duplicates = duplicate_detector.find_duplicates(flashcards)
    report = report_gen.generate(passed, link_results, duplicates, failed)
    report_gen.save(report, "data/generated/quality_report.json")
    report_gen.print_summary(report)

    # Save verified cards
    output = [c.model_dump() for c in passed]
    with open("data/generated/flashcards_verified.json", "w") as f:
        json.dump(output, f, indent=2, default=str)

    console.print(f"[green]✓ Verified: {len(passed)} flashcards[/]")


async def run_export() -> None:
    """Export to iOS Prep Hub app format."""
    console.print("[bold blue]Step 5: Exporting to app format...[/]")

    with open("data/generated/flashcards_verified.json") as f:
        cards = json.load(f)

    # Group by topic
    by_topic: dict = {}
    for card in cards:
        topic = card["topic"]
        if topic not in by_topic:
            by_topic[topic] = {
                "topic": topic,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "cards": [],
            }
        by_topic[topic]["cards"].append(
            {
                "id": card["id"],
                "front": card["front"],
                "back": card["back"],
                "code_example": card.get("code_example"),
                "tags": card.get("tags", []),
                "sources": card.get("sources", []),
            }
        )

    # Save to app data directory
    output_dir = Path("src/data/flashcards")
    output_dir.mkdir(parents=True, exist_ok=True)

    for topic, data in by_topic.items():
        output_path = output_dir / f"{topic}-generated.json"
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        console.print(f"  Exported {len(data['cards'])} cards to {output_path}")

    console.print(f"[green]✓ Exported {len(cards)} total flashcards[/]")


async def run_all(topic: str | None = None, limit: int = 10) -> None:
    """Run entire pipeline."""
    console.print("[bold magenta]Running full pipeline...[/]\n")

    await run_scrape()
    await run_embed()
    await run_generate(topic, limit)
    await run_verify()
    await run_export()

    console.print("\n[bold green]Pipeline complete![/]")


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="iOS Content Generation Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m pipeline.main scrape
  python -m pipeline.main embed
  python -m pipeline.main generate --topic swift --limit 5
  python -m pipeline.main verify
  python -m pipeline.main export
  python -m pipeline.main all --limit 3
        """,
    )
    parser.add_argument(
        "command",
        choices=["scrape", "embed", "generate", "verify", "export", "all"],
        help="Pipeline command to run",
    )
    parser.add_argument(
        "--topic",
        choices=list(SENIOR_IOS_TOPICS.keys()),
        help="Specific topic to generate",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Max cards per topic (default: 10)",
    )

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
        asyncio.run(run_all(args.topic, args.limit))


if __name__ == "__main__":
    main()
