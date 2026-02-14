# E0-3: Connector Style Specification

**Epic**: E0 - Visual Foundation
**Status**: Draft
**Last Updated**: 2026-02-13

## Overview

This specification defines the visual styling and behavioral states for connectors (edges) in the Atlas canvas. Connectors use cubic bezier curves with opacity-based state changes and subtle pulse animations to maintain a clean, map-like aesthetic.

---

## Single Edge Style

### Base Geometry
- **Shape**: Cubic bezier curve (React Flow's `BezierEdge` as base component)
- **Curvature**: Default React Flow bezier curvature (smooth, organic curves)

### Visual Properties
- **Stroke width**: `2px`
- **Stroke color**: `var(--atlas-route-color)` (default: `#B8B5AD`)
- **Fill**: `none`
- **Labels**: No labels on edges
- **Arrowheads**: No arrowheads (maintaining clean map aesthetic)

---

## States

Connector states are differentiated primarily through **opacity** and **animation**, keeping stroke color and width constant for visual consistency.

### 1. Idle State

The default state for all connectors not on the active thread.

```css
.atlas-edge-idle {
  opacity: 0.3;
  stroke: var(--atlas-route-color);
  stroke-width: 2px;
  fill: none;
}
```

- **Opacity**: `0.3` (subtle background presence)
- **Animation**: None
- **Purpose**: Provides context without visual clutter

### 2. Active Thread State

Applied to connectors on the path from root node to `activeNodeId`.

```css
.atlas-edge-active {
  opacity: 1.0;
  stroke: var(--atlas-route-color);
  stroke-width: 2px;
  fill: none;
  animation: atlas-route-pulse 2s ease-in-out infinite;
}

@keyframes atlas-route-pulse {
  0%, 100% {
    opacity: 1.0;
  }
  50% {
    opacity: 0.8;
  }
}
```

- **Opacity**: Oscillates between `1.0` → `0.8` → `1.0`
- **Animation**:
  - Duration: `2s`
  - Timing function: `ease-in-out`
  - Iteration: `infinite`
- **Purpose**: Draws attention to the current exploration path with subtle movement

### 3. Hover State

Applied when user hovers over any connector.

```css
.atlas-edge:hover {
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 150ms ease;
}
```

- **Opacity**: `0.6` (mid-point between idle and active)
- **Cursor**: `pointer`
- **Transition**: `150ms` ease for smooth opacity change
- **Purpose**: Provides interactive feedback

---

## Reduced-Motion Fallback

For users with motion sensitivity preferences, all animations are disabled.

```css
@media (prefers-reduced-motion: reduce) {
  .atlas-edge-active {
    opacity: 1.0;
    animation: none;
  }

  .atlas-edge:hover {
    opacity: 0.6;
    transition: none;
  }
}
```

- **Active thread**: Static `opacity: 1.0`, no pulse animation
- **Hover**: Opacity changes instantly without transition
- **Idle**: Unchanged (`opacity: 0.3`)

---

## Implementation Notes

### Component Architecture

1. **Base Component**
   - Extend React Flow's `BezierEdge` component
   - Override render to apply custom styling based on state

2. **Active Thread Detection**
   - Use BFS (Breadth-First Search) from root node to `activeNodeId`
   - Store active edge IDs in Zustand store (e.g., `activeThreadEdgeIds: Set<string>`)
   - Recompute on `activeNodeId` change

3. **State Management**
   ```typescript
   interface EdgeState {
     isActive: boolean;    // On active thread
     isIdle: boolean;      // Default state
     isHovered: boolean;   // Mouse over
   }
   ```

4. **Styling Application**
   - Apply via CSS className (preferred for performance)
   - Fallback to inline styles if dynamic values needed
   - All styles reference design tokens from E1-1

### Performance Considerations

- **Animation**: Use CSS animations (GPU-accelerated) rather than JavaScript
- **State updates**: Batch active thread recalculation on node selection
- **Hover**: Use CSS `:hover` pseudo-class to avoid React re-renders

### Accessibility

- **Keyboard navigation**: Edges should be focusable via keyboard when interactive
- **Focus indicators**: Apply hover state to focused edges
- **Reduced motion**: Mandatory support via `prefers-reduced-motion` media query

---

## Design Token References

All connector styles reference the design tokens defined in **E1-1: Design Token Definition**.

| Property | Token | Default Value |
|----------|-------|---------------|
| Stroke color | `--atlas-route-color` | `#B8B5AD` |
| Idle opacity | `--atlas-route-opacity-idle` | `0.3` |
| Active opacity | `--atlas-route-opacity-active` | `1.0` |
| Hover opacity | `--atlas-route-opacity-hover` | `0.6` |
| Stroke width | `--atlas-route-width` | `2px` |

---

## Visual Examples

### State Comparison

```
Idle:    ············ (opacity: 0.3, no animation)
Active:  ━━━━━━━━━━━━ (opacity: 1.0, pulsing)
Hover:   ━━━━━━━━━━━━ (opacity: 0.6, static)
```

### Active Thread Example

```
Root → Node A → Node B (active) → Node C
  ━━━━━━━━━      ············
  (active)        (idle)
```

Only the edges from Root → Node A → Node B are styled as active (pulsing). The edge from Node B → Node C remains idle.

---

## Open Questions

1. **Edge interaction**: Should clicking an edge navigate to its target node? (Deferred to interaction spec)
2. **Multiple paths**: If multiple paths exist to `activeNodeId`, highlight only one or all? (Recommend: shortest path only)
3. **Edge labels**: Future consideration for connection types/metadata? (Currently: none)

---

## Related Specifications

- **E1-1**: Design Token Definition (color and opacity values)
- **E0-1**: Node Style Specification (for visual consistency)
- **E2-1**: Active Thread Calculation (BFS algorithm implementation)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-13 | 1.0 | Initial specification |
