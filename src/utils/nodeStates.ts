/**
 * Node State Machine
 * E5-4: Implement node state machine
 *
 * States: idle → loading → resolved | error
 *         error → loading (retry)
 *
 * All transitions are driven through Zustand actions.
 */

import { useAtlasStore } from '../store/atlasStore';
import type { NodeState } from '../store/atlasStore';

// ============================================================
// Valid Transitions
// ============================================================

const VALID_TRANSITIONS: Record<NodeState, NodeState[]> = {
  idle: ['loading'],
  loading: ['resolved', 'error'],
  error: ['loading'],
  resolved: [], // terminal state (for answer generation)
};

/**
 * Attempt a state transition. Returns true if valid, false if rejected.
 */
export function transitionNodeState(
  nodeId: string,
  targetState: NodeState
): boolean {
  const currentState = useAtlasStore.getState().nodeStates[nodeId] ?? 'idle';
  const validTargets = VALID_TRANSITIONS[currentState];

  if (!validTargets?.includes(targetState)) {
    console.warn(
      `Invalid node state transition: ${currentState} → ${targetState} for node ${nodeId}`
    );
    return false;
  }

  useAtlasStore.getState().setNodeState(nodeId, targetState);
  return true;
}

/**
 * Check if a node is currently in a loading state.
 * Prevents duplicate generation calls.
 */
export function isNodeLoading(nodeId: string): boolean {
  return (useAtlasStore.getState().nodeStates[nodeId] ?? 'idle') === 'loading';
}

/**
 * Get the current state of a node.
 */
export function getNodeState(nodeId: string): NodeState {
  return useAtlasStore.getState().nodeStates[nodeId] ?? 'idle';
}

// ============================================================
// Common Transition Helpers
// ============================================================

/** Start answer generation for a node (idle → loading) */
export function startGeneration(nodeId: string): boolean {
  if (isNodeLoading(nodeId)) {
    console.warn(`Node ${nodeId} is already loading, skipping duplicate call`);
    return false;
  }
  return transitionNodeState(nodeId, 'loading');
}

/** Mark generation as successful (loading → resolved) */
export function markResolved(nodeId: string): boolean {
  return transitionNodeState(nodeId, 'resolved');
}

/** Mark generation as failed (loading → error) */
export function markError(nodeId: string): boolean {
  return transitionNodeState(nodeId, 'error');
}

/** Retry after error (error → loading) */
export function retryGeneration(nodeId: string): boolean {
  return transitionNodeState(nodeId, 'loading');
}
