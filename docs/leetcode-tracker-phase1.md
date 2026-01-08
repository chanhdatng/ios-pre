# LeetCode Tracker - Phase 1 Implementation Guide

**Feature Name:** Search & Filter Capabilities
**Version:** 1.0
**Status:** Completed
**Release Date:** January 8, 2026
**Last Updated:** January 8, 2026

## Overview

Phase 1 of the LeetCode Tracker enhancement adds comprehensive search and filtering capabilities, enabling users to quickly find and organize their solved problems by title, difficulty level, and algorithm pattern.

## Features Implemented

### 1. Search Input with Debounce

**Purpose:** Allow users to find problems by title or ID with optimized performance.

**Component Location:** `src/components/tracking/LeetCodeTracker.tsx` (lines 202-222)

**Technical Details:**
- Search box with placeholder "Search by title or ID..."
- Case-insensitive matching
- 300ms debounce using `useDebounce` hook
- Clear button (X icon) appears when search has text
- ARIA label for accessibility

**Code Snippet:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 300);

<input
  type="text"
  placeholder="Search by title or ID..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  aria-label="Search problems by title or ID"
  className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface-primary)] border border-[var(--color-surface-primary)] rounded-[var(--radius-md)] text-body focus:outline-none focus:border-[var(--color-accent-blue)]"
/>
```

**Performance:**
- Debounce delay: 300ms (configurable in useDebounce call)
- Prevents excessive filter recalculation
- Optimal for user typing speed

**Usage:**
1. Type in search box
2. Wait 300ms (no input)
3. Problems filtered by matching title or ID
4. Click X to clear search immediately

### 2. Difficulty Filter (Multi-Select Chips)

**Purpose:** Filter problems by difficulty level (Easy, Medium, Hard).

**Component Location:** `src/components/tracking/LeetCodeTracker.tsx` (lines 224-240)

**Technical Details:**
- Three toggle buttons: Easy, Medium, Hard
- Multi-select enabled (can select multiple)
- Visual highlight when selected
- Color-coded chips (green, orange, red)
- ARIA pressed state for accessibility

**Supported Difficulties:**
- `easy` - Green (#10b981)
- `medium` - Orange (#f97316)
- `hard` - Red (#ef4444)

**Code Snippet:**
```typescript
const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);

const toggleDifficulty = (diff: string) => {
  setSelectedDifficulties((prev) =>
    prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
  );
};

{(['easy', 'medium', 'hard'] as const).map((diff) => (
  <button
    key={diff}
    onClick={() => toggleDifficulty(diff)}
    aria-pressed={selectedDifficulties.includes(diff)}
    className={`px-3 py-1.5 rounded-full text-body-small font-medium transition-colors ${
      selectedDifficulties.includes(diff)
        ? `${difficultyBgColors[diff]} text-white`
        : 'bg-[var(--color-surface-primary)] hover:opacity-80'
    }`}
  >
    {diff.charAt(0).toUpperCase() + diff.slice(1)}
  </button>
))}
```

**Usage:**
1. Click difficulty chip (Easy, Medium, or Hard)
2. Chip highlights with color
3. Problems filtered to selected difficulties
4. Can select multiple difficulties
5. Deselect to remove from filter

### 3. Pattern Filter (Collapsible Multi-Select)

**Purpose:** Filter problems by algorithm pattern with collapsible UI for space efficiency.

**Component Location:** `src/components/tracking/LeetCodeTracker.tsx` (lines 242-284)

**Supported Patterns:**
1. Two Pointers
2. Sliding Window
3. Binary Search
4. DFS
5. BFS
6. Dynamic Programming
7. Backtracking
8. Hash Map
9. Stack
10. Heap
11. Graph
12. Tree
13. Linked List
14. Other

**Technical Details:**
- Collapsible dropdown button with chevron icon
- Rotates chevron when expanded (180°)
- Count badge shows number of selected patterns
- Patterns displayed in grid when expanded
- ARIA expanded state for accessibility

**Code Snippet:**
```typescript
const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
const [isPatternFilterOpen, setIsPatternFilterOpen] = useState(false);

const togglePattern = (pattern: string) => {
  setSelectedPatterns((prev) =>
    prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]
  );
};

<button
  onClick={() => setIsPatternFilterOpen(!isPatternFilterOpen)}
  aria-expanded={isPatternFilterOpen}
  aria-controls="pattern-filter-panel"
  className="flex items-center gap-2 text-body-small font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
>
  <ChevronDown
    className={`w-4 h-4 transition-transform ${isPatternFilterOpen ? 'rotate-180' : ''}`}
    aria-hidden="true"
  />
  Filter by Pattern{' '}
  {selectedPatterns.length > 0 && (
    <span className="px-1.5 py-0.5 bg-[var(--color-accent-orange)] text-white rounded text-caption">
      {selectedPatterns.length}
    </span>
  )}
</button>
```

**Usage:**
1. Click "Filter by Pattern" to expand
2. Select one or more patterns
3. Each selected pattern highlights orange
4. Count badge shows selections
5. Click to collapse when done

### 4. Filter Summary & Clear Button

**Purpose:** Show filter status and provide easy reset.

**Component Location:** `src/components/tracking/LeetCodeTracker.tsx` (lines 286-299)

**Technical Details:**
- Display format: "{filtered} of {total} problems"
- "Clear filters" button appears only when filters active
- Single click resets search, difficulties, and patterns
- Accessible styling with hover underline

**Code Snippet:**
```typescript
const hasFilters = searchQuery || selectedDifficulties.length > 0 || selectedPatterns.length > 0;

const clearFilters = () => {
  setSearchQuery('');
  setSelectedDifficulties([]);
  setSelectedPatterns([]);
};

<div className="flex items-center justify-between text-body-small mb-4">
  <span className="text-[var(--color-text-secondary)]">
    {filteredProblems.length} of {problems.length} problems
  </span>
  {hasFilters && (
    <button
      onClick={clearFilters}
      className="text-[var(--color-accent-blue)] hover:underline"
    >
      Clear filters
    </button>
  )}
</div>
```

**Usage:**
1. Apply any filters
2. See filtered results count
3. Click "Clear filters" to reset all
4. Search and filters reset

### 5. Filter Logic Implementation

**Purpose:** Combine search and filter criteria with correct AND/OR logic.

**Component Location:** `src/components/tracking/LeetCodeTracker.tsx` (lines 64-86)

**Logic:**
```
Conditions are AND-ed between categories:
AND(
  search matches (title or ID),
  difficulty in selectedDifficulties (OR within),
  pattern in selectedPatterns (OR within)
)
```

**Code:**
```typescript
const filteredProblems = useMemo(() => {
  let result = problems;

  // Search filter (case-insensitive)
  if (debouncedQuery.trim()) {
    const q = debouncedQuery.toLowerCase();
    result = result.filter(
      (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }

  // Difficulty filter (OR within)
  if (selectedDifficulties.length > 0) {
    result = result.filter((p) => selectedDifficulties.includes(p.difficulty));
  }

  // Pattern filter (OR within)
  if (selectedPatterns.length > 0) {
    result = result.filter((p) => selectedPatterns.includes(p.pattern));
  }

  return result;
}, [problems, debouncedQuery, selectedDifficulties, selectedPatterns]);
```

**Examples:**
```
Example 1: Search "two" + select "medium"
Result: All medium difficulty problems with "two" in title/ID

Example 2: Select "easy" + select "Two Pointers" + "Sliding Window"
Result: Easy problems that are either Two Pointers or Sliding Window

Example 3: Select "medium" + "hard" + search "array"
Result: Medium or hard problems with "array" in title/ID
```

## New Hook: useDebounce

**File Location:** `src/lib/hooks/useDebounce.ts`

**Purpose:** Generic debounce utility for optimizing high-frequency state updates.

**Type Signature:**
```typescript
function useDebounce<T>(value: T, ms?: number): T
```

**Parameters:**
- `value: T` - The value to debounce (any type)
- `ms?: number` - Delay in milliseconds (default: 300)

**Returns:** The debounced value (same type as input)

**Implementation:**
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, ms = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debouncedValue;
}
```

**Usage Example:**
```typescript
const searchQuery = useSearchInput(); // "ty" (user is typing)
const debouncedQuery = useDebounce(searchQuery, 300);
// debouncedQuery remains "" until user stops typing for 300ms

// Now it's "type"
```

**Features:**
- Generic type support (works with any value type)
- Cleanup on unmount (prevents memory leaks)
- Configurable delay
- ESLint-compliant dependency array

## Data Types

### LeetCodeProblem Interface

```typescript
interface LeetCodeProblem {
  id: string;                      // "1", "2", etc.
  title: string;                   // "Two Sum"
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;                 // Algorithm pattern
  notes?: string;                  // Optional user notes
  dateAdded?: number;              // Optional timestamp
  attempts?: number;               // Optional attempt count
}
```

## Accessibility Features

### ARIA Implementation

**Search Input:**
```typescript
aria-label="Search problems by title or ID"
```
Makes unlabeled input accessible to screen readers.

**Difficulty Chips:**
```typescript
aria-pressed={selectedDifficulties.includes(diff)}
```
Indicates pressed/unpressed state for toggle buttons.

**Pattern Filter Button:**
```typescript
aria-expanded={isPatternFilterOpen}
aria-controls="pattern-filter-panel"
```
Announces collapse/expand state and links to controlled panel.

**Pattern Filter Panel:**
```typescript
id="pattern-filter-panel"
role="group"
aria-label="Filter by pattern"
```
Accessible grouping for pattern buttons.

**Icon Accessibility:**
```typescript
<ChevronDown
  className={`w-4 h-4 transition-transform ${isPatternFilterOpen ? 'rotate-180' : ''}`}
  aria-hidden="true"
/>
```
Decorative icon hidden from screen readers (information conveyed by text and ARIA).

### Keyboard Navigation

- **Search Input:** Tab navigable, standard input behavior
- **Difficulty Chips:** Tab navigable buttons with visual focus indicator
- **Pattern Filter Button:** Tab navigable, Space/Enter to toggle
- **Pattern Options:** Tab navigable checkboxes (when open)
- **Clear Filters Button:** Tab navigable, clickable

## Performance Characteristics

### Search Debounce

```
User Types: "two pointers"

T=0ms:     searchQuery="t", debouncedQuery="" (waiting)
T=50ms:    searchQuery="tw", debouncedQuery="" (waiting)
T=100ms:   searchQuery="two", debouncedQuery="" (waiting)
T=300ms:   (no input), debouncedQuery="two" ✓
T=350ms:   searchQuery="two ", debouncedQuery="two" (waiting)
T=400ms:   searchQuery="two p", debouncedQuery="two " (waiting)
T=500ms:   searchQuery="two po", debouncedQuery="two p" (waiting)
T=700ms:   (no input), debouncedQuery="two po" ✓
```

**Benefits:**
- Reduces filter calculations from 20 (per keystroke) to 1-2
- Prevents UI flickering
- Lower CPU usage
- Better perceived performance

### Memoization

```typescript
const filteredProblems = useMemo(() => {
  // Only recalculates when dependencies change
}, [problems, debouncedQuery, selectedDifficulties, selectedPatterns]);
```

**Dependencies:**
- `problems` - Changes when problem added/removed
- `debouncedQuery` - Changes on debounce (300ms delay)
- `selectedDifficulties` - Changes on difficulty toggle
- `selectedPatterns` - Changes on pattern toggle

**Without meMemo:**
- Filter calculations: 10+ per render
- With 100+ problems: 1000+ operations per render

**With useMemo:**
- Filter calculations: Only when dependencies change
- With 100+ problems: ~100 operations only on relevant changes

## Testing Recommendations

### Unit Tests

```typescript
describe('useDebounce', () => {
  it('should debounce value changes', () => {
    // Test debounce delay
  });

  it('should cleanup on unmount', () => {
    // Test memory leak prevention
  });
});
```

### Component Tests

```typescript
describe('LeetCodeTracker - Search & Filter', () => {
  it('should filter by search query', () => {
    // Test search functionality
  });

  it('should filter by difficulty', () => {
    // Test difficulty filter
  });

  it('should filter by pattern', () => {
    // Test pattern filter
  });

  it('should combine filters with AND logic', () => {
    // Test filter combination
  });

  it('should clear all filters', () => {
    // Test clear button
  });
});
```

### Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    // Check aria-label on search
  });

  it('should support keyboard navigation', () => {
    // Test Tab, Enter, Space keys
  });

  it('should have correct color contrast', () => {
    // Check WCAG AA compliance
  });
});
```

## Browser Support

- **Minimum:** ES2020 compatible browsers
- **Required:** CSS Custom Properties support
- **CSS Grid/Flex:** Modern layout support

**Tested Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Migration Guide (for existing implementations)

If migrating from older LeetCodeTracker without search/filter:

1. **No breaking changes** - Search and filter are additive
2. **State structure unchanged** - useLeetCodeStore API same
3. **UI updated** - New filter UI added to Problem Log section
4. **Backward compatible** - Old problems work with new filters

## Known Limitations

1. **localStorage Limit**
   - Max ~10MB per domain
   - ~1000 problems before approaching limit
   - Future: Implement cloud sync (Phase 2)

2. **Search Performance**
   - Linear scan through problems
   - 1000+ problems may have slight lag
   - Future: Implement indexing (Phase 2)

3. **Filter Persistence**
   - Filters not saved between sessions
   - Only problem data persists
   - Future: Persist filters to localStorage (Phase 2)

4. **Pattern List**
   - 14 fixed patterns
   - Future: Support custom patterns (Phase 3)

## Configuration Options

### Debounce Delay

**Default:** 300ms

**To change:**
```typescript
const debouncedQuery = useDebounce(searchQuery, 500); // 500ms
```

**Recommended values:**
- 200ms - Responsive, but more CPU
- 300ms - Balanced (current)
- 500ms - Conservative, less CPU

### Pattern List

**Location:** `src/components/tracking/LeetCodeTracker.tsx` (lines 7-22)

**To add pattern:**
```typescript
const PATTERNS = [
  'Two Pointers',
  'Sliding Window',
  // ... other patterns
  'New Pattern',  // Add here
];
```

**To remove pattern:**
Delete from `PATTERNS` array. Existing problems with deleted pattern still display.

## Troubleshooting

### Search Not Working

**Symptom:** Typing in search box doesn't filter problems

**Solutions:**
1. Check browser console for errors
2. Verify useDebounce hook imported correctly
3. Check LeetCodeTracker component renders
4. Test with exact problem title/ID match

### Filters Not Applying

**Symptom:** Selected filters don't change displayed problems

**Solutions:**
1. Verify problems have difficulty and pattern fields
2. Check filter logic in useMemo
3. Open browser DevTools → React tab, inspect component state
4. Ensure problems.length > 0

### Performance Issues

**Symptom:** Typing search or clicking filters is laggy

**Solutions:**
1. Reduce problem count (test with 50 problems)
2. Increase debounce delay to 500ms
3. Check browser tab CPU usage
4. Look for other heavy operations on page

### Accessibility Issues

**Symptom:** Screen reader doesn't announce filter state

**Solutions:**
1. Check ARIA labels are present
2. Verify buttons use native <button> element
3. Check aria-pressed and aria-expanded attributes
4. Test with screen reader (NVDA, JAWS, VoiceOver)

## Future Enhancements

### Phase 2: Analytics & Statistics

- [ ] Submission history (track which problems revisited)
- [ ] Success rate by pattern
- [ ] Time to solve tracking
- [ ] Pattern difficulty matrix

### Phase 3: Advanced Features

- [ ] Sorting (by difficulty, date, pattern)
- [ ] Problem tagging (custom tags)
- [ ] Study plans (curated problem sets)
- [ ] Progress export (PDF/JSON)

### Phase 4: Cloud Features

- [ ] Cloud sync across devices
- [ ] Collaborative study groups
- [ ] Problem sharing
- [ ] Mobile app support

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [WCAG 2.1 Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Utility Classes](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev)

---

**Document Version:** 1.0
**Last Updated:** January 8, 2026
**Maintained by:** Development Team
**Status:** Complete & Released
