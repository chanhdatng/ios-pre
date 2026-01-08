# Brainstorm Report: iOS Interview Content Generation Pipeline

**Date:** 2026-01-07
**Status:** Agreed
**Participants:** User + Claude

---

## Problem Statement

User needs high-quality, accurate iOS interview preparation content (flashcards + quizzes) for Senior-level positions. Current manually-generated content may be inaccurate or outdated. Need automated pipeline to generate verified, source-backed content.

## Requirements

| Requirement | Decision |
|-------------|----------|
| Target Level | Senior (5+ years) |
| Content Types | Flashcards + Quiz + Code Examples |
| Quality Standard | Verified, compilable, source-linked |
| Volume | 500-1000 cards |
| Automation | Fully automated with quality gates |

## Trusted Sources

1. **Apple Developer Documentation** - Official, authoritative
2. **Hacking with Swift** - Community tutorials, practical
3. **Ray Wenderlich** - In-depth tutorials
4. **Swift.org** - Language reference
5. **Real Interview Questions** - Glassdoor, LeetCode discussions

## Evaluated Approaches

### Option A: Multi-Source RAG Pipeline ✅ SELECTED
- **Description:** Embed source documents → Vector DB → RAG query → Generate with citations
- **Pros:** Traceable, source-linked, verifiable
- **Cons:** Complex setup, needs maintenance
- **Verdict:** Best for quality-focused requirement

### Option B: LLM + Structured Prompting
- **Description:** Direct LLM generation with detailed prompts
- **Pros:** Simple, fast iteration
- **Cons:** No traceability, may hallucinate, outdated knowledge
- **Verdict:** Not suitable for accuracy requirements

### Option C: Human-in-the-Loop
- **Description:** LLM draft → Human review → Approve
- **Pros:** High quality
- **Cons:** Not scalable, time-consuming
- **Verdict:** Good but doesn't meet "fully automated" requirement

## Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────┤
│ Runtime: GitHub Actions (scheduled weekly)                  │
│ Vector DB: ChromaDB (persisted in repo)                     │
│ LLM APIs: Claude (structured output) + Gemini (code gen)    │
│ Storage: Git repository                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE STAGES                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stage 1: Source Collection                                 │
│  ├── Scrape Apple Developer Docs (RSS/sitemap)              │
│  ├── Fetch Hacking with Swift articles                      │
│  ├── Fetch Ray Wenderlich tutorials                         │
│  └── Collect real interview questions                       │
│                                                             │
│  Stage 2: Embedding & Indexing                              │
│  ├── Chunk documents (500-1000 tokens)                      │
│  ├── Generate embeddings (text-embedding-3-large)           │
│  ├── Store in ChromaDB with metadata                        │
│  └── Metadata: source_url, topic, swift_version, date       │
│                                                             │
│  Stage 3: Content Generation                                │
│  ├── Query by topic (e.g., "Swift concurrency")             │
│  ├── Retrieve top-k relevant chunks                         │
│  ├── Claude: Generate flashcard (structured JSON)           │
│  └── Gemini: Generate/verify Swift code examples            │
│                                                             │
│  Stage 4: Verification                                      │
│  ├── Swift compiler check (swift build)                     │
│  ├── Link validation (HTTP HEAD requests)                   │
│  ├── Confidence scoring                                     │
│  └── Flag low-confidence items for manual review            │
│                                                             │
│  Stage 5: Output & Deployment                               │
│  ├── Generate JSON files                                    │
│  ├── Create PR with changes                                 │
│  └── Auto-merge if all checks pass                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Output Schema

```json
{
  "id": "concurrency-001",
  "front": "What is a Swift Actor and when should you use it?",
  "back": "Actor is a reference type that protects its mutable state from data races. Use when: (1) Shared mutable state across tasks, (2) Need automatic synchronization, (3) Replace manual locks/queues.",
  "code_example": "actor BankAccount {\n    private var balance: Double = 0\n    \n    func deposit(_ amount: Double) {\n        balance += amount\n    }\n    \n    func getBalance() -> Double {\n        return balance\n    }\n}",
  "difficulty": "senior",
  "topic": "concurrency",
  "tags": ["actor", "data-race", "swift-concurrency"],
  "sources": [
    "https://developer.apple.com/documentation/swift/actor",
    "https://www.hackingwithswift.com/swift/5.5/actors"
  ],
  "swift_version": "5.5+",
  "confidence": 0.95,
  "verified": true,
  "generated_at": "2026-01-07T17:10:00Z"
}
```

## Implementation Considerations

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Swift code doesn't compile | Auto-compile check, reject failures |
| Source links become stale | Weekly link validation, flag broken |
| LLM hallucination | RAG with source chunks, confidence scoring |
| API rate limits | Batch processing, exponential backoff |
| ChromaDB size growth | Periodic cleanup, deduplication |

### Cost Estimation (Monthly)

| Component | Estimated Cost |
|-----------|----------------|
| Claude API (500-1000 generations) | $10-20 |
| Gemini API (code verification) | $5-10 |
| Embedding API | $2-5 |
| GitHub Actions | Free tier sufficient |
| **Total** | ~$20-35/month |

### Quality Gates

1. **Compile Check:** Swift code must compile with Swift 5.9+
2. **Link Validation:** All source URLs return 200
3. **Confidence Threshold:** Reject cards with confidence < 0.8
4. **Duplicate Detection:** No duplicate questions
5. **Length Limits:** Front (max 200 chars), Back (max 500 chars)

## Success Metrics

| Metric | Target |
|--------|--------|
| Compile success rate | > 95% |
| Source link validity | > 98% |
| Content accuracy (manual audit) | > 90% |
| Coverage (topics covered) | All Senior iOS topics |
| Generation time | < 30 min for 100 cards |

## Topics Coverage (Senior Level)

### Swift Language
- [ ] Advanced Generics & Type Erasure
- [ ] Property Wrappers Deep Dive
- [ ] Result Builders
- [ ] Macros (Swift 5.9+)
- [ ] Memory Management & ARC internals

### Concurrency
- [ ] Structured Concurrency
- [ ] Actors & Actor Isolation
- [ ] Sendable Protocol
- [ ] Task Groups & Cancellation
- [ ] AsyncSequence & AsyncStream

### Architecture
- [ ] Clean Architecture
- [ ] MVVM vs MVC vs VIPER
- [ ] The Composable Architecture (TCA)
- [ ] Dependency Injection patterns
- [ ] Modularization strategies

### System Design
- [ ] iOS App Architecture at Scale
- [ ] Offline-first design
- [ ] Caching strategies
- [ ] Network layer design
- [ ] Real-time features (WebSocket, SSE)

### Performance
- [ ] Instruments profiling
- [ ] Memory optimization
- [ ] Launch time optimization
- [ ] Battery efficiency
- [ ] Network optimization

### Testing
- [ ] Unit testing best practices
- [ ] UI testing strategies
- [ ] Snapshot testing
- [ ] Test doubles (Mocks, Stubs, Fakes)
- [ ] TDD workflow

### Behavioral
- [ ] STAR method responses
- [ ] Technical leadership scenarios
- [ ] Conflict resolution
- [ ] System design communication

## Next Steps

1. **Setup Pipeline Infrastructure**
   - Create GitHub Actions workflow
   - Setup ChromaDB persistence
   - Configure API keys as secrets

2. **Implement Source Scrapers**
   - Apple Docs scraper
   - Hacking with Swift scraper
   - Ray Wenderlich scraper

3. **Build Generation Pipeline**
   - RAG query implementation
   - Claude structured output prompts
   - Gemini code verification

4. **Add Verification Layer**
   - Swift compiler integration
   - Link checker
   - Confidence scoring

5. **Testing & Iteration**
   - Generate initial batch (50 cards)
   - Manual quality audit
   - Iterate on prompts

---

## Unresolved Questions

1. **Rate limiting strategy:** How to handle API rate limits during bulk generation?
2. **Version control:** How to handle Swift version-specific content (5.5 vs 5.9)?
3. **Update frequency:** How often to refresh source embeddings?
4. **Manual review workflow:** How to flag and review low-confidence items?

---

**Report generated by:** Claude (Solution Brainstormer)
**Approved by:** User
