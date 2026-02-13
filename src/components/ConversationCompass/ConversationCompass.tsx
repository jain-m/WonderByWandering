/**
 * ConversationCompass Component
 * E4-1: Build centered radial menu component
 * E4-2: Path click → node tree creation
 *
 * Centered overlay on React Flow canvas showing 6 path buttons in a radial layout.
 * Only renders when uiMode === 'compass'.
 */

import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAtlasStore } from '../../store/atlasStore';
import { generatePathQuestions } from '../../generation';
import type { PathType } from '../../generation/mockGenerator';
import type { Node, Edge } from '@xyflow/react';
import type { AtlasNodeData } from '../../store/atlasStore';
import styles from './ConversationCompass.module.css';

// ============================================================
// Path Definitions
// ============================================================

interface PathDefinition {
  type: PathType;
  label: string;
  color: string;
  description: string;
}

const PATHS: PathDefinition[] = [
  {
    type: 'clarify',
    label: 'Clarify',
    color: '#4A90D9',
    description: 'Disambiguate meaning',
  },
  {
    type: 'go-deeper',
    label: 'Go Deeper',
    color: '#7B4FBF',
    description: 'Explore mechanisms',
  },
  {
    type: 'challenge',
    label: 'Challenge',
    color: '#D94F4F',
    description: 'Find counterarguments',
  },
  {
    type: 'apply',
    label: 'Apply',
    color: '#3DAA6D',
    description: 'Practical applications',
  },
  {
    type: 'connect',
    label: 'Connect',
    color: '#D98F2E',
    description: 'Find relationships',
  },
  {
    type: 'surprise',
    label: 'Surprise Me',
    color: '#C44FC9',
    description: 'Unexpected angles',
  },
];

// ============================================================
// Radial Layout Math
// ============================================================

const RADIUS = 160; // Distance from center to path buttons
const ANGLE_STEP = 60; // 360 / 6 paths = 60 degrees

/**
 * Calculate x,y position for a path button in the radial layout
 */
function getPathPosition(index: number): { x: number; y: number } {
  const angleDeg = index * ANGLE_STEP;
  const angleRad = (angleDeg - 90) * (Math.PI / 180); // Start at top (-90 offset)

  return {
    x: Math.cos(angleRad) * RADIUS,
    y: Math.sin(angleRad) * RADIUS,
  };
}

// ============================================================
// Component
// ============================================================

export const ConversationCompass: React.FC = () => {
  const { uiMode, session, addNodes, addEdges, setUiMode, setActiveNode } = useAtlasStore();
  const { fitView } = useReactFlow();
  const [loading, setLoading] = useState(false);

  // Only render when in compass mode
  if (uiMode !== 'compass') {
    return null;
  }

  // Get source text excerpt (first ~100 characters)
  const sourceExcerpt = session?.sourceText
    ? session.sourceText.substring(0, 100) + (session.sourceText.length > 100 ? '...' : '')
    : 'No source text available';

  // Handle path selection: generate node tree
  const handlePathSelect = async (pathType: PathType, pathLabel: string) => {
    if (!session?.sourceText) return;

    setLoading(true);

    try {
      // Get questions from mock generator
      const result = await generatePathQuestions(session.sourceText, pathType);

      // Create root node ID
      const rootId = `node-${Date.now()}`;

      // Create root node
      const rootNode: Node<AtlasNodeData> = {
        id: rootId,
        type: 'atlasCard',
        position: { x: 0, y: 0 },
        data: {
          question: result.rootQuestion,
          pathType,
          sourceText: session.sourceText,
          context: 'Root question from ' + pathLabel,
          isNew: true,
          spawnIndex: 0,
        },
      };

      // Create branch nodes (2-3 branches)
      const branchCount = result.branches.length;
      const xPositions = branchCount === 3
        ? [-300, 0, 300]
        : branchCount === 2
          ? [-200, 200]
          : [0];

      const branchNodes: Node<AtlasNodeData>[] = result.branches.map((branch, index) => ({
        id: `node-${Date.now()}-branch-${index}`,
        type: 'atlasCard',
        position: { x: xPositions[index] || 0, y: 250 },
        data: {
          question: branch.question,
          context: branch.context,
          pathType,
          sourceText: session.sourceText,
          isNew: true,
          spawnIndex: index + 1,
        },
      }));

      // Create edges from root to each branch
      const edges: Edge[] = branchNodes.map((branchNode) => ({
        id: `edge-${rootId}-${branchNode.id}`,
        source: rootId,
        target: branchNode.id,
        type: 'atlasConnector',
      }));

      // Add nodes and edges to store
      addNodes([rootNode, ...branchNodes]);
      addEdges(edges);

      // Switch to exploring mode
      setUiMode('exploring');
      setActiveNode(rootId);

      // Fit view after a short delay to allow nodes to render
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 50);

    } catch (error) {
      console.error('Failed to generate path questions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Center card with source text */}
        <div className={styles.centerCard}>
          <div className={styles.centerText}>
            {loading ? 'Generating...' : sourceExcerpt}
          </div>
        </div>

        {/* Path buttons arranged in circle */}
        {PATHS.map((path, index) => {
          const position = getPathPosition(index);

          return (
            <button
              key={path.type}
              className={styles.pathButton}
              data-path={path.type}
              onClick={() => handlePathSelect(path.type, path.label)}
              disabled={loading}
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
              aria-label={`${path.label}: ${path.description}`}
            >
              <div className={styles.pathAccent} />
              <div className={styles.pathLabel}>{path.label}</div>
              <div className={styles.tooltip}>{path.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationCompass;
