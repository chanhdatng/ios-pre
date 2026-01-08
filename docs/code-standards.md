# iOS Prep Hub - Code Standards & Conventions

**Last Updated:** January 8, 2026
**Version:** 1.0

## Overview

This document defines the coding standards, conventions, and architectural patterns for the iOS Prep Hub project. All contributions should adhere to these guidelines to maintain consistency, readability, and maintainability.

## Directory Structure

```
src/
├── components/              # React and Astro components
│   ├── layout/             # Page structure (BaseLayout, Header, Sidebar)
│   ├── ui/                 # Reusable UI primitives
│   ├── content/            # Content rendering components
│   ├── interactive/        # Interactive features (Flashcards, Quizzes)
│   ├── tracking/           # LeetCode and analytics tracking
│   └── settings/           # User settings and preferences
├── lib/
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   └── utils/              # Utility functions
├── data/
│   └── flashcards/         # JSON flashcard collections
├── pages/                  # Astro pages (file-based routing)
├── styles/                 # Global CSS and theme
└── content/                # Markdown content files
```

### Directory Guidelines

1. **Feature-Based Organization:** Components grouped by feature, not by type
2. **One Component Per File:** Each component lives in its own file (unless tightly coupled)
3. **Index Files:** Use `index.ts` to export collections (e.g., components/content/index.ts)
4. **Utility Grouping:** Related utilities in same subdirectory

## Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase.tsx | `LeetCodeTracker.tsx` |
| Astro Components | PascalCase.astro | `BaseLayout.astro` |
| Custom Hooks | useXxx.ts | `useDebounce.ts` |
| Stores | xxxStore.ts | `leetcodeStore.ts` |
| Utilities | descriptive lowercase.ts | `format-url.ts` |
| Types/Interfaces | types.ts or in same file | `types.ts` |

### Variables & Functions

```typescript
// Constants - SCREAMING_SNAKE_CASE
const MAX_PROBLEMS_PER_PAGE = 50;
const DEFAULT_DEBOUNCE_MS = 300;

// Variables - camelCase
const debouncedValue = useDebounce(searchQuery);
const selectedDifficulties: string[] = [];

// Functions - camelCase
function toggleDifficulty(diff: string) { }
const getLeetCodeUrl = (title: string) => { };

// Classes & Types - PascalCase
class ProblemTracker { }
interface LeetCodeProblem { }
type Difficulty = 'easy' | 'medium' | 'hard';
```

### CSS Classes

```typescript
// Utility-first (Tailwind)
className="flex items-center gap-2 px-3 py-2 rounded-md"

// BEM for custom styles (if needed)
className="problem-card problem-card--highlighted"

// CSS custom properties for theming
className="text-[var(--color-accent-blue)]"
```

## TypeScript Guidelines

### Type Definitions

```typescript
// Always define function parameter types
function togglePattern(pattern: string): void {
  // implementation
}

// Use specific types over 'any'
const problems: LeetCodeProblem[] = [];  // Good
const problems: any[] = [];              // Avoid

// Use union types for constrained values
type Difficulty = 'easy' | 'medium' | 'hard';  // Good
type Difficulty = string;                      // Avoid

// Use interfaces for object shapes, types for aliases
interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  pattern: string;
}

type ProblemStats = {
  total: number;
  solved: number;
};
```

### Generic Types

```typescript
// Reusable hooks with generics
export function useDebounce<T>(value: T, ms = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  // implementation
  return debouncedValue;
}

// Store patterns with generics
create<State>((set) => ({
  // state and actions
}));
```

### Strict Mode

All files must have strict mode enabled:

```typescript
// React components (implicit in .tsx files)
import { useState } from 'react';

// In tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## React Component Standards

### Component Structure

```typescript
import { useState, useMemo } from 'react';
import { CustomHook } from '../../lib/hooks/custom-hook';
import type { ComponentProps } from './types';
import { HelperComponent } from './HelperComponent';

/**
 * Brief description of what component does
 *
 * Features:
 * - Feature 1
 * - Feature 2
 */
export default function MyComponent({ prop1, prop2 }: ComponentProps) {
  // 1. State management
  const [state, setState] = useState('');

  // 2. Custom hooks
  const custom = CustomHook();

  // 3. Computed values
  const computed = useMemo(() => {
    return expensiveCalculation();
  }, [dependencies]);

  // 4. Event handlers
  const handleClick = () => {
    // implementation
  };

  // 5. Effects (if needed)
  // useEffect(..., []);

  // 6. Render
  return (
    <div>
      <HelperComponent />
    </div>
  );
}
```

### Props

```typescript
// Always define prop types
interface LeetCodeTrackerProps {
  initialProblems?: LeetCodeProblem[];
  onProblemAdded?: (problem: LeetCodeProblem) => void;
}

// Destructure in parameters
export default function LeetCodeTracker({
  initialProblems = [],
  onProblemAdded,
}: LeetCodeTrackerProps) {
  // implementation
}

// Optional: Use default props for simple components
function Button({
  children,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  // implementation
}
```

### Hooks Usage

```typescript
// Custom hooks follow "use" prefix convention
export function useDebounce<T>(value: T, ms = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debouncedValue;
}

// Use hooks from top of component
export default function Component() {
  const debouncedSearch = useDebounce(searchQuery, 300);
  const store = useLeetCodeStore();

  // implementation
}
```

## Zustand Store Standards

### Store Structure

```typescript
import { create } from 'zustand';

interface LeetCodeState {
  // State
  problems: LeetCodeProblem[];

  // Actions
  addProblem: (problem: LeetCodeProblem) => void;
  removeProblem: (id: string) => void;
  getStatsByDifficulty: () => DifficultyStats;
}

export const useLeetCodeStore = create<LeetCodeState>((set, get) => ({
  // Initial state
  problems: [],

  // Actions
  addProblem: (problem) => {
    set((state) => ({
      problems: [...state.problems, problem],
    }));
  },

  removeProblem: (id) => {
    set((state) => ({
      problems: state.problems.filter((p) => p.id !== id),
    }));
  },

  getStatsByDifficulty: () => {
    const { problems } = get();
    return {
      easy: problems.filter((p) => p.difficulty === 'easy').length,
      medium: problems.filter((p) => p.difficulty === 'medium').length,
      hard: problems.filter((p) => p.difficulty === 'hard').length,
    };
  },
}));
```

### Store Guidelines

1. **One Store Per Feature:** LeetCodeStore, FlashcardStore, UserStore
2. **Clear Action Names:** Use verbs (add, remove, update, clear)
3. **Immutable Updates:** Always create new objects/arrays
4. **Computed Values:** Use getter pattern or separate selector
5. **localStorage Sync:** Add middleware for persistence

## Styling Standards

### Tailwind CSS Guidelines

```typescript
// Use utility-first approach
className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-500"

// Complex classes: break into multiple lines for readability
className={`
  px-3 py-2
  rounded-[var(--radius-md)]
  bg-[var(--color-surface-primary)]
  text-[var(--color-text-primary)]
  hover:opacity-80
  transition-colors
`}

// Conditional classes: use template literals
const difficulty = 'hard';
const bgColor = difficultyColors[difficulty]; // Map or ternary
className={`px-3 py-2 ${selectedDifficulties.includes(diff) ? 'bg-red-500' : 'bg-gray-200'}`}

// Don't use inline style objects unless necessary
className="w-full h-auto"  // Good
style={{ width: '100%' }}  // Avoid
```

### CSS Custom Properties

```typescript
// Define in global.css
:root {
  --color-accent-green: #10b981;
  --color-accent-orange: #f97316;
  --color-accent-red: #ef4444;
  --radius-md: 0.5rem;
}

// Use in components
className="text-[var(--color-accent-blue)]"
className="rounded-[var(--radius-md)]"
```

### Theme Colors

```typescript
const difficultyColors = {
  easy: 'text-[var(--color-accent-green)]',
  medium: 'text-[var(--color-accent-orange)]',
  hard: 'text-[var(--color-accent-red)]',
};

const difficultyBgColors = {
  easy: 'bg-[var(--color-accent-green)]',
  medium: 'bg-[var(--color-accent-orange)]',
  hard: 'bg-[var(--color-accent-red)]',
};
```

## Accessibility Standards

### ARIA Labels

```typescript
// Always label form inputs
<input
  type="text"
  placeholder="Search..."
  aria-label="Search problems by title or ID"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

// Use aria-pressed for toggle buttons
<button
  aria-pressed={selectedDifficulties.includes('easy')}
  onClick={() => toggleDifficulty('easy')}
>
  Easy
</button>

// Use aria-expanded for collapsible content
<button
  aria-expanded={isOpen}
  aria-controls="filter-panel"
  onClick={() => setIsOpen(!isOpen)}
>
  Filter
</button>

// Use role for custom components
<div role="group" aria-label="Difficulty filters">
  {/* filter buttons */}
</div>
```

### Semantic HTML

```typescript
// Good: Semantic elements
<button onClick={handleClick}>Click me</button>
<a href="/page">Link</a>
<label htmlFor="input">Label</label>
<input id="input" type="text" />

// Avoid: Non-semantic elements
<div onClick={handleClick}>Click me</div>
<span onClick={handleClick}>Link</span>
```

### Keyboard Navigation

```typescript
// Use native form elements (buttons, links, inputs)
// They have built-in keyboard support
<input type="text" />      // Tab navigable
<button>Click</button>     // Tab navigable, Space/Enter activatable
<a href="/">Link</a>       // Tab navigable

// For custom components, handle key events
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleAction();
  }
};
```

## Error Handling

### Error Boundaries (Future)

```typescript
// Planned implementation
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong</h1>;
    }
    return this.props.children;
  }
}
```

### Try-Catch Usage

```typescript
// In async operations
async function addProblem(problem: LeetCodeProblem) {
  try {
    // Add problem logic
    store.addProblem(problem);
    toast.success('Problem added');
  } catch (error) {
    console.error('Failed to add problem:', error);
    toast.error('Failed to add problem');
  }
}
```

## Performance Guidelines

### useMemo Usage

```typescript
// Memoize expensive calculations
const filteredProblems = useMemo(() => {
  let result = problems;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter((p) =>
      p.title.toLowerCase().includes(q) || p.id.includes(q)
    );
  }

  if (selectedDifficulties.length > 0) {
    result = result.filter((p) =>
      selectedDifficulties.includes(p.difficulty)
    );
  }

  return result;
}, [problems, searchQuery, selectedDifficulties]);
```

### useCallback Usage (When Needed)

```typescript
// Memoize callbacks passed to child components
const handleAddProblem = useCallback(() => {
  store.addProblem(newProblem);
}, [newProblem, store]);
```

### Debouncing

```typescript
// Use custom useDebounce hook for search inputs
const debouncedQuery = useDebounce(searchQuery, 300);

// Then use debouncedQuery in useMemo dependencies
const filteredProblems = useMemo(() => {
  // Filter based on debouncedQuery
}, [debouncedQuery]);
```

## Code Comments

### JSDoc Documentation

```typescript
/**
 * Debounce a value by a given delay
 * @param value - The value to debounce
 * @param ms - Delay in milliseconds (default 300)
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 500);
 */
export function useDebounce<T>(value: T, ms = 300): T {
  // implementation
}
```

### Inline Comments

```typescript
// Use for complex logic explanations
if (selectedDifficulties.length > 0) {
  // Only filter by difficulty if user has selected at least one
  result = result.filter((p) => selectedDifficulties.includes(p.difficulty));
}

// Avoid obvious comments
const name = 'John'; // DON'T: Set name to John

// DO: Explain why, not what
const MAX_RETRIES = 3; // Retry up to 3 times before showing error to user
```

## Testing Standards (Future)

### Unit Test Pattern

```typescript
// tests/lib/hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../../src/lib/hooks/useDebounce';

describe('useDebounce', () => {
  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });
});
```

### Component Test Pattern

```typescript
// tests/components/tracking/LeetCodeTracker.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeetCodeTracker from '../../../src/components/tracking/LeetCodeTracker';

describe('LeetCodeTracker', () => {
  it('should filter problems by search query', async () => {
    render(<LeetCodeTracker />);
    const input = screen.getByLabelText('Search problems');

    await userEvent.type(input, 'two pointers');

    expect(screen.getByText(/two pointers/i)).toBeInTheDocument();
  });
});
```

## Documentation Requirements

### README for New Features

Each major feature should include a README with:
- Feature overview
- Usage examples
- Configuration options
- Known limitations

### Code Comments

- Complex algorithms: Add detailed comments
- Business logic: Explain the "why"
- Workarounds: Note temporary fixes with issue links

## Pre-Commit Checklist

Before committing code:

- [ ] No `console.log` or `debugger` statements
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] No unused variables or imports
- [ ] Proper ARIA labels on interactive elements
- [ ] Code follows naming conventions
- [ ] Related components/hooks use consistent patterns
- [ ] Complex logic has explanatory comments
- [ ] No deprecated dependencies
- [ ] Mobile responsive (tested on small screens)

## Tools & Configuration

### ESLint Configuration

```json
{
  "extends": ["eslint:recommended"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-debugger": "error",
    "prefer-const": "warn"
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler"
  }
}
```

## Breaking Changes

When introducing breaking changes:

1. Update version in `package.json`
2. Document in `CHANGELOG.md`
3. Provide migration guide
4. Update affected components/stores
5. Notify team via PR description

## Review Checklist for PRs

- [ ] Code follows all standards in this document
- [ ] TypeScript types are complete and correct
- [ ] Accessibility standards met (ARIA, semantic HTML)
- [ ] Performance considered (useMemo, debounce)
- [ ] Related documentation updated
- [ ] No console.log or debugger statements
- [ ] Mobile responsive design tested

---

**Last Updated:** January 8, 2026
**Maintained by:** Development Team
**Version:** 1.0
