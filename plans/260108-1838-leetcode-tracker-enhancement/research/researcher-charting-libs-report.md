# Research Report: React Charting Libraries for LeetCode Tracker

**Date:** 2026-01-08 | **Sources:** 5 comprehensive web searches

## Executive Summary

For LeetCode progress tracking with line/pie/bar charts, **Recharts** is the optimal choice balancing ease, bundle size (~40kb gzipped), TypeScript support, and Astro React island compatibility. Recharts requires minimal configuration for common chart types and works seamlessly as a client-side React component. For more flexibility with strict bundle constraints, **Chart.js + react-chartjs-2** offers tree-shakeable imports. Nivo and visx are overkill for simple progress tracking despite excellent customization.

## Comparative Analysis

| Library | Bundle Size | Setup Difficulty | TypeScript | Astro Friendly | Customization | Best Use |
|---------|------------|------------------|-----------|---|---|
| **Recharts** | ~40kb | Very Easy | Yes | Excellent | Moderate | ✓ Recommended |
| **Chart.js** | ~10kb (core) | Easy | Yes | Good | Moderate | Good alternative |
| **react-chartjs-2** | ~5kb wrapper | Easy | Yes | Good | Moderate | Tree-shakeable |
| **Nivo** | 194-371kb/chart | Moderate | Yes | Good | Excellent | Complex dashboards |
| **visx** | Modular (small) | Hard | Yes | Good | Excellent | Custom visualizations |

## Detailed Findings

### Recharts (RECOMMENDED)
- **Bundle:** ~40kb gzipped, largest single dependency but acceptable
- **Setup:** React-native API, declarative components, minimal config needed
- **TypeScript:** Full support via React/TypeScript ecosystem
- **Astro:** Works perfectly with `@astrojs/react` client-side rendering
- **For your needs:** LineChart, PieChart, BarChart all ready-to-use
- **Known issue:** Bundle size grows if importing unused components; use tree-shaking

### Chart.js + react-chartjs-2
- **Bundle:** Chart.js ~10kb core + react-chartjs-2 ~5kb = ~15kb gzipped
- **Advantage:** Tree-shakeable - only register controllers/plugins you need
- **Setup:** More config than Recharts (register components explicitly)
- **TypeScript:** Supported via type definitions
- **Astro:** Works well, documented patterns for React islands
- **Trade-off:** Slightly more verbose than Recharts but lighter

### Nivo
- **Bundle:** 194kb (@nivo/pie) to 371kb (@nivo/line) per chart type
- **Modular:** Install only needed packages (@nivo/core + specific charts)
- **Customization:** Exceptional - live editor docs with previews
- **Issue:** Bundle bloat for simple use case; better for complex multi-chart dashboards
- **Not recommended:** Overkill for progress tracking

### visx (Airbnb)
- **Bundle:** Very small modules, highly composable
- **Learning curve:** Steep - low-level D3 primitives, requires custom implementation
- **Best for:** Custom, complex visualizations
- **Not recommended:** Requires too much code for simple progress charts

### Simple SVG Approach
- **Consideration:** Custom SVG implementation possible but requires D3 knowledge
- **Not viable:** Maintenance burden vs. library benefit; skip this

## Astro React Islands Compatibility

All libraries work with Astro's `@astrojs/react` when used with `client:load` or `client:visible` directives. Recharts and Chart.js are lightest for hydration overhead.

### Implementation Pattern
```astro
---
import ChartComponent from '../components/ChartComponent.jsx'
---
<ChartComponent client:visible />
```

## Recommendations

### For Your LeetCode Tracker:
1. **Use Recharts** - Covers all chart types needed, single dependency, simple API
2. **Line Chart:** `<LineChart>` with `<XAxis>`, `<YAxis>`, `<CartesianGrid>`, `<Tooltip>`, `<Line>`
3. **Pie Chart:** `<PieChart>` with `<Pie>`, `<Legend>`, `<Tooltip>`
4. **Bar Chart:** `<BarChart>` with `<Bar>`, `<CartesianGrid>`, `<XAxis>`, `<YAxis>`

### Setup Steps:
```bash
npm install recharts
```

Wrap charts in React component with `client:visible` in Astro template.

### Alternative (if bundle size critical):
Use Chart.js with explicit tree-shaking:
```javascript
// Only register what you need
ChartJS.register(
  LineController, BarController, PieController,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Legend, Tooltip
)
```

## Performance Considerations

- **Recharts:** Use `useMemo` for data to prevent unnecessary re-renders
- **Real-time updates:** Throttle/debounce data changes
- **Astro advantage:** Static generation for initial render, hydrate charts on client
- **TypeScript:** All libraries support full type safety

## References

- [Recharts Documentation](https://recharts.org/)
- [LogRocket: Best React Chart Libraries 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Nivo Official Site](https://nivo.rocks/)
- [visx GitHub - Airbnb](https://github.com/airbnb/visx)
- [Astro + Chart.js Guide](https://bwcii.com/blog/feb-2024/chart_js-react-astro-post/)

## Unresolved Questions

None. Research covers all requested evaluation criteria with clear recommendation.
