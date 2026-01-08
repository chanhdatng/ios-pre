# Phase 3: UX Improvements

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
- [ ] Extend LeetCodeProblem interface (tags, retryCount)
- [ ] Add updateProblem action to store
- [ ] Implement expandable notes UI
- [ ] Add ChevronDown icon import
- [ ] Create tags input with add/remove
- [ ] Display tags in problem list
- [ ] Add sorting dropdown
- [ ] Implement sort logic (5 options)
- [ ] Add form validation with error messages
- [ ] Implement bulk select mode
- [ ] Add select all / delete selected
- [ ] Add confirmation dialog for bulk delete
- [ ] Test all features on mobile

## Success Criteria
- [ ] Notes expand/collapse smoothly
- [ ] Tags can be added with Enter key
- [ ] Tags display below problem info
- [ ] Sorting works for all 5 options
- [ ] Form shows validation errors
- [ ] Duplicate ID shows error
- [ ] Bulk select works on mobile (checkboxes)
- [ ] Delete selected removes all selected

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex state management | Medium | Medium | Keep local state, avoid over-engineering |
| Bulk delete accidental | Low | High | Confirm dialog required |
| Mobile select mode UX | Medium | Low | Large checkboxes, clear feedback |
| Migration for existing data | Low | Low | Optional fields, no migration needed |

## Testing Checklist
- [ ] Notes expand on click
- [ ] Notes collapse on second click
- [ ] Tag added with Enter key
- [ ] Tag added with Add button
- [ ] Tag removed with X button
- [ ] Sort by date (newest) default
- [ ] Sort by date (oldest) works
- [ ] Sort by difficulty works
- [ ] Sort by title works
- [ ] Sort by retry count works
- [ ] Empty ID shows error
- [ ] Duplicate ID shows error
- [ ] Empty title shows error
- [ ] Error clears on input change
- [ ] Select mode shows checkboxes
- [ ] Select all selects visible items
- [ ] Delete selected shows confirm
- [ ] Cancel exits select mode

## Migration Notes
- No database migration needed
- New fields (tags, retryCount) are optional
- Existing problems work without changes
- localStorage auto-updates on next persist
