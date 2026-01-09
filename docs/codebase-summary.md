# iOS Prep Hub - Codebase Summary

**Last Updated:** January 9, 2026
**Project:** iOS Interview Preparation Platform
**Framework:** Astro + React + TypeScript
**Phase:** 2 (LeetCode Tracker Enhancement - Complete)

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

### 2. LeetCode Tracking (Phase 1 + Phase 2 Complete)
Comprehensive problem logging with advanced filtering and analytics.

**Phase 1 Features (Search & Filter):**
- Search input with 300ms debounce (by title/ID)
- Difficulty filter chips (Easy/Medium/Hard) - multi-select
- Pattern filter collapsible multi-select
- Filter count display
- Clear filters button
- Full ARIA accessibility support

**Phase 2 Features (Analytics & Charts):**
- Progress line chart (last 30 days of solved problems)
- Difficulty distribution doughnut chart (easy/medium/hard breakdown)
- Top patterns horizontal bar chart (8 most common patterns)
- Daily streak counter with flame icon
- Date picker for problem solve dates
- Problem log with pagination

**Key Components:**
- `LeetCodeTracker.tsx` - Main tracker with search, filters, charts section, date picker
- `LeetCodeCharts.tsx` (NEW) - 4 chart components:
  - `ProgressLineChart` - Line chart for progress over time (Chart.js)
  - `DifficultyPieChart` - Doughnut chart for difficulty distribution
  - `PatternBarChart` - Horizontal bar chart for top 8 patterns
  - `StreakDisplay` - Streak counter with visual indicator
- `useDebounce.ts` - Custom hook for debounced search
- `leetcode-store.ts` - Enhanced Zustand store

**Store Methods (New in Phase 2):**
- `getProgressByDate()` - Returns last 30 days grouped by date with counts
- `getStreak()` - Calculates consecutive days with problems solved

**Supported Patterns:**
- Two Pointers, Sliding Window, Binary Search, DFS, BFS
- Dynamic Programming, Backtracking, Hash Map, Stack, Heap
- Graph, Tree, Linked List, Other

**State Management:**
- `useLeetCodeStore()` - Zustand store with persistence
- Local filter state (search, difficulties, patterns - ephemeral)
- localStorage integration via Zustand middleware

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
- **Chart.js 4.5** - Data visualization library
- **react-chartjs-2 5.3** - React wrapper for Chart.js
- **Lucide React** - Icon library
- **date-fns 4.1** - Date manipulation utility

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

## Recent Changes (Phase 2: Analytics & Charts)

### Files Added
1. **src/components/charts/LeetCodeCharts.tsx** (NEW)
   - 4 exported chart components using Chart.js
   - ProgressLineChart: Line chart tracking problems/day over 30 days
   - DifficultyPieChart: Doughnut chart showing easy/medium/hard split
   - PatternBarChart: Horizontal bar chart of top 8 patterns by frequency
   - StreakDisplay: Flame icon counter for consecutive days with submissions
   - Responsive height containers (h-48) with fallback empty states

### Files Modified
1. **src/lib/stores/leetcode-store.ts**
   - Added `getProgressByDate()` method - groups problems by date, returns last 30 days
   - Added `getStreak()` method - calculates consecutive days including timezone awareness
   - Updated `addProblem` signature to accept optional `solvedAt` parameter with ISO string fallback
   - Added date utilities: `getLocalDateString()` helper, `MS_PER_DAY` constant

2. **src/components/tracking/LeetCodeTracker.tsx**
   - Added charts grid section (ProgressLineChart, DifficultyPieChart)
   - Added pattern/streak grid (PatternBarChart, StreakDisplay)
   - Added date picker in problem form (solvedAt field with max date validation)
   - Charts display above problem log for visual-first analytics

3. **package.json**
   - Added `chart.js@^4.5.1`
   - Added `react-chartjs-2@^5.3.1`

### Key Implementation Details
- Chart.js used for data visualization (alternative to Recharts for bundle size)
- Charts register components upfront for proper tree-shaking
- responsive: true and maintainAspectRatio: false on all charts
- Empty state messages when insufficient data (<2 days for line chart, 0 total for pie)
- Streak calculation accounts for timezone issues with local date strings
- All chart colors use CSS custom properties or hex values for theming consistency

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

**Phase 3 (Planned):**
- Backend integration for cloud sync
- Advanced analytics dashboard (export/import)
- Pattern difficulty analysis (by difficulty tier)
- Problem revision history and notes

**Phase 4+ (Planned):**
- LeetCode API integration for auto-syncing solved problems
- Custom difficulty scaling (user-defined problem levels)
- Interview prep templates and study plans
- Mobile app (React Native)

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

## Chart Configuration Details

### ProgressLineChart
- Displays 30-day rolling window of problems solved
- Orange color (#f97316) with light fill for visual depth
- Requires minimum 2 data points to render
- Labels show MM-DD format for conciseness
- Responsive: true, maintains aspect ratio: false

### DifficultyPieChart
- Doughnut chart (donut hole cutout: 60%)
- Green (easy), Orange (medium), Red (hard) colors
- Shows percentages in tooltips
- Legend positioned bottom with point style circles

### PatternBarChart
- Horizontal bar chart (indexAxis: y)
- Top 8 patterns by frequency
- Blue bars (#3b82f6) with rounded borders
- Sorted descending by count

### StreakDisplay
- Container-based layout (flex center)
- Flame icon changes color based on streak status
  - Orange: streak > 0
  - Tertiary gray: streak = 0
- Min height 100px to fill grid space

---

**Maintained by:** Development Team
**Last Review:** January 9, 2026
**Status:** Phase 2 Complete - Analytics & Charts Implementation
