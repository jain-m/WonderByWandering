# E0-4: Demo Acceptance Criteria

**Purpose**: Define dual success targets — codifying the two hero moments as testable checklists.

This document establishes the acceptance criteria for the Wonder By Wandering demo, focusing on two critical success dimensions: the visual exploration experience and the cognitive distinctiveness of each thinking path.

---

## Visual Hero (Map Exploration Feel)

The animation sequence should evoke the feeling of exploring a map, where routes reveal themselves before destinations appear — not a linear wizard or tree diagram.

### Animation Choreography
- [ ] Edges draw before cards appear (route-first choreography)
- [ ] Edges animate via stroke-dashoffset, 200ms duration per edge
- [ ] Cards fade in at edge endpoints (opacity 0→1, scale 0.95→1.0)
- [ ] Cards appear 150ms after their parent edge finishes drawing
- [ ] Sibling card stagger: 100ms between each
- [ ] Overall feeling: "exploring a map" not "clicking through a wizard"

### Visual Aesthetic
- [ ] Canvas background has atlas paper aesthetic (#faf9f6 warm off-white)
- [ ] Typography is clean and readable (sufficient contrast, appropriate sizing)
- [ ] Edge styling feels like hand-drawn paths (subtle, organic)
- [ ] Card design feels like discovery waypoints, not UI widgets

### Accessibility
- [ ] Reduced motion: all items appear instantly, no animation
- [ ] Sufficient color contrast for text (WCAG AA minimum)
- [ ] Keyboard navigation is functional (though not required for demo)

---

## Cognitive Hero (Distinct Thinking Lenses)

Each of the 6 cognitive paths must produce questions that are clearly distinguishable from one another. A non-expert should be able to identify which lens generated a question without seeing the label.

### Cross-Path Distinctiveness
- [ ] Given the same source text, each of the 6 paths produces clearly different questions
- [ ] A non-expert can tell which cognitive lens a question belongs to without seeing the label
- [ ] No two paths produce questions that feel like variations of the same theme
- [ ] Question sets feel complementary, not redundant

### Per-Path Cognitive Clarity

#### Clarify Path
- [ ] "Clarify" questions ask about definitions and disambiguation
- [ ] Focus on "what does X mean?" and "how do you define Y?"
- [ ] Seek to establish shared vocabulary and precise understanding
- [ ] Example: "What exactly do you mean by 'emergent behavior'?"

#### Go Deeper Path
- [ ] "Go Deeper" questions probe mechanisms and causality
- [ ] Focus on "how does this work?" and "why does this happen?"
- [ ] Seek underlying explanations and causal chains
- [ ] Example: "What mechanisms cause emergent behavior to arise?"

#### Challenge Path
- [ ] "Challenge" questions seek counterarguments and evidence gaps
- [ ] Focus on "what could be wrong?" and "what's missing?"
- [ ] Seek to stress-test claims and identify weaknesses
- [ ] Example: "What evidence might contradict the claim that emergent behavior is unpredictable?"

#### Apply Path
- [ ] "Apply" questions focus on practical use and implementation
- [ ] Focus on "how would I use this?" and "what are the next steps?"
- [ ] Seek concrete actions and real-world scenarios
- [ ] Example: "How could you apply emergent behavior principles to organizational design?"

#### Connect Path
- [ ] "Connect" questions find relationships to other domains/concepts
- [ ] Focus on "what else is like this?" and "how does this relate to X?"
- [ ] Seek analogies, patterns, and cross-domain insights
- [ ] Example: "How does emergent behavior in ant colonies relate to market dynamics?"

#### Surprise Me Path
- [ ] "Surprise Me" questions offer unexpected/counterintuitive angles
- [ ] Focus on "what's weird here?" and "what if we flip this?"
- [ ] Seek contrarian takes and unconventional perspectives
- [ ] Example: "What if emergent behavior is actually more predictable than deliberate design?"

### Branch Depth (Not Breadth)
- [ ] Branch questions go deeper, not sideways (avoid "more of the same")
- [ ] Follow-up questions build on parent context, don't restart
- [ ] Each level of branching should feel like zooming in, not panning around
- [ ] Avoid generating questions that could have been siblings of the parent

---

## Demo Functional Requirements

Core functionality that must work for a successful demo experience.

### User Flow
- [ ] Selection → canvas handoff in one right-click action
- [ ] Context menu appears on text selection
- [ ] Canvas opens in side panel or new view
- [ ] Source text is clearly displayed in root card

### Mock Mode
- [ ] Full demo works in mock mode (no Gemini key required)
- [ ] Mock responses are representative of real API behavior
- [ ] Mock data showcases all 6 cognitive paths effectively
- [ ] Delay simulation feels realistic (~500ms-1s per request)

### Layout & Legibility
- [ ] Canvas stays legible at 15+ nodes (no overlapping, readable text)
- [ ] Auto-layout prevents card collisions
- [ ] Zoom/pan controls are intuitive (or layout is fixed and works)
- [ ] Text remains readable at all zoom levels (or minimum zoom enforced)

### Backward Compatibility
- [ ] Existing extension features (List Key Points, YouTube) still work
- [ ] Original popup/sidebar functionality is intact
- [ ] No regressions in existing user workflows

### Persistence
- [ ] Canvas persists across tab close/reopen
- [ ] User can resume exploration from where they left off
- [ ] Clear action to start fresh canvas (if desired)

### Error Handling
- [ ] Error states are graceful (no blank screens, no raw API errors)
- [ ] Network failures show friendly retry options
- [ ] API errors display helpful user-facing messages
- [ ] Partial failures don't break entire canvas (e.g., one path fails but others succeed)

---

## Manual Test Script

Follow this script to verify all acceptance criteria. Expected duration: ~15 minutes.

### Setup
1. Install the extension from `/Users/wenjiefu/Documents/GitHub/WonderByWandering`
2. Navigate to a content page (e.g., Wikipedia article, blog post)
3. Ensure reduced motion is OFF in system preferences (to test animations)

### Test 1: Visual Hero Moment
**Goal**: Verify animation choreography and atlas aesthetic

1. Select a paragraph of text (3-5 sentences)
2. Right-click and choose "Wonder By Wandering" (or equivalent)
3. **Observe**: Canvas opens with atlas paper background (#faf9f6)
4. **Observe**: Root card appears with selected text
5. Click one of the 6 cognitive path options
6. **Observe**:
   - Edge draws first (200ms animation via stroke-dashoffset)
   - Card appears 150ms after edge finishes
   - Card fades in (opacity 0→1) and scales (0.95→1.0)
7. Click multiple siblings rapidly
8. **Observe**: Cards stagger by 100ms each
9. **Pass criteria**: Feels like "exploring a map" not "expanding a tree"

### Test 2: Reduced Motion Accessibility
**Goal**: Verify instant appearance when animations are disabled

1. Enable "Reduce Motion" in system preferences
2. Repeat Test 1, steps 1-7
3. **Observe**: All cards and edges appear instantly, no animation
4. **Pass criteria**: No motion artifacts, immediate rendering

### Test 3: Cognitive Distinctiveness
**Goal**: Verify each path produces unique question types

1. Start fresh canvas with new text selection (e.g., paragraph about "neural networks")
2. Open all 6 cognitive paths from root
3. **For each path**, verify:
   - **Clarify**: Asks about definitions ("What is X?", "How do you define Y?")
   - **Go Deeper**: Asks about mechanisms ("How does X work?", "Why does Y happen?")
   - **Challenge**: Asks about counterarguments ("What evidence contradicts X?", "What's the weakness in Y?")
   - **Apply**: Asks about practical use ("How would I use X?", "What's a real-world example of Y?")
   - **Connect**: Asks about relationships ("What's similar to X?", "How does X relate to Y?")
   - **Surprise Me**: Asks unexpected angles ("What if X is backwards?", "What's counterintuitive about Y?")
4. **Pass criteria**: You can identify each path's questions without seeing labels

### Test 4: Branch Depth
**Goal**: Verify follow-ups go deeper, not sideways

1. From Test 3 canvas, pick "Go Deeper" path
2. Expand one of its questions
3. **Observe**: Follow-up questions build on parent context
4. **Counter-check**: Follow-ups should NOT feel like siblings of the parent
5. **Pass criteria**: Each branch level zooms in on specifics, doesn't restart

### Test 5: Mock Mode
**Goal**: Verify demo works without API key

1. Remove Gemini API key from extension settings (or test in incognito without key)
2. Repeat Test 1, steps 1-6
3. **Observe**: Mock responses appear with realistic delays (~500ms-1s)
4. **Observe**: All 6 paths generate mock questions
5. **Pass criteria**: Demo is fully functional without real API

### Test 6: Layout at Scale
**Goal**: Verify legibility at 15+ nodes

1. Create a deep exploration (3-4 levels deep, multiple branches)
2. Expand until canvas has 15+ total cards
3. **Observe**: No overlapping cards
4. **Observe**: All text remains readable
5. **Pass criteria**: Layout remains clean and scannable

### Test 7: Backward Compatibility
**Goal**: Verify existing features still work

1. Select text and use "List Key Points" feature
2. **Observe**: Key points generation works as before
3. Navigate to YouTube video page
4. **Observe**: YouTube integration still functions
5. **Pass criteria**: No regressions in existing workflows

### Test 8: Persistence
**Goal**: Verify canvas survives tab close

1. Create a canvas with 5-10 cards
2. Close the browser tab
3. Reopen the tab
4. **Observe**: Canvas state is restored
5. **Pass criteria**: User can resume exploration

### Test 9: Error Handling
**Goal**: Verify graceful failures

1. Simulate network failure (disable internet or use dev tools)
2. Attempt to expand a new path
3. **Observe**: Friendly error message appears (not raw error text)
4. **Observe**: Retry option is available
5. **Pass criteria**: UI remains functional, no blank screens

### Test 10: One-Action Flow
**Goal**: Verify selection → canvas in single action

1. Select text
2. Right-click
3. **Observe**: Canvas option appears in context menu
4. Click canvas option
5. **Observe**: Canvas opens immediately with text in root card
6. **Pass criteria**: No intermediate dialogs or multi-step flows

---

## Success Metrics

**Visual Hero**: Pass all items in "Visual Hero" section + Tests 1-2
**Cognitive Hero**: Pass all items in "Cognitive Hero" section + Tests 3-4
**Demo Readiness**: Pass all items in "Demo Functional Requirements" section + Tests 5-10

**Overall Demo Acceptance**: All three success metrics must pass.

---

## Notes for Reviewers

- This spec intentionally focuses on *experience* over *implementation*
- Animation timings (200ms, 150ms, 100ms) are starting points — feel free to tune
- "Non-expert can distinguish paths" is the gold standard test
- Mock mode is essential for demos without internet/API dependencies
- Reduced motion support is non-negotiable for accessibility
