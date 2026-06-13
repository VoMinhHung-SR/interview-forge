# Features

Product inventory for **Coding Interview Coach** (Interview Forge). This is a living document — update it when shipping new capabilities.

For technical structure and message flow, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Product Philosophy

Interview Forge acts as a **mentor**, not an answer key.

- Progressive hints — never dump the full solution
- Pattern and complexity insights support learning, not shortcuts
- Goal: *"Learn to solve, not just to submit."*

---

## Status at a Glance

| Area | Status |
|------|--------|
| LeetCode support | **Full** — extraction, hints, review, auto-analyze on submit |
| HackerRank support | **Partial** — platform detected, extraction not implemented |
| AI provider | **Gemini** (via `VITE_GEMINI_API_KEY`) |
| Data storage | **Local only** — `chrome.storage.local`, no cloud sync |
| Backend / auth | **Not implemented** |

---

## AI Coaching

### Progressive Hints

- Up to **8 hints** per problem, revealed one at a time in the UI
- AI generates hints in **batches of 3** per API call; subsequent requests escalate without repeating
- Each batch includes **pattern** and **difficulty** metadata (mentor context, not answer tags)
- **Guardrails** reject responses that leak full solutions
- **Hint ladder cache** (30-day TTL) avoids redundant API calls per `problemId` + locale
- **Hint sessions** persist per problem so users resume where they left off

### Solution Review

Manual review (button in popup) and optional **auto-analyze on submit** (LeetCode):

| Output | Description |
|--------|-------------|
| Pattern | Algorithmic pattern identified |
| Time / space complexity | Big-O analysis |
| Bottlenecks | Performance concerns |
| Optimizations | Improvement suggestions |
| Missed edge cases | Cases the solution may not handle |
| Interview strengths / improvements | Coaching feedback for interview prep |
| Submission verdict | Shown when triggered by a LeetCode submit (Accepted, WA, TLE, etc.) |

- Caches results by `problemId` + code hash (48-hour TTL)
- Extension badge (`!`) appears when auto-analysis completes
- Toggle **auto-analyze on submit** in the coach panel

### Problem Translation

- Translates problem **description** to **Vietnamese** via AI
- English descriptions pass through without API call
- **30-day cache** per `problemId` + locale

---

## Problem Presentation

| Feature | Description |
|---------|-------------|
| **Problem summary** | Title, description, examples, constraints from current page |
| **Difficulty badge** | Easy / Medium / Hard (LeetCode) |
| **Expandable description** | Collapsible long problem text |
| **Smart translation** | AI translation with loading skeleton and cache indicator |
| **Refresh** | Re-extract problem from the active tab |

---

## Persistence & Learning Continuity

All data is stored locally. No account, no cloud sync.

### Recent Problems

- Tracks recently viewed problems (deduplicated by `problemId`)
- Stores title, difficulty, platform, URL, last viewed time
- Displayed in **Problem Hub** tab (max **3** entries in storage)

### Saved Problems

- Bookmark / unbookmark the current problem
- List saved problems with difficulty and platform
- Open saved problem in a new tab

### Hint Sessions

- Per-problem state: `currentLevel`, hint buffer, `canContinue`
- Survives browser restarts via `chrome.storage.local`

### Learning Profile

Local analytics panel (collapsible):

| Metric | Tracked when |
|--------|--------------|
| Problems viewed | First view of a new problem |
| Hints requested | Each hint generation |
| Pattern frequency | Pattern detected in hints or solution analysis |

Displays top practiced patterns. No scoring or gamification.

---

## Localization

| Feature | Description |
|---------|-------------|
| **Languages** | English, Vietnamese |
| **Auto-detect** | Browser language on first launch |
| **Manual switch** | Locale toggle in popup header |
| **AI responses** | Hints and solution review follow selected locale |
| **Context menu** | Labels update when locale changes |
| **UI strings** | All popup copy via `useTranslation` hook |

---

## Entry Points & UX

| Entry | Behavior |
|-------|----------|
| **Toolbar popup** | Main UI — problem hub, coach, persistence |
| **Context menu** (LeetCode) | Right-click → "Get Hint" or "Review Code" → opens popup with pending action |
| **Sticky action bar** | Quick "Get Hint" when coach panel scrolls out of view |
| **Badge notification** | Purple `!` on extension icon when auto-analysis is ready |

---

## Caching Summary

| Cache | TTL | Key |
|-------|-----|-----|
| Translation | 30 days | `if:translation:{problemId}:{locale}` |
| Hint ladder | 30 days | `if:hint_ladder:{problemId}:{locale}` |
| Solution analysis | 48 hours | `if:solution:{problemId}:{codeHash}` |
| Submission analysis | 48 hours | `if:solution:{problemId}:{codeHash}:submission:{verdict}` |

Persistent (no expiry): recent problems, saved problems, hint sessions, learning profile, analysis settings.

---

## Platform Support

| Platform | Detection | Extraction | Hints | Review | Auto-analyze | Context menu |
|----------|-----------|------------|-------|--------|--------------|--------------|
| **LeetCode** | Yes | Yes | Yes | Yes | Yes | Yes |
| **HackerRank** | Yes | No | No | No | No | No |

---

## Not Implemented

| Item | Notes |
|------|-------|
| HackerRank DOM extraction | Stub at `src/content/platforms/hackerrank.ts` |
| Backend / Django API | Phase 2 |
| Authentication & cloud sync | Out of scope (local-first) |
| Payments, social, team features | Out of scope |
| Legacy panels (`PatternPanel`, `ComplexityPanel`, `ExplainPanel`) | Stubs; functionality lives in `CoachPanel` |

---

## Configuration

Requires a Gemini API key at build time:

```
VITE_GEMINI_API_KEY=your_key_here
VITE_GEMINI_MODEL=gemini-2.5-flash
```

Without a key, AI features return a clear error in the popup. Non-AI features (problem extraction, history, saved problems) still work.

---

## Related Docs

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture guide |
| [README.md](./README.md) | Setup and load instructions |
