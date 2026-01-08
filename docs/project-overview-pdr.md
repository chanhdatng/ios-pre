# iOS Prep Hub - Project Overview & PDR

**Document Version:** 1.0
**Last Updated:** January 8, 2026
**Status:** Active Development

## Project Vision

Create a comprehensive, interactive iOS interview preparation platform that leverages AI-generated content, spaced repetition learning, and practical coding problem tracking to help developers master iOS development and interview skills.

## Project Goals

1. **Knowledge Consolidation:** Provide structured flashcards covering iOS fundamentals, advanced topics, and design patterns
2. **Active Learning:** Enable interactive quizzes, spaced repetition reviews, and hands-on practice
3. **Problem Tracking:** Help developers track LeetCode solutions with categorization and analytics
4. **Content Freshness:** Automatically generate and update content from authoritative sources
5. **Accessibility:** Ensure the platform is accessible to all users with proper ARIA labels and keyboard navigation

## Core Features

### Feature 1: Flashcard Learning System
**Status:** Completed
- Multiple flashcard decks covering iOS fundamentals to advanced topics
- Spaced repetition algorithm for optimal retention
- Progress tracking per user session
- Search within decks
- Responsive card interface

### Feature 2: LeetCode Problem Tracking
**Status:** Phase 1 (Search & Filter) - IN PROGRESS
- Log solved LeetCode problems with metadata
- Organize by difficulty and algorithm pattern
- Advanced search and filtering
- Statistics by difficulty and pattern

**Phase 1 Specification (Current):**
- Search input with 300ms debounce (by title/ID)
- Multi-select difficulty filter (Easy/Medium/Hard)
- Collapsible multi-select pattern filter
- Filter count display and clear button
- Complete ARIA accessibility support

**Future Phases:**
- Submission history and retry tracking
- Advanced analytics dashboard
- Pattern difficulty correlations

### Feature 3: Interactive Quizzes
**Status:** Completed
- Multiple-choice question format
- Score tracking and feedback
- Topic-based quiz organization

### Feature 4: Content Management
**Status:** Active (Python Pipeline)
- Automated scraping from authoritative sources (Apple Docs, Kodeco, objc.io)
- AI-powered flashcard generation
- Content verification and quality filtering
- Duplicate detection
- Daily GitHub Actions workflow

## Product Requirements Document (PRD)

### LeetCode Tracker Enhancement Phase 1: Search & Filter

#### Functional Requirements

**FR1: Search Functionality**
- Input field that searches problems by title or ID
- Case-insensitive matching
- 300ms debounce to optimize performance
- Clear button to reset search immediately
- Search icon and placeholder text

**FR2: Difficulty Filtering**
- Multi-select chips for Easy, Medium, Hard
- Visual indication of selected filters
- OR logic (show problems matching any selected difficulty)
- No limit on selections

**FR3: Pattern Filtering**
- Collapsible dropdown for algorithm patterns
- 14 supported patterns (Two Pointers, Sliding Window, Binary Search, DFS, BFS, Dynamic Programming, Backtracking, Hash Map, Stack, Heap, Graph, Tree, Linked List, Other)
- Count badge showing selected patterns
- OR logic within filter category
- AND logic between filter categories

**FR4: Filter Management**
- Display count of filtered results vs. total problems
- Clear Filters button (visible only when filters active)
- All filters work together (AND between categories)

**FR5: Results Display**
- Show matching problems in scrollable list
- Empty state message when no results
- Problem card shows ID, title, difficulty, pattern
- External link to LeetCode problem page
- Delete button per problem

#### Non-Functional Requirements

**NFR1: Performance**
- Search debounce: 300ms
- useMemo for filter calculations
- Scrollable problem list (max-height: 256px)
- Optimize for lists up to 100+ problems

**NFR2: Accessibility**
- ARIA labels on search input
- ARIA pressed state on filter chips
- ARIA expanded on collapsible filter
- Semantic HTML (buttons, role="group")
- Keyboard navigation support

**NFR3: Responsive Design**
- Mobile-first approach
- Adapt to small screens (sm: 640px breakpoint)
- Touch-friendly chip sizes
- Readable text on all devices

**NFR4: User Experience**
- Immediate visual feedback on filter selection
- Smooth transitions and color changes
- Clear filter intent with typography and icons
- Consistent with existing design system

#### Technical Specifications

**Technology Stack:**
- React 18 with TypeScript
- Zustand for problem storage
- Custom `useDebounce` hook
- Lucide React for icons
- Tailwind CSS for styling
- CSS custom properties for theming

**Component Structure:**
- `LeetCodeTracker.tsx` - Main component (402 lines)
- `useDebounce.ts` - Debounce hook (18 lines)
- Integration with `useLeetCodeStore` hook
- Props: None (uses Zustand store)

**State Management:**
- Zustand store (`useLeetCodeStore`):
  - `problems[]` - Array of LeetCodeProblems
  - `addProblem()`, `removeProblem()` - CRUD operations
  - `getStatsByDifficulty()` - Statistics
  - `getStatsByPattern()` - Pattern breakdown

- Local component state:
  - `searchQuery` - Current search text
  - `selectedDifficulties` - Array of selected difficulties
  - `selectedPatterns` - Array of selected patterns
  - `isPatternFilterOpen` - Collapsible state
  - `isAdding` - Form visibility
  - `newProblem` - Form input state

**Data Structures:**

```typescript
interface LeetCodeProblem {
  id: string;           // Problem ID (e.g., "1")
  title: string;        // Problem title
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;      // Algorithm pattern
  notes?: string;       // Optional user notes
}

type Difficulty = 'easy' | 'medium' | 'hard';
```

**Filter Logic:**
```
filteredProblems = problems
  .filter(bySearchQuery)      // AND with search
  .filter(byDifficulty)       // AND with difficulty (OR within)
  .filter(byPattern)          // AND with pattern (OR within)
```

#### Acceptance Criteria

**AC1: Search Functionality**
- [ ] Typing in search box filters problems in real-time (with 300ms debounce)
- [ ] Search is case-insensitive
- [ ] Search matches both title and ID
- [ ] Clear button appears only when search has text
- [ ] Clicking clear button empties search immediately

**AC2: Difficulty Filter**
- [ ] Each difficulty can be toggled independently
- [ ] Selected difficulties are visually highlighted
- [ ] Multiple difficulties can be selected simultaneously
- [ ] Deselecting all difficulties shows all problems
- [ ] Difficulty chips have proper ARIA attributes

**AC3: Pattern Filter**
- [ ] Collapsible shows/hides pattern options
- [ ] Pattern options appear in predictable order
- [ ] Selected patterns are highlighted
- [ ] Count badge shows number of selected patterns
- [ ] Selecting/deselecting patterns updates results immediately

**AC4: Filter Integration**
- [ ] Filters work together (AND logic between categories)
- [ ] Results count updates as filters change
- [ ] Clear Filters button resets all filters at once
- [ ] Empty state shows appropriate message

**AC5: Accessibility**
- [ ] Search input has accessible label
- [ ] Difficulty chips are keyboard navigable
- [ ] Pattern filter supports keyboard expansion
- [ ] All interactive elements have proper ARIA labels
- [ ] Color not the only indicator of selection

**AC6: User Experience**
- [ ] No visible lag when filtering (debounce works)
- [ ] Visual feedback for all interactions
- [ ] Responsive on mobile devices
- [ ] Consistent styling with theme colors

#### Success Metrics

1. **Search Latency:** <100ms filter calculation time
2. **Accessibility Score:** 95+ on Lighthouse accessibility
3. **User Satisfaction:** Ease of finding problems increases by 40%
4. **Coverage:** Search and filter available on all problem trackers
5. **Code Quality:** 100% TypeScript coverage, no linting errors

#### Dependencies

**Required:**
- React 18+
- TypeScript 5+
- Zustand (state management)
- Lucide React (icons)
- Tailwind CSS (styling)

**Optional:**
- Jest/React Testing Library (for unit tests)
- Lighthouse CI (for accessibility testing)

#### Implementation Timeline

**Phase 1 (Current): Search & Filter**
- Duration: 2 days
- Deliverables: useDebounce hook, filter UI, documentation
- Status: Complete (Features implemented)

**Phase 2 (Planned): Statistics & Analytics**
- Duration: 3-4 days
- Deliverables: Submission tracking, pattern difficulty matrix, export

**Phase 3 (Planned): Backend Sync**
- Duration: 5-7 days
- Deliverables: Cloud sync, collaborative features, mobile app

#### Risk Assessment

**Risk 1: Search Debounce Timing**
- Issue: 300ms might feel too slow for power users
- Mitigation: User preference setting for debounce (200-500ms)
- Probability: Low
- Impact: Medium

**Risk 2: Filter Performance**
- Issue: Large problem sets (500+) might have lag
- Mitigation: useMemo optimization, pagination for large lists
- Probability: Low
- Impact: Medium

**Risk 3: Mobile Usability**
- Issue: Many filters might overcrowd mobile UI
- Mitigation: Collapsible sections, horizontal scroll
- Probability: Medium
- Impact: High

#### Constraints

1. **Browser Support:** ES2020+, CSS custom properties required
2. **Data Persistence:** localStorage only (no backend available)
3. **Performance Budget:** Debounce minimum 300ms to prevent excessive recalculation
4. **Design System:** Must use existing Tailwind + CSS custom properties

## Rollout Plan

### Phase 1: Search & Filter (Current)
- Release: January 8, 2026
- Users: All free tier users (with 1 card/topic limit)
- Announcement: In-app notification and documentation

### Phase 2: Statistics (Planned)
- Release: Early February 2026
- Features: Success rate tracking, pattern analysis
- Users: Pro tier users first, then free tier

### Phase 3: Collaboration (Future)
- Release: March 2026
- Features: Share problem sets, study groups
- Users: All users with account system

## Success Criteria

- **Adoption:** 70% of active users use search/filter feature
- **Retention:** 30-day retention improves by 15%
- **Satisfaction:** 4.5+ stars on feedback survey
- **Performance:** <100ms filter calculation
- **Accessibility:** 100% WCAG 2.1 AA compliance

## Documentation Status

- [x] Codebase Summary - `/docs/codebase-summary.md`
- [x] Project Overview & PDR - `/docs/project-overview-pdr.md`
- [ ] Code Standards - `/docs/code-standards.md` (In Progress)
- [ ] System Architecture - `/docs/system-architecture.md` (In Progress)
- [ ] API Documentation - `/docs/api-docs.md` (Future)

## Questions & Open Items

- Should we add sorting options (by difficulty, date added)?
- Should pattern filter support AND logic instead of OR?
- Should we persist filter preferences to localStorage?
- Do we need accessibility testing tools (axe DevTools)?
- Should we implement Storybook for component documentation?

---

**Document Owner:** Development Team
**Approval Status:** In Review
**Next Review Date:** January 15, 2026
