"""Flashcard generation using RAG with Gemini."""

import asyncio
import hashlib
import json
import re
from datetime import datetime, timezone

from ..clients.gemini_client import GeminiClient
from ..embeddings.embedder import Embedder
from ..embeddings.indexer import Indexer
from ..utils.logging import get_logger
from .models import Flashcard, GenerationResult
from .prompts import FLASHCARD_SYSTEM_PROMPT, FLASHCARD_USER_PROMPT

logger = get_logger(__name__)


class FlashcardGenerator:
    """Generates flashcards using RAG: retrieve context then generate."""

    def __init__(self):
        self.gemini = GeminiClient()
        self.embedder = Embedder()
        self.indexer = Indexer()

    async def generate(
        self,
        topic: str,
        subtopic: str,
        n_context: int = 5,
    ) -> GenerationResult:
        """Generate a single flashcard.

        Args:
            topic: Main topic (swift, concurrency, etc.)
            subtopic: Specific subtopic for the flashcard
            n_context: Number of context chunks to retrieve

        Returns:
            GenerationResult with flashcard and metadata
        """
        start_time = datetime.now(timezone.utc)

        # 1. Get query embedding
        query = f"{topic} {subtopic} iOS interview"
        query_embedding = await self.embedder.embed_query(query)

        # 2. Retrieve relevant context from ChromaDB
        # Try with topic filter first, fallback to no filter
        results = self.indexer.query(query_embedding, topic=topic, n_results=n_context)

        docs = results.get("documents", [[]])
        metas = results.get("metadatas", [[]])

        # Handle empty results - try without topic filter
        if not docs or not docs[0]:
            results = self.indexer.query(query_embedding, topic=None, n_results=n_context)
            docs = results.get("documents", [[]])
            metas = results.get("metadatas", [[]])

        context_chunks = docs[0] if docs and docs[0] else []
        metadatas = metas[0] if metas and metas[0] else []
        source_urls = [
            m.get("source_url", "") if isinstance(m, dict) else ""
            for m in metadatas
        ]

        context_text = "\n\n---\n\n".join(context_chunks)

        # 3. Generate flashcard with Gemini
        prompt = f"{FLASHCARD_SYSTEM_PROMPT}\n\n{FLASHCARD_USER_PROMPT.format(
            topic=f'{topic}: {subtopic}',
            context=context_text[:8000]
        )}"

        response = await self.gemini.generate(prompt)

        # 4. Parse JSON response
        data = self._parse_json_response(response)

        # 5. Create flashcard
        card_id = hashlib.md5(f"{topic}_{subtopic}".encode()).hexdigest()[:12]

        flashcard = Flashcard(
            id=f"{topic}_{card_id}",
            front=data.get("front", subtopic),
            back=data.get("back", ""),
            topic=topic,
            tags=data.get("tags", [subtopic]),
            sources=list(set(url for url in source_urls if url)),
            swift_version=data.get("swift_version"),
            confidence=float(data.get("confidence", 0.8)),
        )

        elapsed_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        logger.info(f"Generated: {flashcard.front[:50]}... ({elapsed_ms}ms)")

        return GenerationResult(
            flashcard=flashcard,
            raw_context=context_chunks,
            generation_time_ms=elapsed_ms,
            verification_passed=False,
        )

    def _parse_json_response(self, response: str) -> dict:
        """Parse JSON from LLM response, handling markdown code blocks."""
        result = None

        # Try direct parse
        try:
            result = json.loads(response)
        except json.JSONDecodeError:
            pass

        # Try extracting from code block (greedy to get full content)
        if result is None and "```" in response:
            # Try json code block first
            match = re.search(r"```json\s*(\{.*\})\s*```", response, re.DOTALL)
            if not match:
                # Try generic code block
                match = re.search(r"```\s*(\{.*\})\s*```", response, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass

        # Try extracting JSON object - find matching braces (handle strings)
        if result is None:
            start = response.find("{")
            if start != -1:
                depth = 0
                end = start
                in_string = False
                escape = False
                for i, char in enumerate(response[start:], start):
                    if escape:
                        escape = False
                        continue
                    if char == "\\":
                        escape = True
                        continue
                    if char == '"':
                        in_string = not in_string
                        continue
                    if not in_string:
                        if char == "{":
                            depth += 1
                        elif char == "}":
                            depth -= 1
                            if depth == 0:
                                end = i + 1
                                break
                if end > start:
                    try:
                        result = json.loads(response[start:end])
                    except json.JSONDecodeError:
                        pass

        # Handle list response - take first item
        if isinstance(result, list) and result:
            result = result[0]

        if not isinstance(result, dict):
            logger.warning(f"Failed to parse JSON: {response[:200]}")
            return {}

        return result

    async def generate_batch(
        self,
        topic: str,
        subtopics: list[str],
        delay: float = 1.0,
    ) -> list[GenerationResult]:
        """Generate flashcards for multiple subtopics.

        Args:
            topic: Main topic
            subtopics: List of subtopics
            delay: Seconds between requests (rate limiting)

        Returns:
            List of generation results
        """
        results = []

        for i, subtopic in enumerate(subtopics):
            try:
                logger.info(f"Generating [{i+1}/{len(subtopics)}]: {topic}/{subtopic}")
                result = await self.generate(topic, subtopic)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed {topic}/{subtopic}: {e}")

            if i < len(subtopics) - 1:
                await asyncio.sleep(delay)

        logger.info(f"Generated {len(results)}/{len(subtopics)} flashcards for {topic}")
        return results

    async def generate_all_topics(
        self,
        topics: dict[str, list[str]],
        delay: float = 1.0,
    ) -> dict[str, list[GenerationResult]]:
        """Generate flashcards for all topics.

        Args:
            topics: Dict mapping topic -> list of subtopics
            delay: Seconds between requests

        Returns:
            Dict mapping topic -> list of results
        """
        all_results = {}

        for topic, subtopics in topics.items():
            logger.info(f"Starting topic: {topic} ({len(subtopics)} subtopics)")
            results = await self.generate_batch(topic, subtopics, delay)
            all_results[topic] = results

        total = sum(len(r) for r in all_results.values())
        logger.info(f"Total generated: {total} flashcards")
        return all_results
