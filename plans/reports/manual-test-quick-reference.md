# Quick Reference: Manual Testing Guide
## LeetCode Tracker Phase 1 - Search & Filter

---

## Setup (5 minutes)

Add test data with variety:
```
- 2x Easy problems (Two Pointers, Tree)
- 2x Medium problems (DP, Tree)
- 2x Hard problems (Graph, Backtracking)
Total: 6+ problems for complete testing
```

---

## Test Cases at a Glance

| # | Test | Pass Criteria | Time |
|---|------|-----------------|------|
| 1 | Search by Title | "Two" finds "Two Sum" only | 2 min |
| 2 | Search by ID | Type "1" finds only problem #1 | 2 min |
| 3 | Single Difficulty | Click "Easy" → shows only Easy | 2 min |
| 4 | Multiple Difficulty | Click "Easy" + "Medium" → OR logic | 2 min |
| 5 | Pattern Filter | Select patterns → OR logic works | 3 min |
| 6 | Combined Filters | Search + Difficulty + Pattern AND together | 3 min |
| 7 | Clear Filters | Button resets everything | 2 min |
| 8 | Empty States | Correct message for "no data" vs "no match" | 2 min |
| 9 | Mobile Touch | All chips 44px+, touch-friendly | 3 min |
| 10 | Performance | Debounce works (wait 300ms to filter) | 2 min |

**Total: ~25 minutes**

---

## Critical Checks

**MUST PASS:**
- [ ] Search filters work (title + ID)
- [ ] Filters combine with AND logic
- [ ] Clear filters button resets all
- [ ] Count display accurate ("X of Y")
- [ ] No console errors
- [ ] Empty states show correct messages

---

## Quick Test Flow (10 minutes)

### 1. Search Test
```
Input: "Two"
Wait 300ms
Expected: "Two Sum" visible, others hidden
```

### 2. Filter Test
```
Click: Easy + Medium + Two Pointers
Expected: Only problems matching ALL three criteria
Clear filters
Expected: All problems visible
```

### 3. Empty State Test
```
Search: "XYZABC" (no match)
Expected: "No problems match your filters."
```

---

## Debugging Tips

**Filter not working?**
- Check browser DevTools Console (no JS errors)
- Verify data has correct `difficulty` and `pattern` fields
- Debounce delay: Wait 300ms after typing stops

**Styling issue?**
- Check Tailwind CSS is loading
- Verify custom CSS variables (--color-accent-*) defined

**Performance slow?**
- Open React Profiler
- Check useMemo dependencies
- Should NOT re-filter on every keystroke

---

## Browser/Device Testing

Minimum:
- [ ] Chrome Desktop (1920x1080)
- [ ] Chrome Mobile (375x667)
- [ ] Safari (if available)

---

## Verification Commands

```bash
# Rebuild if needed
npm run build

# Check TypeScript (if configured)
npm run astro -- check

# Preview locally
npm run preview
# Then navigate to http://localhost:3000/leetcode/
```

---

## Expected Behavior Summary

| Feature | Input | Output | Logic |
|---------|-------|--------|-------|
| Search | "Two" | "Two Sum" | Title OR ID contains search (case-insensitive) |
| Difficulty | Easy, Medium | Easy OR Medium problems | OR within difficulty |
| Pattern | Two Pointers, Tree | Two Pointers OR Tree | OR within pattern |
| Combined | All above | Intersection | AND between filter types |
| Clear | Click button | All visible | Reset all states |
| Count | Any filter | "X of Y" | Live update |

---

## Pass/Fail Criteria

**PASS if:**
- ✅ All 8 test cases succeed
- ✅ No console errors
- ✅ Mobile touch works
- ✅ Empty states correct
- ✅ Clear filters works

**FAIL if:**
- ❌ Any filter doesn't work
- ❌ Console has JS errors
- ❌ Count display wrong
- ❌ Filters don't combine correctly
- ❌ Mobile untouchable

---

## Sign-Off

When all tests pass:

```
✅ Phase 1: Search & Filter - APPROVED FOR DEPLOYMENT
```

---

**Report:** Full details in `tester-260108-1911-search-filter-phase-1.md`
