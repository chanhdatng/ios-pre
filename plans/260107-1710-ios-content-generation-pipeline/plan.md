---
title: "iOS Interview Content Generation Pipeline"
description: "RAG-based pipeline to generate high-quality, source-backed iOS interview flashcards"
status: pending
priority: P1
effort: 16h
issue: null
branch: main
tags: [infra, automation, rag, content-generation]
created: 2026-01-07
---

# iOS Interview Content Generation Pipeline

## Overview

Automated RAG pipeline to generate 500-1000 high-quality iOS interview flashcards for Senior-level positions. Uses Claude + Gemini APIs with ChromaDB for source-backed content generation.

## Architecture

```
Sources → Embed → ChromaDB → RAG Query → LLM Generate → Verify → Output JSON
```

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Infrastructure Setup | Done | 2h | [phase-01](./phase-01-infrastructure-setup.md) |
| 2 | Source Scrapers | Pending | 4h | [phase-02-source-scrapers.md](./phase-02-source-scrapers.md) |
| 3 | Embedding Pipeline | Pending | 3h | [phase-03-embedding-pipeline.md](./phase-03-embedding-pipeline.md) |
| 4 | RAG Generation | Pending | 4h | [phase-04-rag-generation.md](./phase-04-rag-generation.md) |
| 5 | Verification Layer | Pending | 2h | [phase-05-verification-layer.md](./phase-05-verification-layer.md) |
| 6 | GitHub Actions | Pending | 1h | [phase-06-github-actions.md](./phase-06-github-actions.md) |

## Dependencies

- Python 3.11+
- ChromaDB
- Claude API key
- Gemini API key
- Swift toolchain (for compile verification)

## Success Criteria

- Generate 500+ valid flashcards
- >95% compile success rate
- >98% valid source links
- <30 min for 100 cards generation

## Reference

- Brainstorm report: [brainstorm-260107-1710-ios-content-generation-pipeline.md](../reports/brainstorm-260107-1710-ios-content-generation-pipeline.md)
