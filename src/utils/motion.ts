/**
 * Motion Choreography Constants
 * E1-4: Define motion choreography for Knowledge Atlas
 *
 * All durations and easings reference design tokens from tokens.css.
 * These constants are used programmatically in React components.
 */

// ============================================================
// Duration Constants (ms)
// ============================================================
export const DURATION = {
  FAST: 150,
  MEDIUM: 250,
  SLOW: 400,
  EDGE_DRAW: 200,
  CARD_FADE_IN: 200,
  CARD_FADE_DELAY: 150,    // delay after parent edge finishes
  SIBLING_STAGGER: 100,     // stagger between sibling cards
  ANSWER_EXPAND: 250,       // card height expansion
  ANSWER_CONTENT_FADE: 150, // answer text fade-in
  ANSWER_CONTENT_DELAY: 50, // delay after expansion starts
} as const;

// ============================================================
// Easing Functions
// ============================================================
export const EASING = {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  ENTRANCE: 'cubic-bezier(0, 0, 0.2, 1)',
  EXIT: 'cubic-bezier(0.4, 0, 1, 1)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

// ============================================================
// Animation Keyframes (for CSS-in-JS or programmatic use)
// ============================================================

/** Edge draw-in: stroke-dashoffset from full length to 0 */
export const EDGE_DRAW_KEYFRAMES: Keyframe[] = [
  { strokeDashoffset: '1', offset: 0 },
  { strokeDashoffset: '0', offset: 1 },
];

/** Card appearance: fade in + subtle scale up */
export const CARD_APPEAR_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: 'scale(0.95)', offset: 0 },
  { opacity: 1, transform: 'scale(1)', offset: 1 },
];

/** Answer reveal: height expansion (applied via max-height) */
export const ANSWER_EXPAND_KEYFRAMES: Keyframe[] = [
  { maxHeight: '0px', opacity: 0, offset: 0 },
  { maxHeight: '500px', opacity: 1, offset: 1 },
];

/** Route pulse: subtle opacity oscillation for active thread */
export const ROUTE_PULSE_KEYFRAMES: Keyframe[] = [
  { opacity: 1.0, offset: 0 },
  { opacity: 0.8, offset: 0.5 },
  { opacity: 1.0, offset: 1 },
];

// ============================================================
// Choreography Sequences
// ============================================================

/**
 * Sequence 1: Initial tree spawn (after compass path click)
 * t=0ms:     Edges begin drawing (stroke-dasharray animation)
 * t=150ms:   Cards fade in + scale 0.95→1.0 at edge endpoints
 * Stagger:   100ms between sibling (edge+card) pairs
 */
export function getSpawnTimings(siblingIndex: number) {
  const edgeStart = siblingIndex * DURATION.SIBLING_STAGGER;
  const cardStart = edgeStart + DURATION.CARD_FADE_DELAY;
  return {
    edgeStart,
    edgeDuration: DURATION.EDGE_DRAW,
    cardStart,
    cardDuration: DURATION.CARD_FADE_IN,
  };
}

/**
 * Sequence 2: Answer reveal (within single card)
 * t=0ms:     Card height expands smoothly
 * t=50ms:    Answer content fades in
 */
export function getAnswerRevealTimings() {
  return {
    expandStart: 0,
    expandDuration: DURATION.ANSWER_EXPAND,
    contentFadeStart: DURATION.ANSWER_CONTENT_DELAY,
    contentFadeDuration: DURATION.ANSWER_CONTENT_FADE,
  };
}

/**
 * Sequence 3: Branch spawn (from revealed card)
 * Same as Sequence 1 but relative to parent card position
 */
export const getBranchSpawnTimings = getSpawnTimings;

// ============================================================
// Reduced Motion Utilities
// ============================================================

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Get duration respecting reduced motion preference */
export function getAnimationDuration(baseDuration: number): number {
  return prefersReducedMotion() ? 0 : baseDuration;
}

/** Get animation options with reduced motion support */
export function getAnimationOptions(
  duration: number,
  easing: string = EASING.DEFAULT,
  delay: number = 0
): KeyframeAnimationOptions {
  const reduced = prefersReducedMotion();
  return {
    duration: reduced ? 0 : duration,
    easing: reduced ? 'linear' : easing,
    delay: reduced ? 0 : delay,
    fill: 'forwards' as FillMode,
  };
}
