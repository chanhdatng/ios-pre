"""Document chunking with sentence-aware splitting."""

from dataclasses import dataclass, field

import tiktoken

from ..utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class Chunk:
    """A chunk of text with metadata."""

    id: str
    content: str
    token_count: int
    source_id: str
    source_url: str
    topic: str
    position: int
    metadata: dict = field(default_factory=dict)


class DocumentChunker:
    """Chunks documents into embedable segments with overlap."""

    def __init__(
        self,
        min_tokens: int = 200,
        max_tokens: int = 800,
        overlap_tokens: int = 100,
    ):
        """Initialize chunker.

        Args:
            min_tokens: Minimum tokens per chunk
            max_tokens: Maximum tokens per chunk
            overlap_tokens: Token overlap between chunks
        """
        self.min_tokens = min_tokens
        self.max_tokens = max_tokens
        self.overlap = overlap_tokens
        self.encoder = tiktoken.get_encoding("cl100k_base")

    def chunk(
        self,
        doc_id: str,
        content: str,
        url: str,
        topic: str,
        metadata: dict | None = None,
    ) -> list[Chunk]:
        """Chunk a document into segments.

        Args:
            doc_id: Source document ID
            content: Document text content
            url: Source URL
            topic: Document topic
            metadata: Additional metadata

        Returns:
            List of chunks
        """
        metadata = metadata or {}
        tokens = self.encoder.encode(content)

        # Small document - return as single chunk
        if len(tokens) <= self.max_tokens:
            return [
                Chunk(
                    id=f"{doc_id}_0",
                    content=content,
                    token_count=len(tokens),
                    source_id=doc_id,
                    source_url=url,
                    topic=topic,
                    position=0,
                    metadata=metadata,
                )
            ]

        chunks = []
        start = 0
        position = 0

        while start < len(tokens):
            end = min(start + self.max_tokens, len(tokens))

            # Decode chunk
            chunk_tokens = tokens[start:end]
            chunk_text = self.encoder.decode(chunk_tokens)

            # Try to break at sentence boundary
            if end < len(tokens):
                # Find last sentence end
                for sep in [". ", ".\n", "! ", "? "]:
                    last_sep = chunk_text.rfind(sep)
                    if last_sep > len(chunk_text) // 2:
                        chunk_text = chunk_text[: last_sep + 1]
                        end = start + len(self.encoder.encode(chunk_text))
                        break

            chunk_text = chunk_text.strip()
            if not chunk_text:
                start = end
                continue

            actual_tokens = len(self.encoder.encode(chunk_text))

            chunks.append(
                Chunk(
                    id=f"{doc_id}_{position}",
                    content=chunk_text,
                    token_count=actual_tokens,
                    source_id=doc_id,
                    source_url=url,
                    topic=topic,
                    position=position,
                    metadata=metadata,
                )
            )

            # Move forward with overlap
            start = end - self.overlap if end < len(tokens) else end
            position += 1

        logger.debug(f"Chunked {doc_id}: {len(tokens)} tokens -> {len(chunks)} chunks")
        return chunks
