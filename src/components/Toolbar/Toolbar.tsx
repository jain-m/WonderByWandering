/**
 * Canvas Toolbar — floating control toolbar
 * E7-1: Build canvas toolbar
 */

import { memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAtlasStore } from '../../store/atlasStore';
import styles from './Toolbar.module.css';

function ToolbarComponent() {
  const { fitView } = useReactFlow();
  const { activeNodeId, nodes, edges, session, resetCanvas, setActiveNode } = useAtlasStore();

  const handleRecenter = () => {
    if (activeNodeId) {
      const node = nodes.find(n => n.id === activeNodeId);
      if (node) {
        fitView({ nodes: [node], padding: 0.5, duration: 300 });
      }
    }
  };

  const handleBackToSeed = () => {
    const targetIds = new Set(edges.map(e => e.target));
    const root = nodes.find(n => !targetIds.has(n.id));
    if (root) {
      setActiveNode(root.id);
      fitView({ nodes: [root], padding: 0.5, duration: 300 });
    }
  };

  const handleFitAll = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleReset = () => {
    resetCanvas();
  };

  const handleDemoToggle = () => {
    if (!session) return;
    // Toggle demoMode in session via storage
    const updated = { ...session, demoMode: !session.demoMode };
    useAtlasStore.getState().setSession(updated);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [`session_${session.sessionId}`]: updated });
    }
  };

  return (
    <div className={styles.toolbar}>
      <button
        className={styles.button}
        onClick={handleReset}
        title="Reset canvas"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 8a6 6 0 0 1 10.3-4.2M14 8a6 6 0 0 1-10.3 4.2" />
          <path d="M14 2v4h-4M2 14v-4h4" />
        </svg>
      </button>

      <button
        className={styles.button}
        onClick={handleRecenter}
        title="Recenter on active node"
        disabled={!activeNodeId}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v3M8 12v3M1 8h3M12 8h3" />
        </svg>
      </button>

      <button
        className={styles.button}
        onClick={handleFitAll}
        title="Fit all nodes"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
        </svg>
      </button>

      <button
        className={styles.button}
        onClick={handleBackToSeed}
        title="Back to seed node"
        disabled={nodes.length === 0}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="5" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
        </svg>
      </button>

      <div className={styles.divider} />

      <button
        className={`${styles.button} ${session?.demoMode ? styles.buttonActive : ''}`}
        onClick={handleDemoToggle}
        title={session?.demoMode ? 'Demo mode (ON)' : 'Demo mode (OFF)'}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2L5 9h6l-1-7H6z" />
          <circle cx="8" cy="12" r="2" />
        </svg>
      </button>
    </div>
  );
}

export const Toolbar = memo(ToolbarComponent);
