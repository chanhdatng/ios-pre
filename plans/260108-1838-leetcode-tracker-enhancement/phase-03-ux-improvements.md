# Phase 3: UX Improvements

**Status:** ✅ COMPLETED (2026-01-09)

## Context
LeetCode Tracker cần UX improvements để trở nên user-friendly hơn: notes expansion, custom tags, sorting, better validation, bulk actions.

## Overview
Enhance UX với expandable notes, custom tags system, retry count, sorting options, form validation improvements, và bulk delete functionality.

## Requirements
- **Expandable Notes**: Click để expand/collapse notes per problem
- **Custom Tags**: Thêm tags ngoài pattern (e.g., "revisit", "tricky", "easy-to-forget")
- **Retry Count**: Track số lần retry problem
- **Sorting Options**: Sort by date, difficulty, title, retry count
- **Better Form Validation**: Visual feedback, prevent empty submissions
- **Bulk Delete**: Select multiple, delete selected

## Architecture

### Modified Files
```
src/lib/stores/leetcode-store.ts            # Extend LeetCodeProblem interface
src/components/tracking/LeetCodeTracker.tsx # All UX changes
```

### Interface Changes
```typescript
interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  solvedAt: string;
  notes?: string;
  // NEW
  tags?: string[];
  retryCount?: number;
}
```

## Related Files
| File | Purpose | Lines |
|------|---------|-------|
| `LeetCodeTracker.tsx` | Target file | 240 |
| `leetcode-store.ts` | Extend interface | 79 |
| `ReviewWithSearch.tsx` | Reference for UI patterns | 264 |

## Implementation Steps

### Step 1: Extend Problem Interface (15 min)
```typescript
// In leetcode-store.ts
export interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  solvedAt: string;
  notes?: string;
  tags?: string[];      // NEW
  retryCount?: number;  // NEW
}

// Add update action
updateProblem: (id: string, updates: Partial<LeetCodeProblem>) => void;

// Implementation
updateProblem: (id, updates) =>
  set((state) => ({
    problems: state.problems.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),
```

### Step 2: Expandable Notes (30 min)
```tsx
// In problem list item
const [expandedId, setExpandedId] = useState<string | null>(null);

{problems.map((p) => (
  <div key={p.id} className="p-3 bg-[var(--color-surface-primary)] rounded-[var(--radius-md)]">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <a href={getLeetCodeUrl(p.title)} target="_blank" className="...">
          #{p.id} {p.title}
        </a>
        <p className="text-caption">
          <span className={difficultyColors[p.difficulty]}>{p.difficulty}</span>
          • {p.pattern}
          {p.retryCount && p.retryCount > 0 && (
            <span className="ml-2 text-[var(--color-text-tertiary)]">
              (retry: {p.retryCount})
            </span>
          )}
        </p>
      </div>

      {/* Expand/Actions */}
      <div className="flex items-center gap-2">
        {p.notes && (
          <button
            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-blue)]"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === p.id ? 'rotate-180' : ''}`} />
          </button>
        )}
        <button onClick={() => removeProblem(p.id)} className="...">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>

    {/* Expanded Notes */}
    {expandedId === p.id && p.notes && (
      <div className="mt-2 pt-2 border-t border-[var(--color-surface-secondary)] text-body-small text-[var(--color-text-secondary)]">
        {p.notes}
      </div>
    )}

    {/* Tags */}
    {p.tags && p.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {p.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] rounded text-caption">
            {tag}
          </span>
        ))}
      </div>
    )}
  </div>
))}
```

### Step 3: Custom Tags Input (45 min)
```tsx
// In add form
const [tagInput, setTagInput] = useState('');
const [tags, setTags] = useState<string[]>([]);

const addTag = () => {
  const tag = tagInput.trim().toLowerCase();
  if (tag && !tags.includes(tag)) {
    setTags([...tags, tag]);
    setTagInput('');
  }
};

const removeTag = (tag: string) => {
  setTags(tags.filter(t => t !== tag));
};

// JSX
<div className="space-y-2">
  <div className="flex gap-2">
    <input
      type="text"
      placeholder="Add tag (press Enter)"
      value={tagInput}
      onChange={(e) => setTagInput(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
      className="flex-1 px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
    />
    <button type="button" onClick={addTag} className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
      Add
    </button>
  </div>
  {tags.length > 0 && (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => (
        <span key={tag} className="px-2 py-0.5 bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] rounded text-caption flex items-center gap-1">
          {tag}
          <button onClick={() => removeTag(tag)} className="hover:text-[var(--color-accent-red)]">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  )}
</div>
```

### Step 4: Sorting Options (30 min)
```tsx
type SortOption = 'date-desc' | 'date-asc' | 'difficulty' | 'title' | 'retry';
const [sortBy, setSortBy] = useState<SortOption>('date-desc');

const sortedProblems = useMemo(() => {
  const sorted = [...filteredProblems];

  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => b.solvedAt.localeCompare(a.solvedAt));
    case 'date-asc':
      return sorted.sort((a, b) => a.solvedAt.localeCompare(b.solvedAt));
    case 'difficulty':
      const order = { easy: 0, medium: 1, hard: 2 };
      return sorted.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'retry':
      return sorted.sort((a, b) => (b.retryCount || 0) - (a.retryCount || 0));
    default:
      return sorted;
  }
}, [filteredProblems, sortBy]);

// Sort dropdown
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value as SortOption)}
  className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body-small"
>
  <option value="date-desc">Newest first</option>
  <option value="date-asc">Oldest first</option>
  <option value="difficulty">By difficulty</option>
  <option value="title">By title</option>
  <option value="retry">By retry count</option>
</select>
```

### Step 5: Form Validation (30 min)
```tsx
const [errors, setErrors] = useState<{ id?: string; title?: string }>({});

const validateForm = () => {
  const newErrors: typeof errors = {};

  if (!newProblem.id.trim()) {
    newErrors.id = 'Problem ID is required';
  } else if (problems.some(p => p.id === newProblem.id.trim())) {
    newErrors.id = 'Problem already exists';
  }

  if (!newProblem.title.trim()) {
    newErrors.title = 'Title is required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleAddProblem = () => {
  if (!validateForm()) return;
  // ... rest of logic
};

// Input with error state
<div>
  <input
    type="text"
    placeholder="Problem ID (e.g., 1)"
    value={newProblem.id}
    onChange={(e) => {
      setNewProblem({ ...newProblem, id: e.target.value });
      if (errors.id) setErrors({ ...errors, id: undefined });
    }}
    className={`w-full px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body ${
      errors.id ? 'border border-[var(--color-accent-red)]' : ''
    }`}
  />
  {errors.id && <p className="text-caption text-[var(--color-accent-red)] mt-1">{errors.id}</p>}
</div>
```

### Step 6: Bulk Delete (45 min)
```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isSelectMode, setIsSelectMode] = useState(false);

const toggleSelect = (id: string) => {
  const newSet = new Set(selectedIds);
  if (newSet.has(id)) newSet.delete(id);
  else newSet.add(id);
  setSelectedIds(newSet);
};

const selectAll = () => {
  setSelectedIds(new Set(sortedProblems.map(p => p.id)));
};

const deleteSelected = () => {
  if (!confirm(`Delete ${selectedIds.size} problems?`)) return;
  selectedIds.forEach(id => removeProblem(id));
  setSelectedIds(new Set());
  setIsSelectMode(false);
  toast.success(`Deleted ${selectedIds.size} problems`);
};

// Bulk actions bar
{isSelectMode && (
  <div className="flex items-center justify-between p-3 bg-[var(--color-accent-orange)]/10 rounded-[var(--radius-md)]">
    <span className="text-body-small">
      {selectedIds.size} selected
    </span>
    <div className="flex gap-2">
      <button onClick={selectAll} className="text-body-small text-[var(--color-accent-blue)]">
        Select all
      </button>
      <button
        onClick={deleteSelected}
        className="px-3 py-1 bg-[var(--color-accent-red)] text-white rounded text-body-small"
      >
        Delete
      </button>
      <button
        onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }}
        className="text-body-small text-[var(--color-text-secondary)]"
      >
        Cancel
      </button>
    </div>
  </div>
)}

// Toggle select mode button
<button
  onClick={() => setIsSelectMode(!isSelectMode)}
  className="text-body-small text-[var(--color-text-secondary)]"
>
  {isSelectMode ? 'Done' : 'Select'}
</button>

// Checkbox in list item
{isSelectMode && (
  <input
    type="checkbox"
    checked={selectedIds.has(p.id)}
    onChange={() => toggleSelect(p.id)}
    className="mr-3 w-5 h-5"
  />
)}
```

## Todo List
- [x] Extend LeetCodeProblem interface (tags, retryCount)
- [x] Add updateProblem action to store
- [x] Add removeBulk action to store
- [x] Implement expandable notes UI
- [x] Add ChevronDown icon import (also Tag, RotateCcw)
- [x] Create tags input with add/remove
- [x] Display tags in problem list
- [x] Add sorting dropdown
- [x] Implement sort logic (5 options)
- [x] Add form validation with error messages
- [x] Implement bulk select mode
- [x] Add select all / delete selected
- [x] Add confirmation dialog for bulk delete
- [ ] Test all features on mobile (needs manual verification)

## Success Criteria
- [x] Notes expand/collapse smoothly
- [x] Tags can be added with Enter key
- [x] Tags display below problem info
- [x] Sorting works for all 5 options
- [x] Form shows validation errors
- [x] Duplicate ID shows error
- [ ] Bulk select works on mobile (checkboxes sized 20px, needs larger touch targets)
- [x] Delete selected removes all selected

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex state management | Medium | Medium | Keep local state, avoid over-engineering |
| Bulk delete accidental | Low | High | Confirm dialog required |
| Mobile select mode UX | Medium | Low | Large checkboxes, clear feedback |
| Migration for existing data | Low | Low | Optional fields, no migration needed |

## Testing Checklist
- [x] Notes expand on click
- [x] Notes collapse on second click
- [x] Tag added with Enter key
- [x] Tag added with Add button
- [x] Tag removed with X button
- [x] Sort by date (newest) default
- [x] Sort by date (oldest) works
- [x] Sort by difficulty works
- [x] Sort by title works
- [x] Sort by retry count works
- [x] Empty ID shows error
- [x] Duplicate ID shows error
- [x] Empty title shows error
- [x] Error clears on input change
- [x] Select mode shows checkboxes
- [x] Select all selects visible items
- [x] Delete selected shows confirm
- [x] Cancel exits select mode

## Migration Notes
- No database migration needed
- New fields (tags, retryCount) are optional
- Existing problems work without changes
- localStorage auto-updates on next persist

---

## Code Review Summary (2026-01-09)

**Status:** ✅ IMPLEMENTATION COMPLETE | ⚠️ MINOR IMPROVEMENTS RECOMMENDED

**Review Report:** `plans/reports/code-reviewer-260109-1008-phase3-leetcode-ux.md`

**Critical Issues:** 0
**High Priority:** 0
**Medium Priority:** 2
**Low Priority:** 3

### Key Findings

**Positive:**
- All features implemented correctly
- TypeScript typing comprehensive
- Accessibility excellent (ARIA labels, keyboard nav)
- Build passes, no TS errors
- State management clean
- Bundle size +7kb acceptable

**Recommended Improvements:**
1. Increase checkbox touch targets (w-5→w-6) for mobile
2. Add tag length/count limits (max 20 chars, 10 tags)
3. Manual mobile testing needed
4. Remove console.log from unrelated files (ThemeToggle, BaseLayout)

**Architecture Score:** B+ (85/100)
- Code follows YAGNI/KISS/DRY principles
- No over-engineering
- Component size approaching threshold (751 lines)
- Consider extracting sub-components in future

**Next Actions:**
- Quick fix: checkbox size adjustment
- Mobile device testing
- Optional: tag validation enhancement
