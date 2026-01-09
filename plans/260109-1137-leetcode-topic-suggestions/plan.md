---
title: "LeetCode Topic Suggestions"
description: "Suggest relevant LeetCode problems based on iOS interview topics"
status: pending
priority: P2
effort: 6h
branch: main
tags: [leetcode, topics, suggestions, curated]
created: 2026-01-09
---

# LeetCode Topic Suggestions Plan

## Overview
Kết nối iOS interview topics với LeetCode problems phù hợp. Hiển thị gợi ý bài LeetCode khi học mỗi topic, cho phép user thêm custom suggestions.

## Current State
- **Topics**: 26 flashcard sets (6 core + 20 advanced)
- **LeetCode Tracker**: Standalone, không kết nối với topics
- **Problem**: User phải tự tìm bài LeetCode phù hợp với topic đang học

## Architecture

### Data Flow
```
iOS Topic → Suggested Problems → User Action (Mark Solved/Add Custom)
                ↓
         LeetCode Tracker (existing)
```

### New Files
```
src/data/leetcode-suggestions.json     # Curated mapping: topic → problems
src/components/leetcode/TopicSuggestions.tsx  # Display suggestions
src/lib/stores/suggestion-store.ts     # User custom suggestions (Zustand)
```

### Modified Files
```
src/pages/leetcode.astro               # Add suggestions section
src/components/tracking/LeetCodeTracker.tsx  # Quick add from suggestions
```

## Phase Summary

| Phase | Focus | Effort |
|-------|-------|--------|
| 1 | Curated data + Display UI | 3h |
| 2 | Custom suggestions + Integration | 3h |

## Phase Details
- [Phase 1: Curated Suggestions](./phase-01-curated-suggestions.md)
- [Phase 2: Custom & Integration](./phase-02-custom-integration.md)

## Constraints
- Reuse existing LeetCode store/tracker
- No LeetCode API (manual curated data)
- Mobile responsive
- localStorage persistence

## Success Criteria
- [ ] Each iOS topic has 3-5 suggested LeetCode problems
- [ ] User can view suggestions by topic
- [ ] One-click add to LeetCode tracker
- [ ] User can add custom suggestions
- [ ] Suggestions show solved status
