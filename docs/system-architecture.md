# iOS Prep Hub - System Architecture

**Last Updated:** January 8, 2026
**Version:** 1.0
**Architecture Type:** Static Site Generation with Dynamic Islands

## Architecture Overview

iOS Prep Hub uses a hybrid architecture combining:
- **Astro** for static site generation and page routing
- **React** for interactive components (dynamic islands)
- **Zustand** for lightweight state management
- **localStorage** for client-side data persistence
- **Python Pipeline** for automated content generation

```
┌─────────────────────────────────────────────────────┐
│           User Browser (Client)                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Astro      │         │   React      │         │
│  │   Pages      │────────▶│ Components   │         │
│  │ (Static HTML)│         │(Dynamic      │         │
│  │              │         │ Islands)     │         │
│  └──────────────┘         └──────────────┘         │
│         │                       │                   │
│         └───────────┬───────────┘                   │
│                     ▼                               │
│         ┌──────────────────────┐                    │
│         │   Zustand Store      │                    │
│         │   (State Management) │                    │
│         └──────────────────────┘                    │
│                     │                               │
│                     ▼                               │
│         ┌──────────────────────┐                    │
│         │   localStorage       │                    │
│         │ (Data Persistence)   │                    │
│         └──────────────────────┘                    │
│                                                     │
└─────────────────────────────────────────────────────┘
                      △
                      │
                      │ (Static Assets)
                      │
        ┌─────────────────────────┐
        │   Vercel / Static Host  │
        │ (Deployment Platform)   │
        └─────────────────────────┘


Backend Content Pipeline (Development Only):
┌──────────────────────────────────────────────────────┐
│        Python Content Generation Pipeline            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐    ┌──────────────┐              │
│  │   Scrapers   │───▶│  Embeddings  │              │
│  │ (Apple Docs, │    │ (Semantic    │              │
│  │  Kodeco,     │    │  Search)     │              │
│  │  objc.io)    │    └──────────────┘              │
│  └──────────────┘              │                    │
│         │                       ▼                    │
│         │          ┌──────────────────┐             │
│         └─────────▶│  Generation      │             │
│                    │  (AI Flashcards) │             │
│                    └──────────────────┘             │
│                           │                         │
│                           ▼                         │
│         ┌──────────────────────────┐               │
│         │  Verification            │               │
│         │  (Quality, Duplicates)   │               │
│         └──────────────────────────┘               │
│                           │                         │
│                           ▼                         │
│         ┌──────────────────────────┐               │
│         │  Generated Flashcards    │               │
│         │  (JSON files)            │               │
│         └──────────────────────────┘               │
│                           │                         │
└───────────────────────────┼──────────────────────────┘
                            │
                            ▼
                ┌─────────────────────┐
                │  Git Repository     │
                │ (Content committed) │
                └─────────────────────┘
```

## Technology Stack

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Build Tool** | Astro 4+ | Static generation, file-based routing |
| **UI Framework** | React 18 | Interactive components |
| **Language** | TypeScript 5+ | Type safety |
| **Styling** | Tailwind CSS 3+ | Utility-first CSS |
| **State Mgmt** | Zustand | Lightweight state |
| **Icons** | Lucide React | SVG icon library |
| **Notifications** | Custom Toast | In-app notifications |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Language** | Python 3.9+ | Content pipeline |
| **Scrapers** | BeautifulSoup, requests | Web content extraction |
| **Embeddings** | ChromaDB, OpenAI/Gemini | Vector database & embeddings |
| **Verification** | Custom modules | Quality assurance |
| **CI/CD** | GitHub Actions | Automated workflows |

### Data Storage

| Storage | Purpose | Format |
|---------|---------|--------|
| **localStorage** | User problems, progress | JSON |
| **JSON Files** | Flashcards | Static files |
| **Git Repository** | Version control | Source of truth |

### Deployment

| Platform | Purpose |
|----------|---------|
| **Vercel** | Primary hosting (serverless) |
| **Static Hosts** | Alternative (GitHub Pages, etc.) |

## Component Architecture

### Page Structure (Astro)

```
src/pages/
├── index.astro              # Home page
├── leetcode-tracker.astro   # Problem tracker page
├── flashcards.astro         # Flashcard learning page
├── quizzes.astro            # Quiz runner page
└── settings.astro           # User settings page
```

Each page is a static Astro component that:
1. Hydrates interactive React components
2. Passes initial data to components
3. Handles server-side rendering concerns

### Component Hierarchy

```
BaseLayout
├── Header
│   ├── ThemeToggle
│   └── Navigation
├── Sidebar
│   └── NavigationLinks
└── Content Area
    └── Page-specific components
        ├── LeetCodeTracker
        │   ├── SearchInput
        │   ├── DifficultyFilter
        │   ├── PatternFilter
        │   ├── FilterSummary
        │   ├── ProblemList
        │   └── AddProblemForm
        │
        ├── FlashcardDeck
        │   ├── FlashcardCard
        │   ├── ProgressBar
        │   └── Controls
        │
        └── QuizRunner
            ├── Question
            ├── AnswerOptions
            └── Results
```

### Component Types

**Layout Components (Astro)**
- `BaseLayout.astro` - Main page wrapper
- `Header.astro` - Top navigation
- `Sidebar.astro` - Side navigation
- `MobileNav.tsx` - Mobile menu

**Interactive Components (React)**
- `LeetCodeTracker.tsx` - Problem tracking with filters
- `FlashcardDeck.tsx` - Flashcard learning
- `QuizRunner.tsx` - Quiz interface
- `SpacedReview.tsx` - Spaced repetition
- `ReviewWithSearch.tsx` - Searchable review

**UI Components (React)**
- `ThemeToggle.tsx` - Dark/light mode switch
- `Toast.tsx` - Notification system

**Content Components (Astro)**
- `MarkdownRenderer.tsx` - Markdown to HTML
- `YoutubeEmbed.astro` - YouTube embeds
- `ResourceLink.astro` - External resource links
- `InterviewQuestion.astro` - Question formatting

## State Management Architecture

### Zustand Stores

```typescript
// Global stores
├── useLeetCodeStore         // Problem tracking state
├── useFlashcardStore        // Flashcard progress
├── useUserStore             // User preferences (planned)
└── useSettingsStore         // App settings (planned)
```

### Store Pattern

```
Store Creation
    │
    ├─ Initial State
    ├─ Actions (mutations)
    │   ├─ Add/Remove items
    │   ├─ Update state
    │   └─ Get computed values
    └─ localStorage middleware
       └─ Auto-save to localStorage

Component Usage
    │
    ├─ const { state, action } = useStore()
    ├─ Component renders with state
    └─ User interaction → action() → state updates → re-render
```

### Data Flow Example: Adding a Problem

```
User Input
    │
    ▼
LeetCodeTracker Component
    │
    ├─ Validate input
    │
    ▼
handleAddProblem()
    │
    ├─ Check duplicate
    │
    ▼
useLeetCodeStore.addProblem()
    │
    ├─ Zustand updates state
    │
    ▼
localStorage middleware
    │
    ├─ Serializes to JSON
    │
    ▼
localStorage.setItem()
    │
    ├─ Browser saves data
    │
    ▼
Component re-renders
    │
    ▼
Toast notification
    │
    └─ "Problem added #1"
```

## Data Models

### LeetCodeProblem

```typescript
interface LeetCodeProblem {
  id: string;                      // "1", "2", etc.
  title: string;                   // "Two Sum", "Reverse Integer"
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;                 // Algorithm pattern
  notes?: string;                  // User notes (optional)
  dateAdded?: number;              // Timestamp (optional)
  attempts?: number;               // Number of attempts (optional)
}
```

### Flashcard

```typescript
interface Flashcard {
  id: string;
  front: string;                   // Question
  back: string;                    // Answer
  category: string;                // Topic
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  source?: string;
}
```

### Statistics

```typescript
interface DifficultyStats {
  easy: number;
  medium: number;
  hard: number;
}

interface PatternStats {
  [pattern: string]: number;       // "Two Pointers": 5
}
```

## Search & Filter Architecture (Phase 1)

### Search Flow

```
User Types "search query"
    │
    ▼
setSearchQuery(value)
    │
    ▼
useDebounce hook (300ms)
    │
    ├─ Waits 300ms for no more input
    │
    ▼
debouncedQuery updates
    │
    ▼
useMemo recalculates filters
    │
    ├─ Filter by debounced search
    ├─ Filter by selected difficulties
    ├─ Filter by selected patterns
    │
    ▼
filteredProblems array updates
    │
    ▼
Component re-renders with results
    │
    └─ Display matching problems
```

### Filter Logic

```typescript
// All filters combined with AND logic
filteredProblems = problems
  .filter((p) => {
    // Search filter
    if (debouncedQuery) {
      const matches =
        p.title.includes(query) ||
        p.id.includes(query);
      if (!matches) return false;
    }

    // Difficulty filter (OR within category)
    if (selectedDifficulties.length > 0) {
      if (!selectedDifficulties.includes(p.difficulty)) {
        return false;
      }
    }

    // Pattern filter (OR within category)
    if (selectedPatterns.length > 0) {
      if (!selectedPatterns.includes(p.pattern)) {
        return false;
      }
    }

    return true;
  });
```

## Performance Optimization Strategies

### 1. Debouncing

```typescript
// Search with 300ms debounce
const debouncedQuery = useDebounce(searchQuery, 300);

// Benefits:
// - Reduces filter recalculations
// - Prevents excessive re-renders
// - Improves perceived performance
```

### 2. Memoization

```typescript
// Memoize expensive filter calculations
const filteredProblems = useMemo(() => {
  // Complex filter logic
}, [problems, debouncedQuery, selectedDifficulties, selectedPatterns]);

// Benefits:
// - Only recalculates when dependencies change
// - Prevents unnecessary re-renders
// - Scales well to 100+ problems
```

### 3. Lazy Loading (Future)

```typescript
// Lazy load components
const FlashcardDeck = lazy(() => import('./FlashcardDeck'));

// Benefits:
// - Reduce initial bundle size
// - Load components on demand
// - Improve Time to Interactive (TTI)
```

### 4. Code Splitting

Astro automatically code-splits per route. React components hydrated only on relevant pages.

## Accessibility Architecture

### ARIA Implementation

```
├─ Semantic HTML
│  ├─ <button>, <input>, <a>
│  └─ Built-in accessibility
│
├─ ARIA Labels
│  ├─ aria-label for unlabeled elements
│  ├─ aria-pressed for toggles
│  └─ aria-expanded for collapsibles
│
├─ Role Attributes
│  ├─ role="group" for filter groups
│  ├─ role="region" for main content
│  └─ role="navigation" for nav
│
└─ Keyboard Navigation
   ├─ Tab order managed by browser
   ├─ Enter/Space for buttons
   └─ Arrow keys for lists (custom)
```

### Color Accessibility

```typescript
// Not relying on color alone
const DifficultyChip = ({ difficulty, selected }: Props) => (
  <button
    className={selected ? 'bg-red-500' : 'bg-gray-200'}
    aria-pressed={selected}  // Always indicate state with ARIA
  >
    {difficulty.toUpperCase()}  // Text label reinforces meaning
  </button>
);
```

## Deployment Architecture

### Build Pipeline

```
Source Code (GitHub)
    │
    ▼
npm run build
    │
    ├─ Astro processes .astro files
    ├─ React components bundled
    ├─ Tailwind CSS compiled
    ├─ JavaScript minified
    │
    ▼
dist/ directory created
    │
    ├─ index.html (static)
    ├─ _astro/ (bundles)
    └─ assets/ (optimized)
    │
    ▼
Deployed to Vercel
    │
    └─ Available at https://ios-prep-hub.vercel.app
```

### Environment Configuration

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://ios-prep-hub.vercel.app',
  base: '/',  // Root path
  integrations: [
    react(),
    tailwind(),
  ],
});
```

## Security Architecture

### Security Measures

1. **No Backend Exposure**
   - All data stored locally
   - No API calls to external services
   - User data never leaves browser (until cloud sync)

2. **localStorage Security**
   - Data cleared on browser cache clear
   - No sensitive passwords stored
   - HTTPS enforced in production

3. **External Links**
   - All external links use `target="_blank"`
   - Includes `rel="noopener noreferrer"`
   - Prevents window.opener attacks

4. **Content Validation**
   - Input sanitization on forms
   - Type checking with TypeScript
   - No eval() or innerHTML

## Scaling Considerations

### Current Capacity

- **Problems per user:** 1000+ (localStorage limit ~10MB)
- **Flashcards:** 500+ decks (lazy loaded)
- **Users:** Unlimited (no backend)

### Scaling Strategies

**Phase 1 (Current):**
- Client-side only
- localStorage for persistence

**Phase 2 (Planned):**
- Backend API for cloud sync
- Database (PostgreSQL)
- User authentication (JWT/OAuth)

**Phase 3 (Planned):**
- Microservices architecture
- Redis for caching
- CDN for static assets
- Mobile app (React Native)

## Monitoring & Observability (Future)

### Planned Metrics

```
Frontend Metrics
├─ Page Load Time (TTI)
├─ Time to First Contentful Paint (FCP)
├─ Cumulative Layout Shift (CLS)
├─ Search Filter Latency
└─ User Interaction Latency

Backend Metrics
├─ Content Pipeline Duration
├─ Scraper Success Rates
├─ Embedding Quality
└─ Duplicate Detection Accuracy
```

## Disaster Recovery

### Data Backup

1. **Git Repository**
   - Flashcard JSON files version controlled
   - Daily GitHub Actions backup

2. **User Data (localStorage)**
   - Export functionality (planned)
   - User can export/import problems

## Integration Points

### Python Pipeline Integration

```
Python Pipeline → Generate JSON
    │
    ▼
Commit to Git
    │
    ▼
GitHub Actions Workflow
    │
    ├─ Runs daily
    ├─ Executes pipeline/main.py
    ├─ Commits generated files
    │
    ▼
Web App Deployed
    │
    ├─ Vercel detects push
    ├─ Triggers build
    ├─ Deploys new content
    │
    └─ Users see updated flashcards
```

## Technology Decisions & Rationale

| Decision | Technology | Rationale |
|----------|-----------|-----------|
| **Build Tool** | Astro | Static-first, React integration, fast |
| **UI Framework** | React | Popular, large ecosystem, TSX support |
| **State Mgmt** | Zustand | Minimal, fast, TypeScript support |
| **Styling** | Tailwind | Utility-first, rapid development, theming |
| **Persistence** | localStorage | No backend needed, user owns data |
| **Content Gen** | Python | Mature libraries, ML integration ready |
| **Deployment** | Vercel | Optimized for Next.js/Astro, free tier |

## Future Architecture Evolution

### Phase 2: Backend Integration

```
Browser ←→ API Server ←→ Database
    ↓           ↓            ↓
localStorage  Redis    PostgreSQL
              Cache    Persistence
```

### Phase 3: Microservices

```
API Gateway
├─ User Service
├─ Problem Service
├─ Flashcard Service
├─ Analytics Service
└─ Notification Service
```

---

**Last Updated:** January 8, 2026
**Maintained by:** Development Team
**Version:** 1.0
