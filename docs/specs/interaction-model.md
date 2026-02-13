# E0-1: Question-First Interaction Model

**Epic**: E0: Core Exploration Loop
**Status**: Design Spec
**Last Updated**: 2026-02-13

## Overview

This document defines the UX contract for the Knowledge Atlas's question-first node interaction model. The core principle is that every node presents a question first, with the answer revealed only through explicit user action. This design creates intentional friction that encourages deeper cognitive engagement and prevents passive scrolling.

---

## Core Principle

**Every node shows a question first; the answer appears only on explicit user action.**

- Nodes never auto-expand or auto-generate answers
- Users must actively choose to reveal answers by clicking "Show Answer"
- This interaction pattern applies uniformly to all nodes (root and descendants)
- The revealed answer is cached and persists across UI interactions

---

## State Machine

The node interaction follows a deterministic state machine with four primary states. Each state has distinct visual characteristics and available user actions.

### 1. `question-only` (Default State)

**Visual Characteristics:**
- **Card Size**: Compact layout, minimal vertical space
- **Path Badge**: Visible in top-left corner (e.g., "1.2.1" with subtle background)
- **Question Text**: Prominent display at 16px font size, 600 weight (semi-bold)
- **Context Line**: Single-line context description below question (14px, 400 weight, muted color)
- **Primary CTA**: "Show Answer" button in primary accent color
- **Answer Content**: Not present in DOM (completely unmounted)
- **Border**: Default card border (1px solid, neutral color)

**Available Actions:**
- Click "Show Answer" button → triggers transition to `loading` state
- Click anywhere on card → sets as activeNodeId (highlights ancestral thread)

**Behavior:**
- This is the initial state for all newly created nodes
- No answer generation occurs in this state
- Card maintains minimal footprint to maximize canvas space

---

### 2. `loading` (Transient State)

**Visual Characteristics:**
- **Card Border**: Animated pulse with signal-loading color (e.g., blue pulse at 1.5s interval)
- **Button State**: "Show Answer" button replaced by spinner/loading indicator
- **Interactions**: All buttons and click handlers disabled
- **Question/Context**: Remain visible and unchanged
- **Answer Area**: Empty or shows loading skeleton (shimmer effect)

**Available Actions:**
- None (all interactions disabled during loading)

**Behavior:**
- Actively generating answer via LLM API call
- Provides clear visual feedback that work is in progress
- Prevents duplicate requests through interaction disabling
- Duration: Typically 2-8 seconds depending on API response time

---

### 3. `answer-revealed` (Stable Expanded State)

**Visual Characteristics:**
- **Card Expansion**: Smooth height transition (300ms ease-out) to accommodate answer
- **Answer Body Structure**:
  - **Summary Line**: Bold (600 weight), 15px, provides one-sentence answer
  - **Bullet Points**: 3-4 detailed points in regular weight (400), 14px
  - **Spacing**: 12px between summary and bullets, 8px between bullet items
- **Button State**: "Show Answer" button removed from DOM
- **Branch Footer**: Appears below answer with two action buttons:
  - "Branch from question" (secondary style)
  - "Branch from answer" (secondary style)
- **Card Border**: Returns to default state (pulse animation removed)

**Available Actions:**
- Click "Branch from question" → spawns child nodes exploring question variations
- Click "Branch from answer" → spawns child nodes diving deeper into answer content
- Click card → sets as activeNodeId

**Behavior:**
- Answer content is now cached in application state
- Card remains in this state until user navigates away or collapses (if collapse feature added)
- Smooth visual transition from loading to revealed state
- Branch buttons enable the core exploration mechanic

---

### 4. `branching` (Transient Branching State)

**Visual Characteristics:**
- **Branch Buttons**: The clicked button becomes disabled with reduced opacity (40%)
- **Other Button**: Remains enabled (users can branch from both question and answer)
- **Visual Feedback**: Brief highlight or ripple effect on clicked button
- **New Nodes**: Spawn with staggered animation:
  1. Edges draw in first (200ms per edge, staggered by 100ms)
  2. Child node cards fade in (300ms fade, starts after edge completes)

**Available Actions:**
- Click the other branch button type (if not yet used)
- Click card → sets as activeNodeId
- Interact with newly spawned child nodes

**Behavior:**
- Each branch button type can only be used once per button type (not globally once)
- "Branch from question" creates ~3 related question variants
- "Branch from answer" creates ~3 deeper exploration questions
- Multiple nodes can be in branching state simultaneously
- Parent node remains in `answer-revealed` state after branching completes

---

## State Transitions

### Transition Map

```
question-only → loading → answer-revealed → branching
                  ↓
                error → loading (on retry)
```

### Detailed Transition Triggers

1. **`question-only` → `loading`**
   - **Trigger**: User clicks "Show Answer" button
   - **Actions**:
     - Disable all interactions
     - Replace button with spinner
     - Start border pulse animation
     - Initiate LLM API call with question text
     - Store request ID for response matching

2. **`loading` → `answer-revealed`**
   - **Trigger**: Generation completes successfully (API returns 200 with valid response)
   - **Actions**:
     - Parse answer content (summary + bullets)
     - Cache answer in node state
     - Animate card height expansion
     - Fade in answer content
     - Remove spinner, stop border pulse
     - Render branch footer with both buttons

3. **`loading` → `error`**
   - **Trigger**: Generation fails (network error, API error, safety filter)
   - **Actions**:
     - Stop border pulse, apply error border (red accent)
     - Remove spinner
     - Display contextual error message
     - Render "Retry" button
     - Log error details for debugging

4. **`error` → `loading`**
   - **Trigger**: User clicks "Retry" button
   - **Actions**:
     - Remove error border and message
     - Return to loading visual state
     - Re-attempt API call (with same question)
     - Implement exponential backoff if multiple retries

5. **`answer-revealed` → `branching`**
   - **Trigger**: User clicks "Branch from question" OR "Branch from answer"
   - **Actions**:
     - Disable clicked button (set opacity to 40%)
     - Determine branch type (question vs. answer)
     - Generate 3 child questions based on branch type
     - Create child nodes in `question-only` state
     - Create edges connecting parent to children
     - Trigger spawn animation sequence
     - Maintain parent in `answer-revealed` state

---

## Error State

The error state provides graceful degradation when answer generation fails.

### Visual Characteristics

- **Card Border**: 2px solid with error accent color (e.g., `--color-error` red)
- **Error Message**: Displayed below question text, above where answer would appear
  - Font: 14px, 500 weight
  - Color: Error text color (darker red)
  - Icon: Optional warning icon prefix
- **Retry Button**: Replaces "Show Answer" button, styled as secondary CTA

### Error Messages (User-Friendly)

1. **Network Failure**:
   ```
   Connection failed. Retry?
   ```

2. **Safety Filter Triggered**:
   ```
   Couldn't explore this topic. Try a different angle.
   ```

3. **Generic/Unknown Error**:
   ```
   Something went wrong. Retry?
   ```

### Error Recovery

- Clicking "Retry" immediately transitions back to `loading` state
- No automatic retry to prevent API spam
- Error details logged to console for debugging but not shown to user
- If retry fails 3+ times, suggest refreshing the page (new error message)

---

## Edge Cases and Constraints

### Multiple Nodes in Loading

- **Scenario**: User clicks "Show Answer" on multiple nodes before any complete
- **Behavior**: All clicked nodes enter `loading` state simultaneously
- **Constraint**: Maximum 5 concurrent generations (queue additional requests)
- **UX**: Spinner appears on each loading node independently

### Answer Caching

- **Scenario**: User scrolls away from revealed answer, then returns
- **Behavior**: Answer remains cached in node state, card stays in `answer-revealed` state
- **Constraint**: Answers never regenerate for same question (unless explicit refresh action added)
- **Performance**: Cache stored in client-side state (React/Zustand), not persisted to backend initially

### Active Node Highlighting

- **Scenario**: User clicks any node in any state
- **Behavior**: Sets clicked node as `activeNodeId`, highlights entire ancestral thread from root
- **Visual**: Subtle background tint or border highlight on all ancestor nodes
- **Persistence**: Highlighting persists until user clicks a different node

### Branch Button Behavior

- **One-Time Use Clarification**: Each button type ("Branch from question" / "Branch from answer") can only be clicked once
- **Independent Buttons**: User can click "Branch from question" first, then later click "Branch from answer" (or vice versa)
- **Disabled State**: Once a button is clicked, it becomes disabled (reduced opacity, no hover state)

### No Auto-Expansion

- **Critical Constraint**: Nodes never auto-expand or auto-generate answers
- **Applies To**: Root node, all child nodes, deep descendants
- **User Intent**: Every answer reveal must be an explicit user action
- **Exception**: None (this is a core design principle)

### Canvas Interactions

- **Pan/Zoom**: Allowed at all times, does not interfere with node states
- **Multi-Select**: Not applicable (single active node at a time)
- **Drag Nodes**: TBD in layout spec, but state machine remains independent

---

## Implementation Notes

### DOM Mounting Strategy

- **`question-only`**: Answer content completely unmounted (not rendered)
- **`loading`**: Loading skeleton or empty container mounted
- **`answer-revealed`**: Full answer content mounted and visible
- **Performance**: Unmounting saves DOM nodes when exploring large graphs

### Animation Timings

- **Card Expansion**: 300ms ease-out
- **Edge Drawing**: 200ms per edge, stagger by 100ms
- **Card Fade-In**: 300ms fade, starts after edge completes
- **Border Pulse**: 1.5s interval in loading state

### Accessibility

- **Keyboard Navigation**: "Show Answer" button focusable via Tab
- **Screen Readers**: Announce state changes ("Loading answer...", "Answer revealed")
- **ARIA Labels**: `aria-busy="true"` in loading state, `aria-expanded="true"` when revealed
- **Focus Management**: Focus moves to answer content when revealed (optional enhancement)

---

## Open Questions

1. **Collapse Feature**: Should users be able to collapse revealed answers back to `question-only`?
   - **Decision**: Deferred to E1 (post-MVP)

2. **Answer Editing**: Should users be able to regenerate or edit revealed answers?
   - **Decision**: Deferred to E2 (post-MVP)

3. **Branch Limit**: Should there be a maximum number of branches per node?
   - **Decision**: Soft limit of 6 total child nodes (3 from question + 3 from answer), enforce in branching logic

4. **Offline Behavior**: What happens if user loses connection while exploring?
   - **Decision**: Show network error message, allow retry when connection restored

---

## Success Metrics

- **Engagement**: % of nodes where "Show Answer" is clicked (target: >60%)
- **Exploration Depth**: Average graph depth before user stops branching (target: 4+ levels)
- **Error Recovery**: % of errors followed by successful retry (target: >70%)
- **Cognitive Load**: User survey rating on "ease of following exploration" (target: 4+/5)

---

## Related Specs

- **E0-2**: Node Layout & Canvas Interaction (graph visualization)
- **E0-3**: Question Generation Logic (branching algorithm)
- **E1-1**: Thread Navigation & History (active node UI)

---

## Changelog

- **2026-02-13**: Initial spec created
