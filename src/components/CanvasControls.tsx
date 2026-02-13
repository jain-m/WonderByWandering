/**
 * Canvas Controls — viewport controls for Knowledge Atlas
 * E3-5: Implement viewport controls
 *
 * Provides pan, zoom, fit-to-view, and keyboard shortcuts.
 */

import { useEffect, useCallback } from 'react';
import { useReactFlow, MiniMap } from '@xyflow/react';

export function CanvasControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+0 or Ctrl+0: fit to view
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        handleFitView();
      }
      // Cmd+= or Ctrl+=: zoom in
      if ((e.metaKey || e.ctrlKey) && e.key === '=') {
        e.preventDefault();
        zoomIn({ duration: 200 });
      }
      // Cmd+- or Ctrl+-: zoom out
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault();
        zoomOut({ duration: 200 });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFitView, zoomIn, zoomOut]);

  return (
    <MiniMap
      nodeStrokeWidth={3}
      pannable
      zoomable
      style={{
        backgroundColor: 'var(--atlas-paper-bg, #faf9f6)',
        border: '1px solid var(--atlas-card-border, #e0ddd5)',
        borderRadius: 'var(--radius-card, 12px)',
      }}
    />
  );
}
