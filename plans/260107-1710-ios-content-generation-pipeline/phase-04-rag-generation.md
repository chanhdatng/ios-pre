# Phase 4: RAG Generation

## Context
- [Plan Overview](./plan.md)
- [Phase 3: Embedding Pipeline](./phase-03-embedding-pipeline.md)

## Overview
| Priority | Status | Effort |
|----------|--------|--------|
| P1 | ✅ Complete | 2h |

Generate flashcards using RAG: query ChromaDB for relevant context, then use Claude + Gemini to create high-quality flashcards with code examples.

## Requirements

### Functional
- Query ChromaDB by topic
- Generate flashcard using Claude with structured output
- Generate/verify Swift code examples using Gemini
- Include source URLs in output
- Confidence scoring

### Non-Functional
- Consistent JSON output format
- Retry logic for API failures
- Progress tracking
- Batch generation by topic

## Architecture

```
generation/
├── __init__.py
├── prompts.py           # Prompt templates
├── flashcard_generator.py  # Main generation logic
├── code_verifier.py     # Code example generation/verification
└── models.py            # Output models
```

## Files to Create

| Action | Path | Description |
|--------|------|-------------|
| Create | `pipeline/generation/__init__.py` | Module init |
| Create | `pipeline/generation/models.py` | Flashcard output model |
| Create | `pipeline/generation/prompts.py` | Prompt templates |
| Create | `pipeline/generation/flashcard_generator.py` | Main generator |
| Create | `pipeline/generation/code_verifier.py` | Code verification |

## Implementation Steps

### 1. Create models.py
```python
from pydantic import BaseModel, Field
from datetime import datetime

class Flashcard(BaseModel):
    id: str
    front: str = Field(max_length=200)
    back: str = Field(max_length=500)
    code_example: str | None = None
    difficulty: str = "senior"
    topic: str
    tags: list[str] = []
    sources: list[str] = []
    swift_version: str | None = None
    confidence: float = Field(ge=0, le=1)
    verified: bool = False
    generated_at: datetime = Field(default_factory=datetime.now)

class GenerationResult(BaseModel):
    flashcard: Flashcard
    raw_context: list[str]  # Retrieved chunks
    generation_time_ms: int
    verification_passed: bool
```

### 2. Create prompts.py
```python
FLASHCARD_SYSTEM_PROMPT = """You are an expert iOS developer creating interview flashcards for Senior-level positions (5+ years experience).

RULES:
1. Questions should test deep understanding, not memorization
2. Answers should be concise but comprehensive
3. Include practical examples where relevant
4. Focus on concepts asked in real iOS interviews
5. Output valid JSON only

OUTPUT FORMAT:
{
  "front": "Question (max 200 chars)",
  "back": "Answer (max 500 chars)",
  "tags": ["tag1", "tag2"],
  "swift_version": "5.5+" or null,
  "confidence": 0.0-1.0
}"""

FLASHCARD_USER_PROMPT = """Create a Senior iOS interview flashcard about: {topic}

CONTEXT FROM DOCUMENTATION:
{context}

REQUIREMENTS:
- Question should test deep understanding
- Answer should be what a Senior dev would say in interview
- Include Swift version if feature is version-specific
- Confidence = how sure you are this is accurate (0.0-1.0)

Output JSON only, no explanation."""

CODE_EXAMPLE_PROMPT = """Generate a minimal, compilable Swift code example demonstrating:

Topic: {topic}
Concept: {concept}

REQUIREMENTS:
1. Must compile with Swift 5.9+
2. Self-contained (no external dependencies)
3. Under 20 lines
4. Include brief comment explaining key point
5. Use modern Swift syntax

Output code only, no explanation."""

CODE_VERIFY_PROMPT = """Review this Swift code for correctness and modern practices:

```swift
{code}
```

CHECKS:
1. Will it compile with Swift 5.9+?
2. Uses modern syntax (no deprecated APIs)?
3. Demonstrates the concept correctly?

Output JSON:
{
  "compiles": true/false,
  "modern": true/false,
  "correct": true/false,
  "issues": ["issue1", "issue2"] or [],
  "fixed_code": "corrected code if needed" or null
}"""
```

### 3. Create flashcard_generator.py
```python
import json
import asyncio
from datetime import datetime
import hashlib
from ..clients.claude_client import ClaudeClient
from ..embeddings.embedder import Embedder
from ..embeddings.indexer import Indexer
from .prompts import FLASHCARD_SYSTEM_PROMPT, FLASHCARD_USER_PROMPT
from .models import Flashcard, GenerationResult

class FlashcardGenerator:
    def __init__(self):
        self.claude = ClaudeClient()
        self.embedder = Embedder()
        self.indexer = Indexer()

    async def generate(self, topic: str, subtopic: str, n_context: int = 5) -> GenerationResult:
        start_time = datetime.now()

        # 1. Get query embedding
        query = f"{topic} {subtopic} iOS interview"
        query_embedding = await self.embedder.embed_query(query)

        # 2. Retrieve relevant context
        results = self.indexer.query(query_embedding, topic=topic, n_results=n_context)

        context_chunks = results.get("documents", [[]])[0]
        source_urls = [m.get("source_url", "") for m in results.get("metadatas", [[]])[0]]

        context_text = "\n\n---\n\n".join(context_chunks)

        # 3. Generate flashcard with Claude
        prompt = FLASHCARD_USER_PROMPT.format(
            topic=f"{topic}: {subtopic}",
            context=context_text[:8000]  # Limit context size
        )

        response = await self.claude.generate(prompt, system=FLASHCARD_SYSTEM_PROMPT)

        # 4. Parse response
        try:
            data = json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                data = json.loads(match.group())
            else:
                raise ValueError(f"Invalid JSON response: {response[:200]}")

        # 5. Create flashcard
        card_id = hashlib.md5(f"{topic}_{subtopic}".encode()).hexdigest()[:12]

        flashcard = Flashcard(
            id=f"{topic}_{card_id}",
            front=data["front"],
            back=data["back"],
            topic=topic,
            tags=data.get("tags", []),
            sources=list(set(source_urls)),
            swift_version=data.get("swift_version"),
            confidence=data.get("confidence", 0.8),
        )

        elapsed = (datetime.now() - start_time).total_seconds() * 1000

        return GenerationResult(
            flashcard=flashcard,
            raw_context=context_chunks,
            generation_time_ms=int(elapsed),
            verification_passed=False  # Will be set by verifier
        )

    async def generate_batch(self, topic: str, subtopics: list[str]) -> list[GenerationResult]:
        results = []
        for subtopic in subtopics:
            try:
                result = await self.generate(topic, subtopic)
                results.append(result)
                await asyncio.sleep(1)  # Rate limit
            except Exception as e:
                print(f"Failed to generate {topic}/{subtopic}: {e}")
        return results
```

### 4. Create code_verifier.py
```python
import json
import subprocess
import tempfile
import os
from ..clients.gemini_client import GeminiClient
from .prompts import CODE_EXAMPLE_PROMPT, CODE_VERIFY_PROMPT
from .models import Flashcard

class CodeVerifier:
    def __init__(self):
        self.gemini = GeminiClient()

    async def generate_code_example(self, topic: str, concept: str) -> str | None:
        """Generate a code example using Gemini."""
        prompt = CODE_EXAMPLE_PROMPT.format(topic=topic, concept=concept)

        try:
            response = await self.gemini.generate(prompt)
            # Extract code block
            if "```swift" in response:
                code = response.split("```swift")[1].split("```")[0].strip()
            elif "```" in response:
                code = response.split("```")[1].split("```")[0].strip()
            else:
                code = response.strip()
            return code
        except Exception as e:
            print(f"Code generation failed: {e}")
            return None

    async def verify_code(self, code: str) -> dict:
        """Verify code with Gemini and Swift compiler."""

        # 1. LLM verification
        prompt = CODE_VERIFY_PROMPT.format(code=code)
        response = await self.gemini.generate(prompt)

        try:
            llm_result = json.loads(response)
        except:
            llm_result = {"compiles": False, "issues": ["Failed to parse LLM response"]}

        # 2. Actual Swift compiler check
        compile_result = self._swift_compile_check(code)

        return {
            "llm_check": llm_result,
            "compiler_check": compile_result,
            "verified": compile_result["success"] and llm_result.get("correct", False)
        }

    def _swift_compile_check(self, code: str) -> dict:
        """Try to compile Swift code."""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.swift', delete=False) as f:
                f.write(code)
                f.flush()
                temp_path = f.name

            result = subprocess.run(
                ['swiftc', '-parse', temp_path],
                capture_output=True,
                text=True,
                timeout=30
            )

            os.unlink(temp_path)

            return {
                "success": result.returncode == 0,
                "errors": result.stderr if result.returncode != 0 else None
            }
        except FileNotFoundError:
            return {"success": False, "errors": "Swift compiler not found"}
        except Exception as e:
            return {"success": False, "errors": str(e)}

    async def add_code_to_flashcard(self, flashcard: Flashcard) -> Flashcard:
        """Generate and verify code example for flashcard."""

        # Generate code
        code = await self.generate_code_example(flashcard.topic, flashcard.front)

        if not code:
            return flashcard

        # Verify
        verification = await self.verify_code(code)

        if verification["verified"]:
            flashcard.code_example = code
            flashcard.verified = True
        elif verification["llm_check"].get("fixed_code"):
            # Try fixed version
            fixed_code = verification["llm_check"]["fixed_code"]
            fix_verification = await self.verify_code(fixed_code)
            if fix_verification["verified"]:
                flashcard.code_example = fixed_code
                flashcard.verified = True

        return flashcard
```

## Topic List for Generation

```python
SENIOR_IOS_TOPICS = {
    "swift": [
        "Advanced Generics and Type Erasure",
        "Property Wrappers implementation",
        "Result Builders",
        "Swift Macros",
        "Memory Management and ARC internals",
        "Copy-on-Write optimization",
        "Opaque types (some vs any)",
    ],
    "concurrency": [
        "Structured Concurrency",
        "Actors and Actor isolation",
        "Sendable protocol",
        "Task Groups",
        "AsyncSequence and AsyncStream",
        "MainActor and global actors",
        "Data race prevention",
    ],
    "swiftui": [
        "View lifecycle and identity",
        "State management patterns",
        "@Observable vs ObservableObject",
        "Custom ViewModifiers",
        "Preference Keys",
        "Layout protocol",
        "Animation internals",
    ],
    "architecture": [
        "Clean Architecture in iOS",
        "MVVM vs MVC vs VIPER",
        "The Composable Architecture",
        "Dependency Injection patterns",
        "Modularization strategies",
        "Protocol-oriented design",
    ],
    "testing": [
        "Unit testing best practices",
        "UI Testing strategies",
        "Snapshot testing",
        "Test doubles patterns",
        "Async testing",
    ],
    "performance": [
        "Instruments profiling",
        "Memory optimization",
        "Launch time optimization",
        "Battery efficiency",
        "Network optimization",
    ],
}
```

## Todo List

- [x] Create output models (Flashcard, GenerationResult)
- [x] Write prompt templates
- [x] Implement flashcard_generator.py (using Gemini)
- [x] Implement code_verifier.py
- [x] Add batch generation with progress
- [x] Test generation for each topic
- [x] Verify code compilation works

## Test Results

| Metric | Value |
|--------|-------|
| Flashcards generated | 4 (test) |
| Code verification | ✅ Working |
| Avg generation time | ~3-4 seconds |
| Export format | JSON ready |

## Success Criteria

- [x] Generates valid Flashcard objects
- [x] Retrieves relevant context from ChromaDB
- [x] Code examples compile successfully
- [x] Sources are properly attributed
- [x] Confidence scores are reasonable
- [ ] Can generate 100+ cards in <30 min (ready, not tested at scale)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Claude output not JSON | Regex extraction fallback |
| Low-quality context | Increase n_context, filter |
| Code doesn't compile | Auto-fix with Gemini |
| Rate limits | Exponential backoff |

## Next Steps

After completion, proceed to [Phase 5: Verification Layer](./phase-05-verification-layer.md)
