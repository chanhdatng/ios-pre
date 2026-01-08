# iOS Prep Hub Documentation

Welcome to the iOS Prep Hub documentation hub. This directory contains comprehensive documentation for developers, contributors, and users.

## Quick Navigation

### For Developers

**Starting Out?**
1. Read [codebase-summary.md](./codebase-summary.md) - Get oriented with project structure
2. Review [code-standards.md](./code-standards.md) - Understand coding conventions
3. Study [system-architecture.md](./system-architecture.md) - Learn how components work together

**Building Features?**
1. Check [project-overview-pdr.md](./project-overview-pdr.md) - Understand product requirements
2. Review [code-standards.md](./code-standards.md) - Follow coding patterns
3. Reference specific feature guides (e.g., [leetcode-tracker-phase1.md](./leetcode-tracker-phase1.md))

**Working on Phase 1 (Search & Filter)?**
- Read [leetcode-tracker-phase1.md](./leetcode-tracker-phase1.md) - Complete feature guide
- Review implementation in `src/components/tracking/LeetCodeTracker.tsx`
- Check `src/lib/hooks/useDebounce.ts` for new hook

## Documentation Files

### Core Documentation

#### [codebase-summary.md](./codebase-summary.md)
**Purpose:** High-level overview of the project
**Audience:** New developers, project managers
**Contents:**
- Project vision and goals
- Technology stack
- Directory structure
- Feature overview
- Architecture decisions
- Setup instructions
- Common issues & troubleshooting

**Last Updated:** January 8, 2026

#### [project-overview-pdr.md](./project-overview-pdr.md)
**Purpose:** Product requirements and specifications
**Audience:** Product managers, developers, stakeholders
**Contents:**
- Feature requirements (functional & non-functional)
- Acceptance criteria
- Success metrics
- Implementation timeline
- Risk assessment
- Technical specifications

**Key Features Documented:**
- Phase 1: Search & Filter (COMPLETED)
- Phase 2: Statistics & Analytics (PLANNED)
- Phase 3: Backend Sync (PLANNED)

**Last Updated:** January 8, 2026

#### [code-standards.md](./code-standards.md)
**Purpose:** Coding guidelines and conventions
**Audience:** Developers, code reviewers
**Contents:**
- Directory structure guidelines
- Naming conventions (files, variables, functions, classes, CSS)
- TypeScript patterns and usage
- React component standards
- Zustand store patterns
- Styling standards (Tailwind, CSS custom properties)
- Accessibility standards (ARIA, semantic HTML)
- Error handling and performance optimization
- Testing patterns
- Pre-commit and PR review checklists

**Last Updated:** January 8, 2026

#### [system-architecture.md](./system-architecture.md)
**Purpose:** Technical architecture and design decisions
**Audience:** Architects, senior developers
**Contents:**
- Architecture overview with diagrams
- Technology stack and rationale
- Component hierarchy
- State management patterns
- Data models and types
- Performance optimization strategies
- Deployment architecture
- Security measures
- Scaling considerations
- Integration points

**Key Diagrams:**
- Client-side architecture
- Backend content pipeline
- Component hierarchy tree
- Data flow examples
- Search debounce flow
- Filter logic flowchart

**Last Updated:** January 8, 2026

#### [leetcode-tracker-phase1.md](./leetcode-tracker-phase1.md)
**Purpose:** Feature-specific implementation guide
**Audience:** Developers implementing/maintaining search & filter
**Contents:**
- Feature overview and status
- Implementation details for 5 features:
  1. Search input with 300ms debounce
  2. Difficulty filter (multi-select chips)
  3. Pattern filter (collapsible)
  4. Filter summary & clear button
  5. Filter logic (AND/OR combinations)
- useDebounce hook documentation
- Data types and interfaces
- Accessibility features (complete ARIA)
- Performance characteristics
- Testing recommendations
- Configuration options
- Troubleshooting guide
- Future enhancements roadmap

**Related Files:**
- `src/lib/hooks/useDebounce.ts` - New hook (18 lines)
- `src/components/tracking/LeetCodeTracker.tsx` - Enhanced component (402 lines)

**Last Updated:** January 8, 2026

## Documentation Structure

```
docs/
├── README.md                        (This file)
├── codebase-summary.md              Project overview & features
├── project-overview-pdr.md          Requirements & specifications
├── code-standards.md                Coding guidelines
├── system-architecture.md           Technical design
└── leetcode-tracker-phase1.md       Feature implementation guide

(Planned - Future additions)
├── api-docs.md                      API documentation
├── testing-guide.md                 Testing strategies
├── ci-cd.md                         GitHub Actions & automation
├── backend-integration.md           Phase 2 backend guide
└── deployment-guide.md              Deployment procedures
```

## Key Features

### Current Release (Phase 1)

**LeetCode Tracker Search & Filter**
- Search input with 300ms debounce (by title/ID)
- Multi-select difficulty filter (Easy/Medium/Hard)
- Collapsible pattern filter (14 patterns)
- Filter count display
- Clear filters button
- Full ARIA accessibility support

**Documentation Coverage:**
- [x] Feature specifications
- [x] Implementation details
- [x] Code examples
- [x] Accessibility guide
- [x] Troubleshooting
- [x] Testing recommendations

See [leetcode-tracker-phase1.md](./leetcode-tracker-phase1.md) for complete details.

### Upcoming (Phase 2)

- Advanced statistics (submission/solve rates)
- Problem history and revisions
- Pattern difficulty analysis
- Filter preference persistence

### Future (Phase 3+)

- Backend cloud sync
- Collaborative study groups
- Mobile app support
- Advanced analytics dashboard

## Common Tasks

### I want to add a new component

1. Read [code-standards.md](./code-standards.md#react-component-standards)
2. Follow directory structure from [code-standards.md](./code-standards.md#directory-structure)
3. Use naming conventions from [code-standards.md](./code-standards.md#naming-conventions)
4. Implement accessibility per [code-standards.md](./code-standards.md#accessibility-standards)

### I want to understand how search works

1. Start with [codebase-summary.md#leetcode-tracking](./codebase-summary.md)
2. See implementation details in [leetcode-tracker-phase1.md#search-input-with-debounce](./leetcode-tracker-phase1.md)
3. Check code in `src/components/tracking/LeetCodeTracker.tsx` (lines 202-222)
4. Review `src/lib/hooks/useDebounce.ts` for the hook implementation

### I want to modify the filter logic

1. Read [system-architecture.md#search--filter-architecture](./system-architecture.md)
2. Review [leetcode-tracker-phase1.md#filter-logic-implementation](./leetcode-tracker-phase1.md)
3. Check code in `src/components/tracking/LeetCodeTracker.tsx` (lines 64-86)
4. Update tests as needed

### I want to add a new pattern

1. Edit `src/components/tracking/LeetCodeTracker.tsx` lines 7-22 (PATTERNS array)
2. Update [project-overview-pdr.md](./project-overview-pdr.md) if changing requirements
3. Add to [leetcode-tracker-phase1.md](./leetcode-tracker-phase1.md#supported-patterns)

### I want to improve accessibility

1. Review [code-standards.md#accessibility-standards](./code-standards.md)
2. Check [leetcode-tracker-phase1.md#accessibility-features](./leetcode-tracker-phase1.md)
3. Reference [system-architecture.md#accessibility-architecture](./system-architecture.md)
4. Test with screen reader and keyboard navigation

## Contributing

When contributing code:

1. **Follow code standards** - See [code-standards.md](./code-standards.md)
2. **Update relevant docs** - When features change
3. **Add code examples** - Show how to use new features
4. **Document accessibility** - ARIA labels, keyboard support
5. **Include performance notes** - Optimization strategies used

### Pre-commit Checklist

- [ ] Code follows [code-standards.md](./code-standards.md) naming conventions
- [ ] TypeScript compiles without errors
- [ ] Accessibility features documented
- [ ] Related documentation updated
- [ ] Code examples added (if public API)
- [ ] No `console.log` or `debugger` statements

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **Build** | Astro 4+ |
| **UI** | React 18 |
| **Language** | TypeScript 5+ |
| **Styling** | Tailwind CSS 3+ |
| **State** | Zustand |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

For details, see [codebase-summary.md#key-technologies](./codebase-summary.md) and [system-architecture.md#technology-stack](./system-architecture.md).

## FAQ

**Q: Where do I find component examples?**
A: Check [code-standards.md#react-component-standards](./code-standards.md) for component structure and patterns.

**Q: How do I debug the search filter?**
A: See [leetcode-tracker-phase1.md#troubleshooting](./leetcode-tracker-phase1.md) for common issues and solutions.

**Q: Where are the performance benchmarks?**
A: Review [system-architecture.md#performance-optimization-strategies](./system-architecture.md) and [leetcode-tracker-phase1.md#performance-characteristics](./leetcode-tracker-phase1.md).

**Q: How do I make components accessible?**
A: Follow [code-standards.md#accessibility-standards](./code-standards.md) and review examples in [leetcode-tracker-phase1.md#accessibility-features](./leetcode-tracker-phase1.md).

**Q: What's the release schedule?**
A: See [project-overview-pdr.md#rollout-plan](./project-overview-pdr.md) for planned phases.

## Reporting Documentation Issues

Found unclear documentation, broken links, or outdated information?

1. **Check the issue list** - See open GitHub issues
2. **File an issue** - Include which document and what needs fixing
3. **Suggest improvements** - Documentation PRs welcome!

## Documentation Maintenance

Documentation is reviewed and updated:
- **Per release:** Before each feature release
- **Per quarter:** Quarterly refresh and accuracy check
- **Ad-hoc:** When major changes occur

Last comprehensive review: **January 8, 2026**

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 8, 2026 | Initial documentation for Phase 1 (Search & Filter) |

## Resources

- [Astro Documentation](https://docs.astro.build)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [WCAG 2.1 Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)

## License

All documentation is provided under the same license as the iOS Prep Hub project.

---

**Documentation Maintainer:** Development Team
**Last Updated:** January 8, 2026
**Status:** Current & Complete
