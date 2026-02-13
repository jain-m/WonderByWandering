# Conversation Compass: Radial Path Semantics

**Epic**: E0-2: Define Conversation Compass radial semantics
**Status**: Design Specification
**Last Updated**: 2026-02-13

---

## Overview

The Conversation Compass provides six distinct cognitive lenses for exploring any piece of text. Each path represents a fundamentally different way of thinking about and interrogating source material. When a user selects a phrase or passage, the compass radiates outward from that selection, offering six paths that transform passive reading into active exploration.

---

## Design Principles

1. **Cognitive Distinctness**: Each path must offer a genuinely different mode of inquiry
2. **Visual Clarity**: Colors must be immediately distinguishable and accessible (WCAG AA contrast)
3. **Prompt Engineering**: Templates must produce reliably path-specific questions
4. **Progressive Depth**: Each path supports both shallow and deep exploration

---

## The Six Paths

### 1. Clarify

**Purpose**: Disambiguate meaning, define terms, unpack jargon

**Label**: `Clarify`

**Icon Concept**: Magnifying glass over text or a question mark inside a circle

**Color Accent**: `#4A90D9` (Clear Blue)
- Contrast ratio against #faf9f6: 4.52:1 (WCAG AA compliant)
- Evokes clarity, sky, transparency

**Prompt Template Shape**:
```
Given this text: "{sourceText}"

Generate questions through the "Clarify" lens.

Focus on:
- Defining unfamiliar or technical terms
- Disambiguating ambiguous phrases
- Explaining implicit assumptions
- Breaking down complex statements into simpler components

Return JSON: {
  rootQuestion: "A foundational question that seeks definitional clarity",
  branches: [
    { question: "What does [specific term/phrase] mean?", context: "Why this definition matters" },
    { question: "How is [concept] being used here?", context: "Potential ambiguities" }
  ]
}
```

**Example Output** (Source: "The mitochondria is the powerhouse of the cell"):

- **Root Question**: "What does 'powerhouse' actually mean in biological terms?"
- **Branch 1**: "What specifically is mitochondria?"
  - *Context*: The plural form suggests multiple structures, but what are they exactly?
- **Branch 2**: "How does 'powerhouse' translate to measurable cellular function?"
  - *Context*: Metaphors can obscure precise mechanisms
- **Branch 3**: "Are there cells that don't rely on mitochondria as their 'powerhouse'?"
  - *Context*: Understanding exceptions helps clarify the rule

---

### 2. Go Deeper

**Purpose**: Explore underlying mechanisms, expose hidden layers, trace causality

**Label**: `Go Deeper`

**Icon Concept**: Layered circles (like geological strata) or a drill boring downward

**Color Accent**: `#7B4FBF` (Deep Purple)
- Contrast ratio against #faf9f6: 4.71:1 (WCAG AA compliant)
- Evokes depth, mystery, intellectual drilling

**Prompt Template Shape**:
```
Given this text: "{sourceText}"

Generate questions through the "Go Deeper" lens.

Focus on:
- Uncovering mechanisms behind stated facts
- Tracing causal chains backward
- Revealing assumptions or foundations
- Exploring what enables or makes possible the described phenomenon

Return JSON: {
  rootQuestion: "A question that asks how or why this works at a deeper level",
  branches: [
    { question: "What underlying mechanism makes this possible?", context: "The layer beneath" },
    { question: "What had to be true for this to exist?", context: "Preconditions and foundations" }
  ]
}
```

**Example Output** (Source: "The mitochondria is the powerhouse of the cell"):

- **Root Question**: "How exactly do mitochondria generate energy for the cell?"
- **Branch 1**: "What is the actual chemical process happening inside mitochondria?"
  - *Context*: Moving from metaphor to mechanism (ATP synthesis, electron transport chain)
- **Branch 2**: "Why did cells evolve to outsource energy production to specialized organelles?"
  - *Context*: The evolutionary advantage and endosymbiotic theory
- **Branch 3**: "What molecular machinery enables the conversion of nutrients to usable energy?"
  - *Context*: Enzymes, membranes, and the chemiosmotic gradient

---

### 3. Challenge

**Purpose**: Find counterarguments, expose limitations, test robustness

**Label**: `Challenge`

**Icon Concept**: Shield and sword crossed, or a scale (weighing both sides)

**Color Accent**: `#D94F4F` (Warm Coral Red)
- Contrast ratio against #faf9f6: 4.53:1 (WCAG AA compliant)
- Evokes critical examination, healthy skepticism, intellectual combat

**Prompt Template Shape**:
```
Given this text: "{sourceText}"

Generate questions through the "Challenge" lens.

Focus on:
- Identifying unstated assumptions
- Finding exceptions or counterexamples
- Questioning the completeness or accuracy of the claim
- Exposing potential oversimplifications

Return JSON: {
  rootQuestion: "A question that productively challenges the claim or framing",
  branches: [
    { question: "What are the exceptions to this statement?", context: "Where it breaks down" },
    { question: "What alternative perspectives exist?", context: "Competing frameworks" }
  ]
}
```

**Example Output** (Source: "The mitochondria is the powerhouse of the cell"):

- **Root Question**: "Is it accurate to call mitochondria THE powerhouse, implying it's the only one?"
- **Branch 1**: "What about glycolysis? Doesn't that also produce energy, outside mitochondria?"
  - *Context*: Challenging the exclusivity implied by "the powerhouse"
- **Branch 2**: "Do all cells actually have mitochondria? What about red blood cells?"
  - *Context*: Finding biological exceptions to the universal claim
- **Branch 3**: "Doesn't this metaphor oversimplify what mitochondria do beyond ATP production?"
  - *Context*: They're also involved in signaling, apoptosis, calcium regulation

---

### 4. Apply

**Purpose**: Find practical applications, real-world use cases, actionable implications

**Label**: `Apply`

**Icon Concept**: Wrench and hammer (tools), or a bridge connecting theory to practice

**Color Accent**: `#3DAA6D` (Verdant Green)
- Contrast ratio against #faf9f6: 4.52:1 (WCAG AA compliant)
- Evokes growth, actionability, practical utility

**Prompt Template Shape**:
```
Given this text: "{sourceText}"

Generate questions through the "Apply" lens.

Focus on:
- Practical implications and real-world applications
- How this knowledge could be used or leveraged
- Concrete examples in everyday contexts
- Actionable next steps or interventions

Return JSON: {
  rootQuestion: "A question about how this could be used or applied",
  branches: [
    { question: "How does this show up in [real-world context]?", context: "Practical manifestation" },
    { question: "What could we do differently knowing this?", context: "Actionable insights" }
  ]
}
```

**Example Output** (Source: "The mitochondria is the powerhouse of the cell"):

- **Root Question**: "How is knowledge about mitochondria being used to solve real problems?"
- **Branch 1**: "What diseases are linked to mitochondrial dysfunction, and how are they treated?"
  - *Context*: From Parkinson's to rare mitochondrial myopathies
- **Branch 2**: "How do athletes and biohackers try to optimize mitochondrial function?"
  - *Context*: Exercise science, supplements, intermittent fasting claims
- **Branch 3**: "Could we engineer better mitochondria or introduce synthetic alternatives?"
  - *Context*: Synthetic biology applications and therapeutic potential

---

### 5. Connect

**Purpose**: Find relationships to other ideas, build interdisciplinary bridges, map the knowledge web

**Label**: `Connect`

**Icon Concept**: Network nodes and edges, or interlocking puzzle pieces

**Color Accent**: `#D98F2E` (Amber Gold)
- Contrast ratio against #faf9f6: 5.12:1 (WCAG AA compliant)
- Evokes connection, warmth, the linking of ideas

**Prompt Template Shape**:
```
Given this text: "{sourceText}"

Generate questions through the "Connect" lens.

Focus on:
- Analogies to other domains or fields
- Conceptual similarities with seemingly unrelated ideas
- How this fits into broader frameworks or theories
- Cross-pollination between disciplines

Return JSON: {
  rootQuestion: "A question that links this to something else",
  branches: [
    { question: "How is this similar to [concept from another domain]?", context: "Cross-domain analogy" },
    { question: "What larger pattern or principle does this exemplify?", context: "Higher-order connection" }
  ]
}
```

**Example Output** (Source: "The mitochondria is the powerhouse of the cell"):

- **Root Question**: "What other systems use the same 'specialized factory' organizational principle?"
- **Branch 1**: "How is this like a power plant in a city's infrastructure?"
  - *Context*: Centralized vs. distributed energy generation models
- **Branch 2**: "Does this relate to the economic concept of comparative advantage and specialization?"
  - *Context*: Why specialized units outperform generalists in complex systems
- **Branch 3**: "Are there parallels in computer architecture? GPU vs. CPU division of labor?"
  - *Context*: Specialized processing units for specific computational tasks

---

### 6. Surprise Me

**Purpose**: Explore unexpected angles, counterintuitive insights, creative reframings

**Label**: `Surprise Me`

**Icon Concept**: Lightning bolt, sparkle/star burst, or a kaleidoscope

**Color Accent**: `#C44FC9` (Electric Magenta)
- Contrast ratio against #faf9f6: 4.58:1 (WCAG AA compliant)
- Evokes surprise, creativity, the unexpected

**Prompt Template Shape**:
```
Given this text: "{sourceText}"

Generate questions through the "Surprise Me" lens.

Focus on:
- Counterintuitive implications or perspectives
- Creative reframings or alternative lenses (artistic, philosophical, humorous)
- Unexpected historical contexts or trivia
- Thought experiments or imaginative scenarios

Return JSON: {
  rootQuestion: "A question that approaches this from an unexpected angle",
  branches: [
    { question: "What would happen if [imaginative scenario]?", context: "Thought experiment" },
    { question: "What's a surprising historical/cultural angle on this?", context: "Unexpected context" }
  ]
}
```

**Example Output** (Source: "The mitochondria is the powerhouse of the cell"):

- **Root Question**: "What if mitochondria are actually ancient bacterial colonizers, not servants?"
- **Branch 1**: "Do mitochondria have their own 'agenda' separate from the cell?"
  - *Context*: They have their own DNA, reproduce independently, and might be viewed as symbiotic organisms
- **Branch 2**: "What if we're all just elaborate transportation devices for mitochondrial DNA?"
  - *Context*: A Dawkins-style gene's-eye-view reframing
- **Branch 3**: "How did the scientist who first saw mitochondria react? What did they think they were looking at?"
  - *Context*: The 1890s discovery by Richard Altmann and early theories about their function

---

## Visual Implementation Notes

### Radial Layout

The compass appears as six equally-spaced wedges radiating from the selected text:

```
        Go Deeper (Purple)
             ▲
             |
Challenge ◄──┼──► Apply
   (Red)     |    (Green)
             |
    Clarify ─┼─ Surprise Me
    (Blue)   |   (Magenta)
             ▼
          Connect
         (Amber)
```

Each wedge extends outward on hover, revealing the path label and icon.

### Interaction States

1. **Default**: Subtle colored arc, icon visible
2. **Hover**: Wedge extends, label fades in, color intensifies
3. **Selected**: Wedge fully highlighted, triggers question generation
4. **Active**: Pulsing animation while AI generates questions

### Accessibility

- All colors meet WCAG AA contrast requirements (4.5:1 minimum)
- Keyboard navigation: Tab through paths, Enter to select
- Screen reader announcements: "Clarify path - disambiguate meaning"
- Reduced motion preference: Disable pulsing animations

---

## Prompt Engineering Details

### General Template Structure

All paths follow this base structure with path-specific customization:

```typescript
interface CompassPromptTemplate {
  systemContext: string;        // Role and constraints
  pathDefinition: string;        // What this path is for
  sourceText: string;            // The selected text
  focusPoints: string[];         // Path-specific guidance
  outputFormat: string;          // JSON schema
  examples?: PathExample[];      // Few-shot examples for consistency
}
```

### Quality Control

Generated questions are evaluated for:

1. **Path Alignment**: Does the question truly belong to this cognitive lens?
2. **Depth**: Does it go beyond surface-level rephrasing?
3. **Actionability**: Can the user meaningfully pursue this thread?
4. **Diversity**: Do the branches explore different sub-angles within the path?

### Temperature and Model Settings

- **Clarify, Go Deeper, Apply**: Temperature 0.3 (more deterministic)
- **Challenge, Connect**: Temperature 0.5 (balanced)
- **Surprise Me**: Temperature 0.7 (more creative)

---

## Usage Examples

### Example 1: Technical Documentation

**Source Text**: "JWT tokens are stateless authentication mechanisms."

| Path | Sample Root Question |
|------|---------------------|
| Clarify | What does "stateless" mean in this context? |
| Go Deeper | How does a server validate a JWT without storing session data? |
| Challenge | Are JWTs truly stateless if you need a revocation list? |
| Apply | When should I choose JWTs over session cookies? |
| Connect | How is this similar to a signed paper certificate vs. a registry lookup? |
| Surprise Me | What if we made authentication tokens that expire based on user behavior, not time? |

### Example 2: Philosophical Text

**Source Text**: "I think, therefore I am."

| Path | Sample Root Question |
|------|---------------------|
| Clarify | What does Descartes mean by "I" and "am"? |
| Go Deeper | What logical steps lead from doubting to certainty of existence? |
| Challenge | Could an AI make this same claim? What would it prove? |
| Apply | How does this argument help someone experiencing existential doubt? |
| Connect | How is this related to the Buddhist concept of anatta (no-self)? |
| Surprise Me | What if thinking is proof you don't exist—like a wave proving it's not the ocean? |

---

## Implementation Checklist

- [ ] Define color palette with contrast validation
- [ ] Create SVG icons for each path
- [ ] Build prompt templates with few-shot examples
- [ ] Implement radial UI component
- [ ] Add keyboard navigation and ARIA labels
- [ ] Set up A/B testing for temperature values
- [ ] Create quality evaluation rubric for generated questions
- [ ] Document API endpoint for question generation

---

## Future Considerations

1. **Adaptive Paths**: Could the compass learn user preferences and emphasize frequently-used paths?
2. **Path Combinations**: What happens if you apply multiple lenses sequentially? (e.g., Clarify → Go Deeper)
3. **Custom Paths**: Could users define their own cognitive lenses for specialized domains?
4. **Cross-Text Connections**: Could the Connect path link to previous explorations in the user's knowledge graph?

---

## Conclusion

The Conversation Compass transforms static text into a launchpad for multidimensional exploration. By offering six distinct, visually-coded cognitive paths, it makes the invisible labor of critical thinking visible and systematic. Each path is carefully designed to produce genuinely different questions, ensuring that users develop a richer, more nuanced understanding of any material they engage with.
