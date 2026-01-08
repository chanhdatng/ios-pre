---
title: "LeetCode Tracker Enhancement"
description: "Add search/filter, charts with Recharts, and UX improvements to LeetCode tracker"
status: in-progress
priority: P2
effort: 12h
branch: main
tags: [leetcode, charts, search, ux, zustand]
created: 2026-01-08
---

# LeetCode Tracker Enhancement Plan

## Overview
Enhance LeetCode Tracker với 3 phases: search/filter, statistics charts (Recharts), UX improvements.

## Current State
- **Store** (`leetcode-store.ts`): LeetCodeProblem interface, basic CRUD, getStatsByDifficulty/Pattern
- **Component** (`LeetCodeTracker.tsx`): Stats grid, pattern chips, problem log, add form
- **Page** (`leetcode.astro`): 2-column layout with GitHub tracker

## Architecture Pattern
- Follow `ReviewWithSearch.tsx` pattern for search/filter
- Follow `StatisticsCharts.tsx` pattern for charts (progress bars → Recharts)
- Use Zustand store with persist middleware

## Phase Summary

| Phase | Focus | Effort | Dependencies |
|-------|-------|--------|--------------|
| 1 | Search & Filter | 4h | None |
| 2 | Statistics & Charts | 5h | Recharts install |
| 3 | UX Improvements | 3h | Phase 1, 2 |

## Key Files

### New Files
- `src/lib/hooks/useDebounce.ts` - Reusable debounce hook
- `src/components/charts/LeetCodeCharts.tsx` - Recharts components
- `src/components/tracking/ProblemList.tsx` - Extracted list component

### Modified Files
- `src/lib/stores/leetcode-store.ts` - Add filter state, streak tracking
- `src/components/tracking/LeetCodeTracker.tsx` - Integrate search/filter/charts
- `package.json` - Add recharts dependency

## Constraints
- Use existing CSS variables (--color-accent-*, --color-surface-*, --radius-md)
- Mobile responsive (grid-cols-2 sm:grid-cols-4)
- localStorage persistence via Zustand
- No external API calls needed

## Success Criteria
- [ ] Search filters problems by title/ID in real-time
- [ ] Difficulty/pattern chips filter correctly
- [ ] Charts display progress over time, difficulty distribution
- [ ] Streak tracking shows consecutive days
- [ ] All features work on mobile

## Phase Details
- [Phase 1: Search & Filter](./phase-01-search-filter.md)
- [Phase 2: Statistics & Charts](./phase-02-statistics-charts.md)
- [Phase 3: UX Improvements](./phase-03-ux-improvements.md)

---

## Validation Summary

**Validated:** 2026-01-08
**Questions asked:** 4

### Confirmed Decisions
| Decision | User Choice |
|----------|-------------|
| Filter state location | Local component state (ephemeral) |
| Streak calculation | Today OR yesterday counts |
| Phase 3 scope | All features (notes, tags, retry, sorting, bulk delete) |
| Charts library | **Prefer lighter alternative** (~15kb over 40kb) |

### Action Items
- [ ] **REVISE Phase 2**: Switch from Recharts to Chart.js + react-chartjs-2 (~15kb total)
  - Update dependency: `npm install chart.js react-chartjs-2` instead of `recharts`
  - Adjust chart component implementations
  - Register required Chart.js components for tree-shaking
