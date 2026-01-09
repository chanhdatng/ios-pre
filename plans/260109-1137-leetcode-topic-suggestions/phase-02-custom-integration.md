# Phase 2: Custom Suggestions & Integration

**Status:** ✅ COMPLETED (2026-01-09)

## Overview
Cho phép user thêm custom suggestions và deep integration với tracker.

## Requirements
- User có thể thêm problem vào bất kỳ topic nào
- Custom suggestions persist trong localStorage
- Suggestions hiển thị trên topic pages (optional)
- Quick mark as solved từ suggestions

## Implementation Steps

### Step 1: Custom Suggestion Store (1h)
```typescript
// src/lib/stores/suggestion-store.ts
interface CustomSuggestion {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  topicId: string;
  addedAt: string;
}

interface SuggestionState {
  customSuggestions: CustomSuggestion[];
  addSuggestion: (suggestion: Omit<CustomSuggestion, 'addedAt'>) => void;
  removeSuggestion: (id: string, topicId: string) => void;
}
```

### Step 2: Add Custom Suggestion Form (1h)
- Modal/form để thêm problem vào topic
- Validate problem ID format
- Auto-fill từ LeetCode URL (parse ID from URL)

### Step 3: Integration Options (1h)

#### Option A: On LeetCode Page (Recommended)
- Suggestions section với tabs by topic
- Combined view: Curated + Custom

#### Option B: On Topic Pages
- Small "Related LeetCode" section on each month page
- Shows 2-3 top suggestions per topic

## Todo List
- [ ] Create suggestion-store.ts
- [ ] Add custom suggestion form/modal
- [ ] Merge curated + custom in display
- [ ] Add remove custom suggestion
- [ ] (Optional) Show suggestions on topic pages
- [ ] Test persistence

## Success Criteria
- [ ] User can add custom suggestions
- [ ] Custom suggestions persist after refresh
- [ ] Can remove custom suggestions
- [ ] Curated + custom display together

## Related Files
| File | Purpose |
|------|---------|
| `leetcode-suggestions.json` | Curated data |
| `leetcode-store.ts` | Existing tracker |
| `LeetCodeTracker.tsx` | Integration |
