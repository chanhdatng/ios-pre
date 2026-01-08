# Code Review: Phase 2 Core Features

**Date:** 2026-01-07
**Reviewer:** code-reviewer
**Scope:** Phase 2 FSRS Integration, Interactive Components, Progress Tracking

---

## Tóm tắt

**Critical Issues:** 1
**Tổng quan:** Implementation Phase 2 tuân thủ tốt các nguyên tắc YAGNI/KISS/DRY. FSRS integration đúng với ts-fsrs v5, type safety mạnh, design system integration nhất quán. Phát hiện 1 lỗ hổng bảo mật XSS nghiêm trọng, một số vấn đề hiệu năng và kiến trúc cần cải thiện.

---

## Phạm vi Review

### Files Reviewed
- `src/lib/stores/flashcard-store.ts` (76 LOC)
- `src/lib/stores/progress-store.ts` (90 LOC)
- `src/lib/fsrs/scheduler.ts` (64 LOC)
- `src/lib/fsrs/storage.ts` (32 LOC)
- `src/components/interactive/FlashcardDeck.tsx` (136 LOC)
- `src/components/interactive/QuizRunner.tsx` (174 LOC)
- `src/components/interactive/SpacedReview.tsx` (79 LOC)
- `src/components/interactive/NoteEditor.tsx` (71 LOC)
- `src/components/tracking/ProgressDashboard.tsx` (119 LOC)

**Total:** 841 LOC analyzed
**Build Status:** ✅ Successful (1.09s)
**Type Safety:** ✅ No TypeScript errors

---

## Critical Issues (1)

### 🔴 SECURITY: XSS Vulnerability via dangerouslySetInnerHTML

**File:** `src/components/interactive/FlashcardDeck.tsx:107`

```tsx
<div
  className="text-body prose dark:prose-invert max-w-none"
  dangerouslySetInnerHTML={{ __html: currentCard.back }}
/>
```

**Risk:** HIGH - Unsanitized HTML từ `currentCard.back` có thể chứa malicious scripts

**Impact:**
- Attacker có thể inject XSS payloads qua flashcard content
- Steal user data từ localStorage (FSRS states, progress data)
- Session hijacking nếu có authentication

**Fix Required:**
```tsx
// Option 1: Use DOMPurify
import DOMPurify from 'dompurify';

<div
  className="text-body prose dark:prose-invert max-w-none"
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(currentCard.back)
  }}
/>

// Option 2: Use markdown parser (recommended)
import ReactMarkdown from 'react-markdown';

<ReactMarkdown className="text-body prose dark:prose-invert max-w-none">
  {currentCard.back}
</ReactMarkdown>
```

**Action:** MUST fix before production deployment

---

## High Priority Findings (4)

### 1. Missing Error Boundaries

**Files:** All React components

**Issue:** No error boundaries wrap interactive components. Một error trong FlashcardDeck/QuizRunner sẽ crash toàn bộ app

**Fix:**
```tsx
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Component error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-xl text-center">
          <p className="text-headline-3 text-error">Something went wrong</p>
          <button onClick={() => this.setState({ hasError: false })} className="btn-primary mt-4">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 2. Zustand Persist - No Error Handling

**File:** `src/lib/stores/flashcard-store.ts`, `progress-store.ts`

**Issue:** Persist middleware không handle localStorage errors (quota exceeded, disabled, etc)

**Current:**
```typescript
persist(
  (set, get) => ({ /* state */ }),
  { name: 'ios-prep-flashcards' }
)
```

**Fix:**
```typescript
persist(
  (set, get) => ({ /* state */ }),
  {
    name: 'ios-prep-flashcards',
    onRehydrateStorage: () => (state, error) => {
      if (error) {
        console.error('Failed to load saved data:', error);
        // Notify user qua toast/modal
      }
    },
    storage: {
      getItem: (name) => {
        try {
          return localStorage.getItem(name);
        } catch {
          return null;
        }
      },
      setItem: (name, value) => {
        try {
          localStorage.setItem(name, value);
        } catch (e) {
          console.error('Storage quota exceeded');
          // Clear old data hoặc notify user
        }
      },
      removeItem: (name) => {
        try {
          localStorage.removeItem(name);
        } catch {}
      },
    },
  }
)
```

### 3. Performance - Missing Memoization

**File:** `src/components/tracking/ProgressDashboard.tsx`

**Issue:** `getReviewStats()` chạy lại mỗi render dù data không đổi

**Current (line 21):**
```typescript
const stats = getReviewStats();
```

**Fix:**
```typescript
import { useMemo } from 'react';

const cardStates = useFlashcardStore(s => s.cardStates);
const stats = useMemo(() => getReviewStats(), [cardStates]);
```

**Also apply to:**
- `FlashcardDeck`: Memoize `progress` calculation
- `SpacedReview`: Memoize `dueCards` filtering logic

### 4. Type Safety - Implicit any in error handler

**File:** `src/lib/stores/progress-store.ts:84`

```typescript
} catch (e) {  // 'e' is implicitly 'any'
  console.error('Import failed:', e);
}
```

**Fix:**
```typescript
} catch (e) {
  console.error('Import failed:', e instanceof Error ? e.message : String(e));
}
```

---

## Medium Priority Improvements (5)

### 1. FSRS Scheduler - Hardcoded Parameters

**File:** `src/lib/fsrs/scheduler.ts:14-17`

**Issue:** FSRS parameters hardcoded, không thể customize per-user

**Suggestion:**
```typescript
// Allow user customization via settings
export function createScheduler(
  customParams?: Partial<FSRSParameters>
): FSRS {
  const params = generatorParameters({
    request_retention: customParams?.request_retention ?? 0.9,
    maximum_interval: customParams?.maximum_interval ?? 365,
  });
  return fsrs(params);
}
```

### 2. FlashcardDeck - Animation Jank

**File:** `src/components/interactive/FlashcardDeck.tsx:36-44`

**Issue:** `setTimeout` không reliable cho animations, có thể bị skip

**Fix:**
```typescript
const handleRating = (rating: Grade) => {
  if (isAnimating || !currentCard) return;

  setIsAnimating(true);
  reviewCard(currentCard.id, rating);
  updateStreak();

  // Use AnimatePresence onExitComplete instead
  // Move setTimeout logic to motion component
};
```

### 3. SpacedReview - Magic Number

**File:** `src/components/interactive/SpacedReview.tsx:33`

```typescript
setDueCards(cardsToReview.slice(0, 20)); // Magic number
```

**Fix:**
```typescript
const MAX_SESSION_SIZE = 20; // Or make it configurable
setDueCards(cardsToReview.slice(0, MAX_SESSION_SIZE));
```

### 4. ProgressDashboard - N+1 Query Pattern

**File:** `src/components/tracking/ProgressDashboard.tsx:55`

**Issue:** `getWeekProgress()` called trong loop, inefficient

**Fix:**
```typescript
// Compute all week progress upfront
const weekProgresses = useMemo(() =>
  weeks.reduce((acc, week) => {
    acc[`m${week.month}w${week.week}`] = getWeekProgress(week.month, week.week);
    return acc;
  }, {} as Record<string, number>),
  [weeks, checklist]
);

// Then use in render:
const progress = weekProgresses[`m${week.month}w${week.week}`];
```

### 5. NoteEditor - Stale Closure Bug

**File:** `src/components/interactive/NoteEditor.tsx:30-39`

**Issue:** `updateNote` trong useEffect dependency có thể gây stale closure

**Fix:**
```typescript
const updateNoteRef = useRef(updateNote);
updateNoteRef.current = updateNote;

useEffect(() => {
  if (isSaved) return;

  const timer = setTimeout(() => {
    updateNoteRef.current(topicId, content);
    setIsSaved(true);
  }, 2000);

  return () => clearTimeout(timer);
}, [content, isSaved, topicId]); // Remove updateNote
```

---

## Low Priority Suggestions (3)

### 1. Accessibility - Missing ARIA Labels

**Files:** `FlashcardDeck.tsx`, `QuizRunner.tsx`

**Suggestion:**
```tsx
// FlashcardDeck
<div
  className="card p-[var(--spacing-lg)] min-h-[300px] cursor-pointer"
  onClick={() => !isFlipped && setIsFlipped(true)}
  role="button"
  tabIndex={0}
  aria-label={`Flashcard ${currentIndex + 1} of ${cards.length}`}
  onKeyDown={(e) => e.key === 'Enter' && setIsFlipped(true)}
>
```

### 2. Code Style - Inconsistent String Formatting

**Files:** Multiple

Mix của template literals và string concatenation:
```typescript
// Inconsistent:
`month${month}-week${week}`           // Template
String.fromCharCode(65 + index)       // Function call
`m${week.month}w${week.week}`         // Template

// Prefer consistent template literals
```

### 3. Testing - No Test Coverage

**All files:** Không có unit tests

**Recommendation:** Add tests cho critical logic:
- FSRS scheduling calculations
- Store actions (especially edge cases)
- Error handling paths

---

## Positive Observations ✅

### Excellent Practices

1. **Type Safety:** Strong typing throughout, proper use of `Grade` type (not `Rating`)
2. **FSRS v5 Compliance:** Correct import/usage của ts-fsrs v5 API
3. **Design System:** Consistent use của CSS variables, không hardcode colors
4. **KISS Principle:** Components focused, single responsibility
5. **DRY Code:** Shared logic extracted (scheduler, storage helpers)
6. **React Patterns:** Proper hooks usage, no anti-patterns
7. **Build Success:** Clean build với no warnings (trừ content warnings)

### Architectural Wins

- **Zustand over Redux:** Simpler state management, appropriate cho project size
- **Persist Middleware:** Automatic localStorage sync, good DX
- **Framer Motion:** Smooth animations, performant
- **Separation of Concerns:** Clear boundaries giữa stores/fsrs/components

---

## Recommended Actions

### Immediate (Before Production)

1. ✅ **Fix XSS vulnerability** - Add DOMPurify hoặc markdown parser
2. ✅ **Add error boundaries** - Prevent full app crashes
3. ✅ **Handle storage errors** - Add try/catch cho localStorage

### Short-term (Next Sprint)

4. Add memoization cho expensive calculations
5. Fix animation timing issues
6. Add ARIA labels cho accessibility
7. Extract magic numbers to constants

### Long-term (Future Phases)

8. Add unit tests (target 70% coverage)
9. Implement error logging service (Sentry, LogRocket)
10. Add performance monitoring
11. Consider React Query cho server state (nếu có backend)

---

## Metrics

- **Total LOC Analyzed:** 841
- **Type Coverage:** 100% (strict mode enabled)
- **Build Time:** 1.09s
- **Bundle Size:** 194.63 kB (gzip: 60.90 kB)
- **Dependencies:** ts-fsrs@5.2.3, zustand@5.0.9, framer-motion@12.24.7
- **React Hooks Used:** 19 instances (useState, useEffect, useMemo patterns)

---

## Unresolved Questions

1. **Data Migration:** Khi update FSRS parameters, làm sao migrate existing card states?
2. **Export/Import:** Progress export format có versioning không? Backward compatibility?
3. **Storage Limit:** Kế hoạch khi localStorage đầy? (typical limit: 5-10MB)
4. **Offline Support:** Có cần ServiceWorker cho full offline experience?
5. **Analytics:** Track user engagement với flashcards/quizzes?

---

## Kết luận

Implementation Phase 2 **chất lượng cao**, tuân thủ tốt requirements và coding standards. Cần **fix CRITICAL XSS issue** trước khi deploy. Các vấn đề khác là optimizations, không block release.

**Overall Grade:** B+ (sẽ lên A sau khi fix security issue)

**Ready for Production:** ❌ (After fixing XSS vulnerability: ✅)
