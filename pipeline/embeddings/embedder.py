"""Embedding generation using Gemini API."""

import asyncio
from collections.abc import Callable

from ..clients.gemini_client import GeminiClient
from ..utils.logging import get_logger
from .chunker import Chunk

logger = get_logger(__name__)


class Embedder:
    """Generates embeddings for text chunks using Gemini."""

    def __init__(self, batch_size: int = 100):
        """Initialize embedder.

        Args:
            batch_size: Number of texts per API call
        """
        self.client = GeminiClient()
        self.batch_size = batch_size

    async def embed_chunks(
        self,
        chunks: list[Chunk],
        on_progress: Callable[[int, int], None] | None = None,
    ) -> list[tuple[Chunk, list[float]]]:
        """Embed multiple chunks in batches.

        Args:
            chunks: List of chunks to embed
            on_progress: Optional callback(processed_count, total_count)

        Returns:
            List of (chunk, embedding) tuples
        """
        results = []
        total = len(chunks)

        for i in range(0, total, self.batch_size):
            batch = chunks[i : i + self.batch_size]
            texts = [c.content for c in batch]

            try:
                embeddings = await self.client.embed_async(texts)

                for chunk, embedding in zip(batch, embeddings):
                    results.append((chunk, embedding))

                if on_progress:
                    on_progress(len(results), total)

            except Exception as e:
                logger.error(f"Embedding batch failed: {e}")
                raise

            # Rate limit between batches
            await asyncio.sleep(0.3)

        logger.info(f"Embedded {len(results)} chunks")
        return results

    async def embed_query(self, query: str) -> list[float]:
        """Embed a single query for retrieval.

        Args:
            query: Query text

        Returns:
            Query embedding vector
        """
        embeddings = await self.client.embed_async([query])
        return embeddings[0]

    def embed_query_sync(self, query: str) -> list[float]:
        """Synchronous query embedding.

        Args:
            query: Query text

        Returns:
            Query embedding vector
        """
        embeddings = self.client.embed([query])
        return embeddings[0]
