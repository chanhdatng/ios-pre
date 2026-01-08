"""ChromaDB client wrapper."""

import chromadb
from chromadb.config import Settings as ChromaSettings

from ..config import get_settings
from ..utils.logging import get_logger

logger = get_logger(__name__)


class ChromaClient:
    """Wrapper for ChromaDB with persistent storage."""

    def __init__(self, collection_name: str | None = None):
        settings = get_settings()
        self.client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name or settings.chroma_collection,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"ChromaDB collection: {self.collection.name}")

    def add(
        self,
        ids: list[str],
        embeddings: list[list[float]],
        documents: list[str],
        metadatas: list[dict] | None = None,
    ) -> None:
        """Add documents with embeddings to collection.

        Args:
            ids: Unique document IDs
            embeddings: Document embedding vectors
            documents: Document texts
            metadatas: Optional metadata for each document
        """
        logger.debug(f"Adding {len(ids)} documents to ChromaDB")
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas or [{} for _ in ids],
        )

    def query(
        self,
        query_embedding: list[float],
        n_results: int = 10,
        where: dict | None = None,
    ) -> dict:
        """Query similar documents.

        Args:
            query_embedding: Query embedding vector
            n_results: Number of results to return
            where: Optional metadata filter

        Returns:
            Query results with ids, documents, distances, metadatas
        """
        logger.debug(f"Querying ChromaDB for {n_results} results")
        return self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
        )

    def count(self) -> int:
        """Get document count in collection."""
        return self.collection.count()

    def delete(self, ids: list[str]) -> None:
        """Delete documents by IDs."""
        self.collection.delete(ids=ids)

    def reset(self) -> None:
        """Delete and recreate collection."""
        name = self.collection.name
        self.client.delete_collection(name)
        self.collection = self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"Reset ChromaDB collection: {name}")
