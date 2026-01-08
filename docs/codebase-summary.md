# iOS Prep Hub - Codebase Summary

**Last Updated:** January 8, 2026
**Project:** iOS Interview Preparation Platform
**Framework:** Astro + React + TypeScript

## Overview

iOS Prep Hub is a comprehensive interview preparation platform built with Astro and React. It provides interactive flashcards, LeetCode tracking, quiz systems, and curated iOS interview content.

## Key Statistics

- **Total Files:** 148
- **Total Tokens:** ~278K
- **Primary Language:** TypeScript/React
- **Static Site Generator:** Astro
- **Styling:** Tailwind CSS
- **Database:** Zustand (state management) + localStorage

## Project Structure

```
ios-prep-hub/
├── src/
│   ├── components/          # Reusable React/Astro components
│   │   ├── layout/          # Page layout components (BaseLayout, Header, Sidebar)
│   │   ├── ui/              # UI primitives (Toast, ThemeToggle)
│   │   ├── content/         # Content rendering (MarkdownRenderer, YoutubeEmbed)
│   │   ├── interactive/     # Interactive features (FlashcardDeck, QuizRunner, SpacedReview)
│   │   ├── tracking/        # LeetCode tracking (LeetCodeTracker, StatisticsCharts)
│   │   └── settings/        # Settings/configuration (DataManager)
│   ├── lib/
│   │   ├── hooks/           # Reusable React hooks (useDebounce)
│   │   ├── stores/          # Zustand state stores
│   │   └── utils/           # Utility functions
│   ├── data/
│   │   └── flashcards/      # Flashcard collections (JSON)
│   ├── pages/               # Astro pages (routing)
│   ├── styles/              # Global CSS
│   └── content/             # Markdown content
├── pipeline/                # Content generation pipeline
│   ├── scrapers/            # Web scrapers for content
│   ├── embeddings/          # Embedding & indexing
│   ├── generation/          # Flashcard generation
│   └── verification/        # Content verification
├── public/                  # Static assets
└── docs/                    # Documentation
```

## Core Features

### 1. Flashcard System
- Multiple flashcard decks (iOS Core, UIKit, Data Persistence, etc.)
- Spaced repetition review system
- Progress tracking per deck
- JSON-based flashcard storage

**Key Components:**
- `FlashcardDeck.tsx` - Card rendering and interaction
- `SpacedReview.tsx` - Spaced repetition algorithm
- `ReviewWithSearch.tsx` - Search within flashcards

**Files:**
- `src/data/flashcards/*.json` - Flashcard data

### 2. LeetCode Tracking (NEW: Phase 1 - Search & Filter)
Comprehensive problem logging with advanced filtering capabilities.

**New Features (v1):**
- Search input with 300ms debounce (by title/ID)
- Difficulty filter chips (Easy/Medium/Hard) - multi-select
- Pattern filter collapsible multi-select
- Filter count display
- Clear filters button
- Full ARIA accessibility support

**Key Components:**
- `LeetCodeTracker.tsx` - Main tracker component with search/filter
- `useDebounce.ts` - Custom hook for debounced search
- `StatisticsCharts.tsx` - Statistics visualization

**Supported Patterns:**
- Two Pointers, Sliding Window, Binary Search, DFS, BFS
- Dynamic Programming, Backtracking, Hash Map, Stack, Heap
- Graph, Tree, Linked List, Other

**State Management:**
- `useLeetCodeStore()` - Zustand store for problems
- Local filter state (search, difficulties, patterns)

### 3. Quiz & Assessment
- `QuizRunner.tsx` - Interactive quiz interface
- Multiple question types
- Score tracking and feedback

### 4. Interactive Content
- YouTube embed support
- Resource links
- Interview question formatting
- Note editor for annotations

### 5. UI/UX Features
- Theme toggle (light/dark mode)
- Toast notifications
- Mobile-responsive design
- ARIA accessibility support

## Key Technologies

### Frontend Stack
- **Astro 4+** - Static site generation with dynamic islands
- **React 18** - UI component library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **Lucide React** - Icon library

### Styling System
- CSS custom properties for theming
- Color palette: accent colors (green, orange, red, blue)
- Border radius and spacing system
- Responsive breakpoints (sm: 640px)

### Data Management
- **localStorage** - Client-side data persistence
- **JSON files** - Flashcard storage
- **Python pipeline** - Content generation and verification

## Development Environment

### Required Tools
- Node.js 18+
- npm
- Python 3.9+ (for content pipeline)

### Setup Commands
```bash
npm install              # Install dependencies
npm run dev             # Start dev server (localhost:4321)
npm run build           # Production build
npm run preview         # Preview production build
```

### Architecture Decisions

1. **Astro + React Hybrid:** Astro for static content, React for interactive features
2. **Zustand for State:** Minimal, performant state management
3. **localStorage:** Simple, friction-free data persistence (no backend needed)
4. **CSS Custom Properties:** Easy theme switching without recompilation
5. **Debouncing:** 300ms debounce on search to optimize filter performance

## Code Standards

### Component Organization
- Components follow feature-based directory structure
- Props are TypeScript-typed
- Hooks extract reusable logic
- Astro components (.astro) for layout, React (.tsx) for interactivity

### Naming Conventions
- camelCase for functions, variables, props
- PascalCase for React components
- lowercase for HTML attributes
- dash-separated for CSS classes

### State Management Pattern
- Zustand stores in `src/lib/stores/`
- Local component state for ephemeral UI state
- localStorage integration for persistence

### Accessibility
- ARIA labels on interactive elements
- Semantic HTML (buttons, labels, roles)
- Keyboard navigation support
- Color contrast compliance

## Content Pipeline

### Python-Based Generation
- **Scrapers:** Extract content from Apple Docs, Kodeco, objc.io, SwiftLee
- **Embeddings:** Convert content to embeddings for RAG
- **Generation:** Create flashcards from extracted content
- **Verification:** Duplicate detection, link validation, quality filtering
- **GitHub Actions:** Automated daily content generation

## Recent Changes (Phase 1: LeetCode Tracker)

### Files Modified
1. **src/lib/hooks/useDebounce.ts** (NEW)
   - Generic debounce hook with configurable delay
   - Default 300ms debounce
   - Cleanup on unmount

2. **src/components/tracking/LeetCodeTracker.tsx** (MODIFIED)
   - Added search input with debounce
   - Multi-select difficulty filter (chips)
   - Collapsible pattern filter with count badge
   - Filter summary and clear button
   - Enhanced ARIA labels

### Key Implementation Details
- Search filters by title or problem ID (case-insensitive)
- Filters use OR logic within category, AND between categories
- useMemo optimizes filtered results
- Local ephemeral state for filters (not persisted)
- Icons from lucide-react

## Testing Strategy

### Current Coverage
- Manual testing for interactive features
- No automated test suite currently

### Future Recommendations
- Unit tests for hooks (useDebounce, useLeetCodeStore)
- Component tests for tracker filters
- Integration tests for flashcard flow
- E2E tests for core user journeys

## Performance Considerations

1. **Search Debouncing:** 300ms delay prevents excessive filter recalculations
2. **useMemo:** Prevents filter recalculation on every render
3. **Lazy Loading:** Components with React's lazy() for large features
4. **localStorage:** Eliminates backend latency for persistence

## Security Notes

- No backend exposure to browser state
- localStorage used only for user-generated data
- External links use target="_blank" with rel="noopener noreferrer"
- No sensitive data stored in localStorage

## Future Enhancement Roadmap

**Phase 2 (Planned):**
- Advanced statistics (submission/solve rates)
- Problem history and revisions
- Pattern difficulty analysis

**Phase 3 (Planned):**
- Backend integration for cloud sync
- Advanced analytics dashboard
- Export/import functionality

## Deployment

- **Primary:** Vercel (serverless Next.js/Static hosting)
- **Static:** Can be deployed to any static host
- **Base Path:** Root (`/`) - configured for Vercel

## Troubleshooting

### Common Issues

**1. Search not filtering immediately**
- Expected: 300ms debounce on search input
- Check: Ensure useDebounce hook is applied to search state

**2. Filters not persisting across refreshes**
- Expected: Filters are ephemeral (local state only)
- To persist: Move filter state to Zustand store

**3. Theme toggle not working**
- Check: CSS custom properties loaded in global.css
- Verify: Browser supports CSS custom properties

## Additional Resources

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Tailwind CSS Docs](https://tailwindcss.com)

---

**Maintained by:** Development Team
**Last Review:** January 8, 2026
