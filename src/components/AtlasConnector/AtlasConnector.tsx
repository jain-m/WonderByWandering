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
import { DURATION, EASING } from '../../utils/motion';

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
  target,
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

  // Primitive-returning selectors — Zustand's default Object.is comparison
  // prevents re-renders when the value hasn't changed (most of the time)
  const isSpawning = useAtlasStore((s) => {
    const targetNode = s.nodes.find((n) => n.id === target);
    return targetNode?.data?.isNew === true;
  });
  const spawnIndex = useAtlasStore((s) => {
    const targetNode = s.nodes.find((n) => n.id === target);
    return (targetNode?.data?.spawnIndex as number) ?? 0;
  });

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

  // Build edge animation: spawning draw-in takes priority, then active pulse
  const edgeAnimation = isSpawning
    ? `edge-draw-in ${DURATION.EDGE_DRAW}ms ${EASING.ENTRANCE} ${spawnIndex * DURATION.SIBLING_STAGGER}ms both`
    : isActive
      ? 'atlas-route-pulse 2s ease-in-out infinite'
      : 'none';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'var(--atlas-route-color, #B8B5AD)',
          strokeWidth: 2,
          opacity: isActive || isSpawning ? 1.0 : 0.3,
          strokeDasharray: isSpawning ? 1000 : undefined,
          strokeDashoffset: isSpawning ? 1000 : undefined,
          animation: edgeAnimation,
          transition: isSpawning ? 'none' : 'opacity 150ms ease',
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
