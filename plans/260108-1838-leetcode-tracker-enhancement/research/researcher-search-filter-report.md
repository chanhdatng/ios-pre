# Search & Filter UI Research Report
**Date:** 2026-01-08 | **Project:** iOS Prep Hub (LeetCode Tracker Enhancement)

## Executive Summary
Current implementation in `ReviewWithSearch.tsx` uses local state management for search/filter. Research identifies production-ready patterns for enhancing LeetCode tracker with debounced search, multi-select filters, and Zustand integration. Key finding: Move filter state to Zustand store to unify state management across components.

---

## 1. Debounced Search Patterns

### Pattern A: useCallback + useMemo (Current + Enhanced)
**Best for:** Simple, synchronous filtering

```typescript
import { useCallback, useMemo, useRef, useState } from 'react';

const [searchQuery, setSearchQuery] = useState('');
const debounceTimerRef = useRef<NodeJS.Timeout>();

const handleSearchChange = useCallback((value: string) => {
  clearTimeout(debounceTimerRef.current);
  debounceTimerRef.current = setTimeout(() => {
    setSearchQuery(value);
  }, 300); // 300ms debounce
}, []);

const filteredResults = useMemo(() => {
  if (!searchQuery.trim()) return problems;
  const query = searchQuery.toLowerCase();
  return problems.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.pattern.toLowerCase().includes(query)
  );
}, [searchQuery, problems]);
```

### Pattern B: Custom useDebounce Hook
**Best for:** Reusability across components

```typescript
function useDebounce<T>(value: T, ms = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debouncedValue;
}

// Usage
const debouncedQuery = useDebounce(searchQuery, 300);
```

**Recommendation:** Use Pattern B for code reuse. Create `/src/lib/hooks/useDebounce.ts`.

---

## 2. Multi-Select Filter Chips

### Implementation with Current Setup
Your `ReviewWithSearch.tsx` already implements chip filtering well. Enhance for LeetCode tracker:

```typescript
interface FilterState {
  difficulties: ('easy' | 'medium' | 'hard')[];
  patterns: string[];
  showSolved: boolean;
}

const [filters, setFilters] = useState<FilterState>({
  difficulties: [],
  patterns: [],
  showSolved: true,
});

// Toggle handler
const toggleDifficulty = (diff: string) => {
  setFilters(prev => ({
    ...prev,
    difficulties: prev.difficulties.includes(diff as any)
      ? prev.difficulties.filter(d => d !== diff)
      : [...prev.difficulties, diff as any]
  }));
};
```

### Mobile-Friendly UI Pattern
```tsx
<div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
  {['easy', 'medium', 'hard'].map(diff => (
    <button
      key={diff}
      onClick={() => toggleDifficulty(diff)}
      className={`px-3 py-1.5 rounded-full text-body-small whitespace-nowrap ${
        filters.difficulties.includes(diff)
          ? 'bg-[var(--color-accent-orange)] text-white'
          : 'bg-[var(--color-surface-secondary)]'
      }`}
    >
      {diff} {filters.difficulties.includes(diff) && '✓'}
    </button>
  ))}
</div>
```

---

## 3. Zustand Store Integration (Recommended)

### Enhanced Filter Store Pattern
Move filter state OUT of components into Zustand store:

```typescript
// /src/lib/stores/filter-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterStore {
  // Search state
  searchQuery: string;
  debouncedQuery: string;

  // Filter state
  selectedDifficulties: ('easy' | 'medium' | 'hard')[];
  selectedPatterns: string[];
  showBookmarks: boolean;

  // Actions
  setSearchQuery: (q: string) => void;
  setDebouncedQuery: (q: string) => void;
  toggleDifficulty: (d: 'easy' | 'medium' | 'hard') => void;
  togglePattern: (p: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      searchQuery: '',
      debouncedQuery: '',
      selectedDifficulties: [],
      selectedPatterns: [],
      showBookmarks: false,

      setSearchQuery: (q) => set({ searchQuery: q }),
      setDebouncedQuery: (q) => set({ debouncedQuery: q }),

      toggleDifficulty: (d) => set(state => ({
        selectedDifficulties: state.selectedDifficulties.includes(d)
          ? state.selectedDifficulties.filter(x => x !== d)
          : [...state.selectedDifficulties, d]
      })),

      togglePattern: (p) => set(state => ({
        selectedPatterns: state.selectedPatterns.includes(p)
          ? state.selectedPatterns.filter(x => x !== p)
          : [...state.selectedPatterns, p]
      })),

      resetFilters: () => set({
        searchQuery: '',
        debouncedQuery: '',
        selectedDifficulties: [],
        selectedPatterns: [],
        showBookmarks: false,
      }),
    }),
    { name: 'ios-prep-filters' }
  )
);
```

### Component Integration
```typescript
export default function LeetCodeTrackerEnhanced() {
  const {
    searchQuery,
    selectedDifficulties,
    selectedPatterns,
    toggleDifficulty,
    togglePattern,
    resetFilters
  } = useFilterStore();

  const { problems } = useLeetCodeStore();
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filtered = useMemo(() => {
    let result = problems;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.pattern.toLowerCase().includes(q)
      );
    }

    if (selectedDifficulties.length > 0) {
      result = result.filter(p => selectedDifficulties.includes(p.difficulty));
    }

    if (selectedPatterns.length > 0) {
      result = result.filter(p => selectedPatterns.includes(p.pattern));
    }

    return result;
  }, [problems, debouncedQuery, selectedDifficulties, selectedPatterns]);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <SearchInput
        value={searchQuery}
        onChange={(q) => setSearchQuery(q)}
      />

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {['easy', 'medium', 'hard'].map(d => (
          <FilterChip
            key={d}
            label={d}
            active={selectedDifficulties.includes(d as any)}
            onClick={() => toggleDifficulty(d as any)}
          />
        ))}
      </div>

      {/* Reset button */}
      {(searchQuery || selectedDifficulties.length > 0) && (
        <button onClick={resetFilters} className="text-sm text-blue-500">
          Clear all filters
        </button>
      )}

      {/* Results */}
      <ProblemList problems={filtered} />
    </div>
  );
}
```

---

## 4. URL Query Params Sync (Optional Enhancement)

### Implementation with useSearchParams
```typescript
import { useSearchParams } from 'react-router-dom';

// Sync to URL
useEffect(() => {
  const params = new URLSearchParams();
  if (debouncedQuery) params.set('q', debouncedQuery);
  if (selectedDifficulties.length > 0) {
    params.set('diff', selectedDifficulties.join(','));
  }
  if (selectedPatterns.length > 0) {
    params.set('pat', selectedPatterns.join(','));
  }
  window.history.replaceState({}, '', `?${params.toString()}`);
}, [debouncedQuery, selectedDifficulties, selectedPatterns]);
```

**Note:** Astro doesn't have native client-side routing. For static site: use localStorage (already in Zustand persist), skip URL sync.

---

## 5. Mobile-Friendly UX Patterns

### Responsive Layout
```tsx
<div className="space-y-4 md:space-y-6">
  {/* Full-width search on mobile */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
    <input
      type="text"
      placeholder="Search problems..."
      className="w-full pl-10 py-2.5 md:py-3" // Larger touch targets
    />
  </div>

  {/* Horizontal scroll for chips on mobile */}
  <div className="overflow-x-auto -mx-4 px-4 pb-2">
    <div className="flex gap-2 w-max md:w-auto md:flex-wrap">
      {/* Chips here */}
    </div>
  </div>

  {/* Collapsible filter panel */}
  <details className="md:open">
    <summary className="cursor-pointer font-semibold">More Filters</summary>
    <div className="mt-3 space-y-3">
      {/* Additional filters */}
    </div>
  </details>
</div>
```

### Touch-Friendly Targets
- Minimum 44px × 44px buttons (current: 36-40px - acceptable)
- Single-tap filter removal
- Larger input padding on mobile (py-2.5 → py-3)

---

## 6. Performance Considerations

| Pattern | Pros | Cons | Use Case |
|---------|------|------|----------|
| Debounced setState | Simple, native React | Extra re-renders | Small datasets (<1000) |
| useMemo filtering | Prevents re-computation | Complex deps array | Large datasets |
| Zustand store | Global state, persist | Extra abstraction layer | Multi-component filters |

**Recommendation for iOS Prep Hub:** Use Zustand store (already in use for flashcards/leetcode) + useMemo filtering. Matches existing architecture.

---

## 7. Code Organization Checklist

```
src/
├── lib/
│   ├── hooks/
│   │   └── useDebounce.ts (NEW)
│   └── stores/
│       ├── leetcode-store.ts (existing)
│       ├── flashcard-store.ts (existing)
│       └── filter-store.ts (NEW)
└── components/
    └── tracking/
        └── LeetCodeTrackerEnhanced.tsx (NEW)
```

---

## 8. Implementation Priority

1. **Phase 1:** Create useDebounce hook + filter-store (Zustand)
2. **Phase 2:** Migrate LeetCodeTracker to use new store
3. **Phase 3:** Add URL sync (if multi-tab state sharing needed)
4. **Phase 4:** Advanced: Saved filter presets in store

---

## Unresolved Questions

- Should filters persist to localStorage? (Recommend: YES, via Zustand persist middleware)
- Need URL shareable filter links? (Recommend: NO for MVP, add in Phase 3)
- Support for saved filter presets? (Recommend: NO for MVP)
