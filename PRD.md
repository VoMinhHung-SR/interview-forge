Act as a Senior Frontend Engineer and Product Designer.

Refactor the Coding Interview Coach extension UI.

Current Problems:

* UI looks like a utility tool rather than an AI product.
* English text is hard-coded.
* Layout feels cramped.
* Information hierarchy is weak.
* There is no localization support.

Requirements:

## 1. Internationalization (i18n)

Support:

* English (en)
* Vietnamese (vi)

Language selection priority:

1. User selected language
2. Browser language
3. Fallback to English

Examples:

Browser language:

vi-VN

=> UI should automatically use Vietnamese.

Browser language:

en-US

=> UI should automatically use English.

Create:

* locales/en.ts
* locales/vi.ts

Use a translation hook:

useTranslation()

Example:

t("give_hint")

Do not hardcode text.

---

## 2. Improve Layout

Create sections:

Header
Problem Summary
AI Actions
AI Response

Example:

---

Interview Forge
AI Coding Interview Coach
-------------------------

Problem

* Title
* Difficulty
* Example Count

---

Actions

[Get Hint]
[Analyze Pattern]
[Complexity]

---

Response

Pattern:
Sliding Window

Hint Level 1:
...

Hint Level 2:
...

---

---

## 3. Modern Design

Use:

* TailwindCSS
* Rounded cards
* Better spacing
* Better typography

Visual style:

* ChatGPT
* Linear
* Notion

Avoid:

* Dense blocks
* Plain buttons
* Large paragraphs

---

## 4. AI Response Cards

Render:

Pattern
Complexity
Hints

as separate cards.

Example:

## Pattern

Sliding Window

## Complexity

Time: O(n)
Space: O(1)

## Hints

Level 1
...

Level 2
...

Level 3
...

---

## 5. Loading State

When Gemini is processing:

Show:

* Skeleton UI
* Animated loading indicator

instead of plain text.

---

## 6. Empty State

When user has not requested help yet:

Show:

"Need help solving this problem?"

and action buttons.

---

Generate production-ready React + TypeScript code.