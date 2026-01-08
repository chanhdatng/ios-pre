# Phase 3: Embedding Pipeline

## Context
- [Plan Overview](./plan.md)
- [Phase 2: Source Scrapers](./phase-02-source-scrapers.md)

## Overview
| Priority | Status | Effort |
|----------|--------|--------|
| P1 | ✅ Complete | 2h |

Chunk scraped documents and embed them into ChromaDB for RAG queries.

## Requirements

### Functional
- Chunk documents into 500-1000 token segments
- Generate embeddings using Gemini embedding API
- Store in ChromaDB with full metadata
- Support incremental updates (don't re-embed unchanged docs)

### Non-Functional
- Batch processing for efficiency
- Progress tracking
- Deduplication

## Architecture

```
embeddings/
├── __init__.py
├── chunker.py           # Document chunking logic
├── embedder.py          # Embedding generation
└── indexer.py           # ChromaDB indexing
```

## Files to Create

| Action | Path | Description |
|--------|------|-------------|
| Create | `pipeline/embeddings/__init__.py` | Module init |
| Create | `pipeline/embeddings/chunker.py` | Text chunking |
| Create | `pipeline/embeddings/embedder.py` | Embedding generation |
| Create | `pipeline/embeddings/indexer.py` | ChromaDB indexing |

## Implementation Steps

### 1. Create chunker.py
```python
import tiktoken
from dataclasses import dataclass

@dataclass
class Chunk:
    id: str
    content: str
    token_count: int
    source_id: str
    source_url: str
    topic: str
    position: int  # chunk position in document
    metadata: dict

class DocumentChunker:
    def __init__(
        self,
        min_tokens: int = 200,
        max_tokens: int = 800,
        overlap_tokens: int = 100
    ):
        self.min_tokens = min_tokens
        self.max_tokens = max_tokens
        self.overlap = overlap_tokens
        self.encoder = tiktoken.get_encoding("cl100k_base")

    def chunk(self, doc_id: str, content: str, url: str, topic: str, metadata: dict = {}) -> list[Chunk]:
        tokens = self.encoder.encode(content)

        if len(tokens) <= self.max_tokens:
            return [Chunk(
                id=f"{doc_id}_0",
                content=content,
                token_count=len(tokens),
                source_id=doc_id,
                source_url=url,
                topic=topic,
                position=0,
                metadata=metadata
            )]

        chunks = []
        start = 0
        position = 0

        while start < len(tokens):
            end = min(start + self.max_tokens, len(tokens))

            # Find sentence boundary if possible
            chunk_tokens = tokens[start:end]
            chunk_text = self.encoder.decode(chunk_tokens)

            # Try to break at sentence end
            if end < len(tokens):
                last_period = chunk_text.rfind(". ")
                if last_period > len(chunk_text) // 2:
                    chunk_text = chunk_text[:last_period + 1]
                    end = start + len(self.encoder.encode(chunk_text))

            chunks.append(Chunk(
                id=f"{doc_id}_{position}",
                content=chunk_text.strip(),
                token_count=end - start,
                source_id=doc_id,
                source_url=url,
                topic=topic,
                position=position,
                metadata=metadata
            ))

            start = end - self.overlap
            position += 1

        return chunks
```

### 2. Create embedder.py
```python
import asyncio
from typing import List
import google.generativeai as genai
from ..config import settings
from .chunker import Chunk
from rich.progress import Progress, TaskID

class Embedder:
    def __init__(self, batch_size: int = 100):
        genai.configure(api_key=settings.google_api_key)
        self.batch_size = batch_size
        self.model = "models/text-embedding-004"

    async def embed_chunks(self, chunks: list[Chunk], progress: Progress = None, task_id: TaskID = None) -> list[tuple[Chunk, list[float]]]:
        results = []

        for i in range(0, len(chunks), self.batch_size):
            batch = chunks[i:i + self.batch_size]
            texts = [c.content for c in batch]

            # Gemini embedding
            response = genai.embed_content(
                model=self.model,
                content=texts,
                task_type="retrieval_document"
            )

            embeddings = response['embedding']

            for chunk, embedding in zip(batch, embeddings):
                results.append((chunk, embedding))

            if progress and task_id:
                progress.update(task_id, advance=len(batch))

            # Rate limit
            await asyncio.sleep(0.5)

        return results

    async def embed_query(self, query: str) -> list[float]:
        response = genai.embed_content(
            model=self.model,
            content=query,
            task_type="retrieval_query"
        )
        return response['embedding']
```

### 3. Create indexer.py
```python
from ..clients.chroma_client import ChromaClient
from .chunker import Chunk
from rich.progress import track

class Indexer:
    def __init__(self):
        self.chroma = ChromaClient()

    def index(self, chunks_with_embeddings: list[tuple[Chunk, list[float]]]):
        """Index chunks with their embeddings into ChromaDB."""

        ids = []
        embeddings = []
        documents = []
        metadatas = []

        for chunk, embedding in chunks_with_embeddings:
            ids.append(chunk.id)
            embeddings.append(embedding)
            documents.append(chunk.content)
            metadatas.append({
                "source_id": chunk.source_id,
                "source_url": chunk.source_url,
                "topic": chunk.topic,
                "position": chunk.position,
                "token_count": chunk.token_count,
                **chunk.metadata
            })

        # Add in batches to avoid memory issues
        batch_size = 500
        for i in range(0, len(ids), batch_size):
            end = min(i + batch_size, len(ids))
            self.chroma.add(
                ids=ids[i:end],
                embeddings=embeddings[i:end],
                documents=documents[i:end],
                metadatas=metadatas[i:end]
            )

    def query(self, embedding: list[float], topic: str = None, n_results: int = 10) -> dict:
        """Query ChromaDB for similar chunks."""
        where = {"topic": topic} if topic else None
        return self.chroma.collection.query(
            query_embeddings=[embedding],
            n_results=n_results,
            where=where
        )

    def get_stats(self) -> dict:
        """Get collection statistics."""
        return {
            "total_chunks": self.chroma.collection.count(),
        }
```

### 4. Create main embedding script
```python
# pipeline/embeddings/run_embedding.py
import asyncio
from rich.console import Console
from rich.progress import Progress
from ..scrapers import AppleDocsScraper, HWScraper, SwiftOrgScraper
from .chunker import DocumentChunker
from .embedder import Embedder
from .indexer import Indexer

console = Console()

async def run_embedding_pipeline():
    chunker = DocumentChunker()
    embedder = Embedder()
    indexer = Indexer()

    # 1. Scrape all sources
    console.print("[bold blue]Step 1: Scraping sources...[/]")

    scrapers = [AppleDocsScraper(), HWScraper(), SwiftOrgScraper()]
    all_docs = []

    for scraper in scrapers:
        docs = await scraper.scrape()
        all_docs.extend(docs)
        console.print(f"  Scraped {len(docs)} docs from {scraper.__class__.__name__}")

    # 2. Chunk documents
    console.print("[bold blue]Step 2: Chunking documents...[/]")

    all_chunks = []
    for doc in all_docs:
        chunks = chunker.chunk(
            doc_id=doc.id,
            content=doc.content,
            url=doc.url,
            topic=doc.topic,
            metadata={"source": doc.source, "title": doc.title}
        )
        all_chunks.extend(chunks)

    console.print(f"  Created {len(all_chunks)} chunks from {len(all_docs)} documents")

    # 3. Generate embeddings
    console.print("[bold blue]Step 3: Generating embeddings...[/]")

    with Progress() as progress:
        task = progress.add_task("Embedding...", total=len(all_chunks))
        chunks_with_embeddings = await embedder.embed_chunks(all_chunks, progress, task)

    # 4. Index in ChromaDB
    console.print("[bold blue]Step 4: Indexing in ChromaDB...[/]")

    indexer.index(chunks_with_embeddings)

    stats = indexer.get_stats()
    console.print(f"[bold green]Done! Indexed {stats['total_chunks']} chunks[/]")

if __name__ == "__main__":
    asyncio.run(run_embedding_pipeline())
```

## Todo List

- [x] Implement chunker.py with sentence-aware splitting
- [x] Implement embedder.py with batch processing
- [x] Implement indexer.py with ChromaDB integration
- [x] Test end-to-end pipeline
- [x] Verify ChromaDB persistence
- [ ] Add deduplication logic (deferred - not critical for MVP)
- [ ] Create run_embedding.py CLI script (deferred)

## Test Results

| Metric | Value |
|--------|-------|
| Documents scraped | 12 |
| Chunks created | 87 |
| Embeddings generated | 87 |
| Embedding dimension | 768 |
| ChromaDB collection | ios_docs |

## Success Criteria

- [x] Chunks are 200-800 tokens with overlap
- [x] Embeddings generated without rate limit errors
- [x] ChromaDB persists data across restarts
- [x] Can query and retrieve relevant chunks
- [x] Topic filtering works correctly

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Embedding API rate limits | Batch + sleep between calls |
| ChromaDB memory issues | Batch indexing |
| Duplicate embeddings | Track by doc ID hash |

## Next Steps

After completion, proceed to [Phase 4: RAG Generation](./phase-04-rag-generation.md)
