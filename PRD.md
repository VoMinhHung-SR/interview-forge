# Coding Interview Coach - Product Requirements Document

You are a Senior Software Architect and Product Manager.

Help me design and implement a product called "Coding Interview Coach".

## Product Overview

Coding Interview Coach is a browser extension powered by AI that helps software engineers solve coding interview problems without immediately revealing solutions.

The goal is to act like a mentor rather than an answer generator.

Supported platforms:

* LeetCode
* HackerRank
* Codeforces (future)

## Core Philosophy

The AI should:

* Guide the user
* Give progressive hints
* Identify patterns
* Explain complexity
* Help users learn

The AI should NOT:

* Immediately provide full solutions
* Encourage cheating during contests
* Spoil interview questions unless explicitly requested

---

## Target Users

1. Junior developers preparing for interviews
2. University students learning algorithms
3. Software engineers practicing LeetCode

---

## MVP Features

### Feature 1: Problem Detection

When the user visits a supported coding platform:

* Detect problem title
* Detect problem description
* Detect example inputs/outputs
* Extract content from the page

---

### Feature 2: AI Hint Generator

User clicks:

"Give Hint"

AI returns:

Level 1 Hint:
Very abstract guidance

Level 2 Hint:
More specific guidance

Level 3 Hint:
Strong direction but still not full solution

Example:

Problem: Longest Substring Without Repeating Characters

Hint 1:
Can you maintain information about a contiguous section of the string?

Hint 2:
What happens when you encounter a duplicate character?

Hint 3:
Consider using a sliding window.

---

### Feature 3: Pattern Detection

User asks:

"What pattern is this problem?"

AI returns:

* Sliding Window
* Two Pointers
* Dynamic Programming
* Binary Search
* Graph
* Trie
* Heap
* Union Find

and explains why.

---

### Feature 4: Complexity Analyzer

User pastes code.

AI returns:

* Time Complexity
* Space Complexity
* Potential Bottlenecks
* Optimization Suggestions

Output Example:

Time Complexity:
O(n²)

Space Complexity:
O(1)

Optimization:
Consider a hash map to reduce repeated searches.

---

### Feature 5: Explain Solution

User requests:

"Explain this solution like I am a junior developer."

AI explains:

* Intuition
* Step-by-step execution
* Edge cases
* Complexity

---

## Technical Requirements

Frontend:

* React
* TypeScript
* Chrome Extension Manifest V3
* Tailwind CSS

Architecture:

* Popup UI
* Content Script
* Background Service Worker

Backend (Phase 2):

* Django
* Django REST Framework
* PostgreSQL

AI Provider:

* Gemini API
* OpenAI API

---

## Chrome Extension Architecture

Content Script:

* Extract problem title
* Extract problem description
* Send data to extension

Background Script:

* Manage API requests
* Handle authentication

Popup UI:

* Hint Generator
* Complexity Analyzer
* Pattern Detector

---

## Future Features

### Mock Interview Mode

AI acts as interviewer.

It asks:

* Clarification questions
* Follow-up questions
* Complexity questions

---

### Progress Tracking

Track:

* Problems solved
* Patterns mastered
* Weak areas

Example:

Array: 40
DP: 12
Graph: 5

Weak Areas:

* Trie
* Union Find

---

### Learning Roadmap

AI generates personalized recommendations:

"You should solve these 5 Sliding Window problems next."

---

## Deliverables

Please help me:

1. Design system architecture
2. Design database schema
3. Design extension folder structure
4. Design API contracts
5. Create implementation roadmap
6. Generate React + TypeScript code step by step
7. Follow software engineering best practices
8. Prefer clean architecture and maintainability
