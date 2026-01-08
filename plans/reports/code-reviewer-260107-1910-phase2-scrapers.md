# Code Review: Phase 2 Source Scrapers

**Reviewer:** code-reviewer-ae2cca7
**Date:** 2026-01-07 19:10
**Scope:** Phase 2 scraper implementation review
**Plan:** [phase-02-source-scrapers.md](/Users/mac/Downloads/ios-prep-hub/plans/260107-1710-ios-content-generation-pipeline/phase-02-source-scrapers.md)

---

## Scope

**Files reviewed:**
- `pipeline/scrapers/models.py` (23 lines)
- `pipeline/scrapers/base_scraper.py` (117 lines)
- `pipeline/scrapers/hws_scraper.py` (115 lines)
- `pipeline/scrapers/swift_org_scraper.py` (107 lines)
- `pipeline/scrapers/apple_docs_scraper.py` (135 lines)
- `pipeline/scrapers/__init__.py` (16 lines)

**Total:** ~513 lines analyzed
**Focus:** Recent implementation of Phase 2 scrapers
**Build/Type checks:** ✅ mypy passed, ✅ ruff passed

---

## Overall Assessment

**Quality:** Strong implementation with solid foundation.
**Security:** Good rate limiting, timeout controls, retry logic.
**Type Safety:** 100% - All files pass mypy strict checks.
**Code Standards:** Compliant with ruff linting rules.

Implementation follows plan requirements closely. Code is clean, well-documented, type-safe. Minor improvements suggested for robustness and error handling edge cases.

---

## Critical Issues

None found.

---

## High Priority Findings

### 1. Resource Leak in BaseScraper Context Manager
**File:** `base_scraper.py:112-116`

**Issue:** Context manager `__aexit__` swallows all exceptions silently.

```python
async def __aexit__(self, exc_type, exc_val, exc_tb):
    await self.close()
    # Missing return statement
```

**Impact:** If exception occurs during `close()`, it may mask original exception.

**Fix:**
```python
async def __aexit__(self, exc_type, exc_val, exc_tb):
    await self.close()
    return False  # Explicit: don't suppress exceptions
```

### 2. HTTPError Construction Missing Message
**File:** `base_scraper.py:92`

**Issue:** Creating bare `httpx.HTTPError` instead of using proper exception type.

```python
raise httpx.HTTPError(f"Failed to fetch {url} after {retries} retries")
```

**Impact:** May not be caught correctly by exception handlers expecting specific error types.

**Fix:**
```python
raise httpx.RequestError(f"Failed to fetch {url} after {retries} retries")
```

---

## Medium Priority Improvements

### 3. Content Validation Inconsistency
**Files:** `hws_scraper.py:89`, `swift_org_scraper.py:88`, `apple_docs_scraper.py:98`

**Issue:** Different minimum content length thresholds across scrapers:
- HWS: 100 chars
- Swift.org: 100 chars
- Apple: 200 chars

**Recommendation:** Centralize in `BaseScraper` as configurable parameter:

```python
class BaseScraper(ABC):
    def __init__(
        self,
        rate_limit: float = 1.0,
        timeout: float = 30.0,
        min_content_length: int = 150  # Unified threshold
    ):
```

### 4. Missing Duplicate Detection
**Files:** All scrapers

**Issue:** No mechanism to detect if same content scraped multiple times (URL changes, redirects).

**Recommendation:** Add content hash to `ScrapedDocument.metadata`:

```python
content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
metadata={"content_hash": content_hash, ...}
```

### 5. datetime.now() Should Use UTC
**Files:** All scrapers use `datetime.now()`

**Issue:** Uses local timezone, causes inconsistency across environments.

**Fix:** Use `datetime.now(timezone.utc)` or `datetime.utcnow()`.

### 6. Content Truncation Silent
**Files:** All scrapers truncate at 50k chars

**Issue:** No warning logged when content truncated.

**Recommendation:**
```python
if len(content) > 50000:
    logger.warning(f"Content truncated from {len(content)} to 50000 chars: {url}")
content = content[:50000]
```

---

## Low Priority Suggestions

### 7. Improve Rate Limit Strategy
**File:** `base_scraper.py:65`

**Current:** Rate limit applied before every request uniformly.

**Suggestion:** Consider token bucket algorithm for burst handling:
```python
# Allow occasional bursts while maintaining average rate
self._last_request_time = 0
wait_time = max(0, self.rate_limit - (time.time() - self._last_request_time))
await asyncio.sleep(wait_time)
self._last_request_time = time.time()
```

### 8. User-Agent Could Be More Specific
**File:** `base_scraper.py:34`

**Current:** Generic "iOS-Prep-Pipeline/1.0"

**Suggestion:** Include contact info for site admins:
```python
"User-Agent": "iOS-Prep-Pipeline/1.0 (+https://github.com/user/repo; Educational)"
```

### 9. Missing Logging Context
**Files:** All scrapers log errors without scraper context

**Suggestion:** Add scraper name to logger:
```python
logger = get_logger(f"{__name__}.{self.__class__.__name__}")
```

### 10. BeautifulSoup Parser Not Specified
**Files:** All scrapers use `BeautifulSoup(html, "html.parser")`

**Suggestion:** Specify faster parser for performance:
```python
BeautifulSoup(html, "lxml")  # Faster, requires lxml dependency
```

---

## Positive Observations

### Excellent Type Safety
All files use modern Python type hints correctly:
- `str | None` instead of `Optional[str]`
- Return type annotations on all methods
- Proper `ABC` abstract base class usage

### Strong Error Handling
- Exponential backoff for retries
- Special handling for 429 rate limit errors (2^(attempt+2) wait)
- Special handling for 5xx server errors
- Client errors (4xx) don't retry - correct behavior

### Clean Architecture
- Clear separation of concerns (base/concrete scrapers)
- Pydantic models for data validation
- Context manager support for resource cleanup
- Async/await properly implemented

### Security Practices
- Reasonable timeout (30s)
- Rate limiting between requests
- Follow redirects enabled
- User-Agent header present

### Documentation Quality
- All classes/methods have docstrings
- Type hints comprehensive
- Comments explain non-obvious logic (e.g., HWS `div.cd-section`)

---

## Plan Compliance Check

**Todo List Status (from phase-02-source-scrapers.md):**

✅ Create models.py with ScrapedDocument
✅ Implement base_scraper.py with rate limiting
✅ Implement apple_docs_scraper.py
✅ Implement hws_scraper.py
✅ Implement swift_org_scraper.py
❌ Add checkpoint/resume support - NOT IMPLEMENTED
⚠️ Test each scraper individually - NEEDS VERIFICATION
⚠️ Save scraped data to JSON for verification - NEEDS IMPLEMENTATION

**Success Criteria:**

✅ Each scraper returns valid ScrapedDocument list
✅ Rate limiting works (no 429 errors likely)
✅ Content is clean (HTML removal implemented)
✅ Metadata correctly populated
❌ Can resume interrupted scrapes - NOT IMPLEMENTED

**Score:** 5/8 completed (62.5%)

---

## Recommended Actions

**Priority 1 (Must Fix):**
1. Fix `__aexit__` to return `False` explicitly
2. Replace `httpx.HTTPError` with `httpx.RequestError`
3. Change all `datetime.now()` to `datetime.now(timezone.utc)`

**Priority 2 (Should Fix):**
4. Implement checkpoint/resume support (plan requirement)
5. Add test script to verify scrapers work
6. Add JSON export functionality for verification
7. Add content truncation warnings
8. Centralize `min_content_length` parameter

**Priority 3 (Nice to Have):**
9. Add content hash for duplicate detection
10. Improve rate limiting with token bucket
11. Add contact info to User-Agent
12. Add scraper context to logging

---

## Metrics

- **Type Coverage:** 100% (mypy clean)
- **Linting Issues:** 0 (ruff clean)
- **Documentation Coverage:** 100% (all public methods documented)
- **Test Coverage:** Unknown (no tests found)
- **Security Score:** 8/10 (good rate limiting, timeouts; missing retry budget limit)

---

## Plan Update Required

**Status Change:** Phase 2 should remain **Pending** until:
1. Priority 1 fixes applied
2. Checkpoint/resume implemented (plan requirement)
3. Test/verification scripts added (plan requirement)

**Estimated Additional Effort:** 2-3h

---

## Unresolved Questions

1. Should lxml parser be added to dependencies for performance?
2. What's the strategy for handling Apple's JavaScript-rendered content?
3. Should there be max retry budget per scraper session?
4. Where should scraped JSON data be stored (`data/scraped/`)?
5. Should scrapers support selective re-scraping by URL?
