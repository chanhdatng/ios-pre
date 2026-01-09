# Phase 1: Curated Suggestions

**Status:** ✅ COMPLETED (2026-01-09)

## Overview
Tạo curated data mapping iOS topics → LeetCode problems và UI hiển thị.

## Requirements
- JSON file chứa mapping topic → problems
- Component hiển thị suggestions theo topic
- Filter/search trong suggestions
- Show solved status từ LeetCode store

## Data Structure

### leetcode-suggestions.json
```json
{
  "topics": [
    {
      "id": "swift-fundamentals",
      "name": "Swift Fundamentals",
      "problems": [
        {
          "id": "1",
          "title": "Two Sum",
          "difficulty": "easy",
          "pattern": "Hash Map",
          "relevance": "Basic Swift syntax, Dictionary usage",
          "url": "https://leetcode.com/problems/two-sum/"
        }
      ]
    }
  ]
}
```

## Implementation Steps

### Step 1: Create Curated Data (1.5h)
Research và tạo danh sách bài LeetCode phù hợp cho mỗi iOS topic:

| Topic | Focus Areas | Example Problems |
|-------|-------------|------------------|
| Swift Fundamentals | Syntax, Collections, Optionals | Two Sum, Valid Parentheses |
| iOS Core | App patterns, Delegation | Design patterns problems |
| Concurrency | Thread safety, Async | Producer Consumer, Print in Order |
| Data Structures | Arrays, Trees, Graphs | LRU Cache, Trie |
| System Design | Architecture | Design Twitter, LRU Cache |

### Step 2: TopicSuggestions Component (1h)
```tsx
// src/components/leetcode/TopicSuggestions.tsx
interface Props {
  topic?: string;  // Filter by specific topic
}

export function TopicSuggestions({ topic }: Props) {
  const solvedProblems = useLeetCodeStore(s => s.problems);
  const [selectedTopic, setSelectedTopic] = useState(topic || 'all');

  // Check if problem is already solved
  const isSolved = (problemId: string) =>
    solvedProblems.some(p => p.id === problemId);

  return (
    <div>
      {/* Topic filter dropdown */}
      {/* Problem cards with solved indicator */}
      {/* Quick add button */}
    </div>
  );
}
```

### Step 3: Integrate into LeetCode Page (30m)
Add new section in leetcode.astro with TopicSuggestions component.

## Todo List
- [x] Research LeetCode problems for each iOS topic
- [x] Create leetcode-suggestions.json with 3-5 problems per topic
- [x] Create TopicSuggestions.tsx component
- [x] Add topic filter dropdown
- [x] Show solved indicator (checkmark)
- [x] Add "Add to Tracker" button
- [x] Integrate into leetcode.astro
- [ ] Test on mobile (manual)

## Success Criteria
- [x] 8 topics have curated suggestions (37 problems total)
- [x] Suggestions display with topic filter
- [x] Solved problems show checkmark
- [x] Quick add works

## Implementation Summary

**Files created:**
- `src/data/leetcode-suggestions.json` - 8 topics, 37 curated problems
- `src/components/leetcode/TopicSuggestions.tsx` - 10.54kb (3.52kb gzip)

**Topics covered:**
| Topic | Problems |
|-------|----------|
| Swift Fundamentals | 5 |
| iOS Core | 5 |
| Concurrency | 5 |
| SwiftUI | 5 |
| System Design | 5 |
| Behavioral | 5 |
| Memory Management | 4 |
| Networking | 3 |

## Related Files
| File | Purpose |
|------|---------|
| `src/data/flashcards/*.json` | Topic names reference |
| `src/lib/stores/leetcode-store.ts` | Check solved status |
| `src/pages/leetcode.astro` | Integration target |
