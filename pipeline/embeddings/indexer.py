"""ChromaDB indexing for embedded chunks."""

from ..clients.chroma_client import ChromaClient
from ..utils.logging import get_logger
from .chunker import Chunk

logger = get_logger(__name__)


class Indexer:
    """Indexes embedded chunks into ChromaDB."""

    def __init__(self, collection_name: str | None = None):
        """Initialize indexer.

        Args:
            collection_name: Optional custom collection name
        """
        self.chroma = ChromaClient(collection_name)

    def index(self, chunks_with_embeddings: list[tuple[Chunk, list[float]]]) -> int:
        """Index chunks with embeddings into ChromaDB.

        Args:
            chunks_with_embeddings: List of (chunk, embedding) tuples

        Returns:
            Number of chunks indexed
        """
        if not chunks_with_embeddings:
            return 0

        ids = []
        embeddings = []
        documents = []
        metadatas = []

        for chunk, embedding in chunks_with_embeddings:
            ids.append(chunk.id)
            embeddings.append(embedding)
            documents.append(chunk.content)
            metadatas.append(
                {
                    "source_id": chunk.source_id,
                    "source_url": chunk.source_url,
                    "topic": chunk.topic,
                    "position": chunk.position,
                    "token_count": chunk.token_count,
                    **chunk.metadata,
                }
            )

        # Batch add to avoid memory issues
        batch_size = 500
        indexed = 0

        for i in range(0, len(ids), batch_size):
            end = min(i + batch_size, len(ids))
            self.chroma.add(
                ids=ids[i:end],
                embeddings=embeddings[i:end],
                documents=documents[i:end],
                metadatas=metadatas[i:end],
            )
            indexed += end - i
            logger.debug(f"Indexed batch: {indexed}/{len(ids)}")

        logger.info(f"Indexed {indexed} chunks into ChromaDB")
        return indexed

    def query(
        self,
        embedding: list[float],
        topic: str | None = None,
        n_results: int = 10,
    ) -> dict:
        """Query ChromaDB for similar chunks.

        Args:
            embedding: Query embedding vector
            topic: Optional topic filter
            n_results: Number of results

        Returns:
            Query results with ids, documents, distances, metadatas
        """
        where = {"topic": topic} if topic else None
        return self.chroma.query(
            query_embedding=embedding,
            n_results=n_results,
            where=where,
        )

    def get_stats(self) -> dict:
        """Get collection statistics."""
        return {
            "total_chunks": self.chroma.count(),
            "collection": self.chroma.collection.name,
        }

    def reset(self) -> None:
        """Reset collection (delete all data)."""
        self.chroma.reset()
        logger.info("Reset ChromaDB collection")

    def has_document(self, doc_id: str) -> bool:
        """Check if document chunks exist in index.

        Args:
            doc_id: Document ID to check

        Returns:
            True if document has indexed chunks
        """
        results = self.chroma.collection.get(
            where={"source_id": doc_id},
            limit=1,
        )
        return len(results["ids"]) > 0
