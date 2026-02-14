/**
 * Canvas Persistence — save/restore canvas state to chrome.storage.local
 * E3-6: Implement canvas persist/rehydrate
 */

import { useEffect, useRef } from 'react';
import { useAtlasStore } from './atlasStore';

// ============================================================
// Types
// ============================================================

interface PersistedState {
  nodes: ReturnType<typeof useAtlasStore.getState>['nodes'];
  edges: ReturnType<typeof useAtlasStore.getState>['edges'];
  activeNodeId: string | null;
  uiMode: 'compass' | 'exploring';
  answerVisibility: Record<string, boolean>;
  nodeStates: Record<string, string>;
}

// ============================================================
// Debounce helper
// ============================================================

function debounce(
  fn: (sessionId: string) => void,
  ms: number
): (sessionId: string) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (sessionId: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(sessionId), ms);
  };
}

// ============================================================
// Save state to chrome.storage.local
// ============================================================

function saveState(sessionId: string): void {
  const state = useAtlasStore.getState();
  const persisted: PersistedState = {
    nodes: state.nodes,
    edges: state.edges,
    activeNodeId: state.activeNodeId,
    uiMode: state.uiMode,
    answerVisibility: state.answerVisibility,
    nodeStates: state.nodeStates,
  };

  const key = `canvas_${sessionId}`;

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ [key]: persisted });
  }
}

const debouncedSave = debounce(saveState, 500);

// ============================================================
// Load state from chrome.storage.local
// ============================================================

export async function loadPersistedState(
  sessionId: string
): Promise<PersistedState | null> {
  const key = `canvas_${sessionId}`;

  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return null;
  }

  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result: Record<string, unknown>) => {
      const data = result[key] as PersistedState | undefined;
      if (data && data.nodes && data.edges) {
        resolve(data);
      } else {
        resolve(null);
      }
    });
  });
}

// ============================================================
// Rehydrate store from persisted state
// ============================================================

export function rehydrateStore(persisted: PersistedState): void {
  // Use setState to avoid overwriting actions
  useAtlasStore.setState({
    nodes: persisted.nodes,
    edges: persisted.edges,
    activeNodeId: persisted.activeNodeId,
    uiMode: persisted.uiMode,
    answerVisibility: persisted.answerVisibility,
    nodeStates: persisted.nodeStates as Record<string, 'idle' | 'loading' | 'error' | 'resolved'>,
  });
}

// ============================================================
// React hook for auto-persistence
// ============================================================

export function useCanvasPersistence(sessionId: string | null): void {
  const isInitialized = useRef(false);

  // Subscribe to relevant state changes and persist
  useEffect(() => {
    if (!sessionId) return;

    // Skip first render (we may be rehydrating)
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    const unsub = useAtlasStore.subscribe(() => {
      debouncedSave(sessionId);
    });

    return unsub;
  }, [sessionId]);
}
