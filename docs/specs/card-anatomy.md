# AtlasCard Anatomy Specification

## Overview

The AtlasCard is the core UI component for displaying Questions and Answers in the Atlas. Each card follows a consistent visual hierarchy and supports five distinct states.

## Card Dimensions & Spacing

- **Min Width**: 280px
- **Max Width**: 360px
- **Internal Padding**: 16px (`--space-4`)
- **Vertical Gap Between Sections**: 8px (`--space-2`)
- **Border Radius**: 12px (`--radius-card`)
- **Background**: `--atlas-card-bg`
- **Border**: 1px solid `--atlas-card-border`
- **Shadow**: `--atlas-card-shadow` (default), `--atlas-card-shadow-active` (when active)

## Card Layout (Top to Bottom)

### 1. Path Badge (Top-Left)

**Purpose**: Indicates which lens/path the card belongs to (e.g., "Challenge", "Pattern", "Context")

**Styling**:
- Height: 24px
- Padding: 4px 12px
- Border Radius: 16px (`--radius-badge`)
- Background: Path accent color (dynamic per lens)
- Text Color: White
- Font Size: 12px (`--font-size-xs`)
- Font Weight: 600
- Position: Top-left of card

### 2. Question (Header)

**Purpose**: The primary question being asked

**Styling**:
- Font Size: 16px (`--font-size-md`)
- Font Weight: 600 (`--font-weight-semibold`)
- Color: `--atlas-card-text-primary`
- Line Height: 1.4
- Max Lines: 3
- Overflow: Ellipsis (...)
- Always Visible: Yes

### 3. Context Line (Subheader)

**Purpose**: Brief "Why this path" explanation

**Styling**:
- Font Size: 14px (`--font-size-sm`)
- Font Weight: 400 (`--font-weight-regular`)
- Color: `--atlas-card-text-muted`
- Max Lines: 1
- Overflow: Ellipsis
- Optional: Yes (may not be present)

### 4. Show Answer Button (Action)

**Purpose**: Primary CTA to reveal the answer

**Styling**:
- Padding: 8px 16px
- Border Radius: 8px (`--radius-button`)
- Font Size: 14px (`--font-size-sm`)
- Font Weight: 500
- Background: Path accent color (dynamic per lens)
- Text Color: White
- Alignment: Centered
- Hover State: Slight darkening of background

**Visibility**: Visible in `question-only` and `idle` states only

### 5. Answer Body (Expandable)

**Purpose**: The answer content revealed after clicking Show Answer

**Structure**:
- **Summary Line**: Bold intro sentence (font-weight: 600)
- **Bullet Points**: 3-4 bullets explaining the answer

**Styling**:
- Font Size: 14px (`--font-size-sm`)
- Font Weight: 400 (`--font-weight-regular`)
- Color: `--atlas-card-text-primary`
- Line Height: 1.5
- Spacing Between Bullets: 4px

**Visibility**: Hidden until revealed. Not in DOM when hidden.

### 6. Branch Footer (Post-Reveal)

**Purpose**: Actions to branch/explore from this QA pair

**Structure**:
- Two buttons side by side
  - "Branch from question"
  - "Branch from answer"

**Button Styling** (Outlined Style):
- Padding: 8px 16px
- Border Radius: 8px (`--radius-button`)
- Font Size: 14px (`--font-size-sm`)
- Font Weight: 500
- Border: 1px solid path accent color
- Text Color: Path accent color
- Background: Transparent
- Hover State: Subtle background tint

**Visibility**: Only appears after answer is revealed

## Visual States

### State 1: Question-Only (Initial State)

**Visible Elements**:
- Path badge
- Question text
- Context line (if present)
- Show Answer button

**Purpose**: Initial presentation, prompts user to reveal answer

---

### State 2: Loading

**Visible Elements**:
- Path badge
- Question text
- Context line (if present)
- Loading spinner (replaces Show Answer button)

**Visual Effects**:
- Pulsing border animation using `--atlas-signal-loading`
- Spinner centered where button was

**Purpose**: Indicates answer is being fetched from LLM

---

### State 3: Error

**Visible Elements**:
- Path badge
- Question text
- Context line (if present)
- Error message (red text, icon optional)
- Retry button

**Visual Effects**:
- Red border using `--atlas-signal-error`
- Error message in red (`--atlas-signal-error`)

**Purpose**: Indicates failure to fetch answer, allows retry

---

### State 4: Resolved (Answer Revealed)

**Visible Elements**:
- Path badge
- Question text
- Context line (if present)
- Answer body (summary + bullets)
- Branch footer (both branch buttons)

**Purpose**: Shows complete QA pair, enables branching actions

---

### State 5: Branching

**Visible Elements**:
- Same as Resolved state
- Branch buttons disabled/grayed out

**Visual Effects**:
- Branch buttons have reduced opacity (0.5)
- Cursor: not-allowed
- No hover effects

**Purpose**: Indicates branching action is in progress, prevents duplicate actions

## Interaction Flow

```
question-only → (click Show Answer) → loading → resolved → (click branch) → branching
                                        ↓
                                     error → (click Retry) → loading
```

## Accessibility Notes

- All buttons must have clear focus states
- Error messages should be announced to screen readers
- Loading state should communicate "Loading answer" to assistive tech
- Buttons should be keyboard navigable
- Color should not be the only indicator of state (use icons/text)

## Design Token Dependencies

This component relies on the following token categories:
- **Colors**: `--atlas-card-*`, `--atlas-signal-*`, path accent colors
- **Spacing**: `--space-*`
- **Radii**: `--radius-*`
- **Typography**: `--font-size-*`, `--font-weight-*`
- **Shadows**: `--atlas-card-shadow*`

All tokens are defined in `/src/styles/tokens.css`.
