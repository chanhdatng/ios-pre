# Phase 2: Statistics & Charts

## Context
LeetCode Tracker chỉ hiển thị basic stats (count by difficulty). Cần visual charts để track progress over time, difficulty distribution, và pattern breakdown.

## Overview
Install Recharts, tạo 3 chart types: Line (progress over time), Pie (difficulty distribution), Bar (pattern breakdown). Thêm streak tracking và date picker cho solvedAt.

## Requirements
- **Recharts Installation**: ~40kb gzipped, works with Astro React islands
- **Progress Line Chart**: Problems solved per day/week over time
- **Difficulty Pie Chart**: Easy/Medium/Hard distribution
- **Pattern Bar Chart**: Horizontal bars showing problems per pattern
- **Streak Tracking**: Consecutive days with solved problems
- **Date Picker**: Allow setting solvedAt when adding problems (default: today)

## Architecture

### Dependencies
```bash
npm install recharts
```

### New Files
```
src/components/charts/LeetCodeCharts.tsx    # Recharts wrapper
```

### Modified Files
```
src/lib/stores/leetcode-store.ts            # Add getStreak, getProgressByDate
src/components/tracking/LeetCodeTracker.tsx # Integrate charts section
package.json                                # Add recharts
```

### Data Flow
```
Store (problems[]) → Computed Stats → Recharts Components → SVG Render
```

## Related Files
| File | Purpose | Lines |
|------|---------|-------|
| `StatisticsCharts.tsx` | Reference pattern (progress bars) | 137 |
| `LeetCodeTracker.tsx` | Target integration | 240 |
| `leetcode-store.ts` | Add computed getters | 79 |

## Implementation Steps

### Step 1: Install Recharts (5 min)
```bash
npm install recharts
```

### Step 2: Extend Store (30 min)
```typescript
// Add to leetcode-store.ts

interface LeetCodeState {
  // ... existing
  getProgressByDate: () => { date: string; count: number }[];
  getStreak: () => number;
}

// Inside create()
getProgressByDate: () => {
  const { problems } = get();
  const dateMap = new Map<string, number>();

  problems.forEach(p => {
    const date = p.solvedAt.split('T')[0]; // YYYY-MM-DD
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  // Sort by date, return last 30 days
  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
},

getStreak: () => {
  const { problems } = get();
  if (problems.length === 0) return 0;

  const dates = [...new Set(problems.map(p => p.solvedAt.split('T')[0]))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];

  // Must include today or yesterday to count
  if (dates[0] !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dates[0] !== yesterday) return 0;
  }

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i-1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
},
```

### Step 3: Create LeetCodeCharts Component (90 min)
```tsx
// src/components/charts/LeetCodeCharts.tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';
import { useLeetCodeStore } from '../../lib/stores/leetcode-store';

const DIFFICULTY_COLORS = {
  easy: 'var(--color-accent-green)',
  medium: 'var(--color-accent-orange)',
  hard: 'var(--color-accent-red)',
};

export function ProgressLineChart() {
  const data = useLeetCodeStore(s => s.getProgressByDate());

  if (data.length < 2) {
    return <p className="text-caption text-center py-8">Need at least 2 days of data</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-secondary)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(d) => d.slice(5)} // MM-DD
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)'
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-accent-orange)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-accent-orange)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DifficultyPieChart() {
  const stats = useLeetCodeStore(s => s.getStatsByDifficulty());
  const data = [
    { name: 'Easy', value: stats.easy, color: DIFFICULTY_COLORS.easy },
    { name: 'Medium', value: stats.medium, color: DIFFICULTY_COLORS.medium },
    { name: 'Hard', value: stats.hard, color: DIFFICULTY_COLORS.hard },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <p className="text-caption text-center py-8">No data yet</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PatternBarChart() {
  const patternStats = useLeetCodeStore(s => s.getStatsByPattern());
  const data = Object.entries(patternStats)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 patterns

  if (data.length === 0) {
    return <p className="text-caption text-center py-8">No data yet</p>;
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-secondary)" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="pattern"
            tick={{ fontSize: 11 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)'
            }}
          />
          <Bar dataKey="count" fill="var(--color-accent-blue)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StreakDisplay() {
  const streak = useLeetCodeStore(s => s.getStreak());

  return (
    <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-center">
      <p className="text-headline-1 text-[var(--color-accent-orange)]">{streak}</p>
      <p className="text-caption">Day Streak</p>
    </div>
  );
}
```

### Step 4: Add Date Picker to Form (30 min)
```tsx
// In LeetCodeTracker.tsx add form state
const [newProblem, setNewProblem] = useState({
  id: '',
  title: '',
  difficulty: 'medium' as LeetCodeProblem['difficulty'],
  pattern: 'Two Pointers',
  notes: '',
  solvedAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD default
});

// Modify addProblem to use custom date
addProblem: (problem) =>
  set((state) => ({
    problems: [
      ...state.problems,
      {
        ...problem,
        solvedAt: problem.solvedAt || new Date().toISOString()
      },
    ],
  })),

// Add date input to form
<input
  type="date"
  value={newProblem.solvedAt}
  onChange={(e) => setNewProblem({ ...newProblem, solvedAt: e.target.value })}
  max={new Date().toISOString().split('T')[0]}
  className="px-3 py-2 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)] text-body"
/>
```

### Step 5: Integrate Charts in Tracker (45 min)
```tsx
// In LeetCodeTracker.tsx
import { ProgressLineChart, DifficultyPieChart, PatternBarChart, StreakDisplay } from '../charts/LeetCodeCharts';

// Add charts section after stats grid
<div className="grid md:grid-cols-2 gap-4 mt-6">
  <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
    <h3 className="font-semibold mb-3 text-body">Progress Over Time</h3>
    <ProgressLineChart />
  </div>
  <div className="p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
    <h3 className="font-semibold mb-3 text-body">Difficulty Distribution</h3>
    <DifficultyPieChart />
  </div>
</div>

<div className="grid md:grid-cols-3 gap-4 mt-4">
  <div className="md:col-span-2 p-4 bg-[var(--color-surface-secondary)] rounded-[var(--radius-md)]">
    <h3 className="font-semibold mb-3 text-body">Top Patterns</h3>
    <PatternBarChart />
  </div>
  <StreakDisplay />
</div>
```

## Todo List
- [ ] Run `npm install recharts`
- [ ] Add `getProgressByDate()` to leetcode-store
- [ ] Add `getStreak()` to leetcode-store
- [ ] Create `LeetCodeCharts.tsx` with 4 chart components
- [ ] Add ProgressLineChart (last 30 days)
- [ ] Add DifficultyPieChart (donut style)
- [ ] Add PatternBarChart (horizontal, top 8)
- [ ] Add StreakDisplay component
- [ ] Add date picker input to add problem form
- [ ] Modify addProblem to accept custom solvedAt
- [ ] Integrate charts section in LeetCodeTracker
- [ ] Test responsive layout on mobile
- [ ] Verify Recharts works with client:load

## Success Criteria
- [ ] All 3 charts render correctly
- [ ] Line chart shows progress over time (min 2 data points)
- [ ] Pie chart shows difficulty distribution
- [ ] Bar chart shows top patterns
- [ ] Streak updates correctly
- [ ] Date picker allows setting past dates
- [ ] Charts responsive on mobile (stacked layout)
- [ ] No hydration errors in Astro

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Recharts bundle size | Low | Low | Tree-shaking, lazy load |
| SSR issues | Medium | Medium | Use client:load directive |
| Empty state charts | Low | Low | Handle in each component |
| Streak logic bugs | Medium | Low | Unit test streak calculation |

## Testing Checklist
- [ ] Charts render with sample data
- [ ] Line chart handles 1 day data (show message)
- [ ] Pie chart handles single difficulty
- [ ] Bar chart truncates to 8 patterns
- [ ] Streak calculation: consecutive days
- [ ] Streak resets if gap > 1 day
- [ ] Date picker max = today
- [ ] Charts adapt to container size
- [ ] Dark mode colors work (CSS variables)
