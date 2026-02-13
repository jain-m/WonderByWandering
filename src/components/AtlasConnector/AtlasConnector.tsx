/**
 * AtlasConnector — Custom React Flow edge for Knowledge Atlas
 * E3-4: Build AtlasConnector custom edge
 *
 * Single edge style: bezier curve, 2px stroke, opacity-based states.
 * Active thread edges pulse, idle edges are dimmed.
 */

import { memo, useMemo } from 'react';
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { useAtlasStore } from '../../store/atlasStore';

// Build active thread path by walking parent edges from root to activeNodeId
function getActiveThreadEdgeIds(
  edges: { id: string; source: string; target: string }[],
  activeNodeId: string | null
): Set<string> {
  if (!activeNodeId) return new Set();

  // Build parent map: childId -> edge
  const parentEdge = new Map<string, { id: string; source: string }>();
  for (const edge of edges) {
    parentEdge.set(edge.target, { id: edge.id, source: edge.source });
  }

  // Walk from activeNodeId to root
  const activeIds = new Set<string>();
  let current = activeNodeId;
  while (parentEdge.has(current)) {
    const edge = parentEdge.get(current)!;
    activeIds.add(edge.id);
    current = edge.source;
  }

  return activeIds;
}

function AtlasConnectorComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
}: EdgeProps) {
  const activeNodeId = useAtlasStore((s) => s.activeNodeId);
  const edges = useAtlasStore((s) => s.edges);

  const activeThreadEdgeIds = useMemo(
    () => getActiveThreadEdgeIds(edges, activeNodeId),
    [edges, activeNodeId]
  );

  const isActive = activeThreadEdgeIds.has(id);

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'var(--atlas-route-color, #B8B5AD)',
          strokeWidth: 2,
          opacity: isActive ? 1.0 : 0.3,
          animation: isActive ? 'atlas-route-pulse 2s ease-in-out infinite' : 'none',
          transition: 'opacity 150ms ease',
          ...style,
        }}
      />
      {/* Wider invisible hit area for hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
      />
    </>
  );
}

export const AtlasConnector = memo(AtlasConnectorComponent);

// Edge type registration object for React Flow
export const edgeTypes = {
  atlasConnector: AtlasConnector,
};
