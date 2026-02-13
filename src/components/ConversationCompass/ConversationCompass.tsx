/**
 * ConversationCompass Component
 * E4-1: Build centered radial menu component
 *
 * Centered overlay on React Flow canvas showing 6 path buttons in a radial layout.
 * Only renders when uiMode === 'compass'.
 */

import React from 'react';
import { useAtlasStore } from '../../store/atlasStore';
import type { PathType } from '../../generation/mockGenerator';
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
// Component Props
// ============================================================

interface ConversationCompassProps {
  onPathSelect: (pathType: PathType) => void;
}

// ============================================================
// Component
// ============================================================

export const ConversationCompass: React.FC<ConversationCompassProps> = ({
  onPathSelect,
}) => {
  const { uiMode, session } = useAtlasStore();

  // Only render when in compass mode
  if (uiMode !== 'compass') {
    return null;
  }

  // Get source text excerpt (first ~100 characters)
  const sourceExcerpt = session?.sourceText
    ? session.sourceText.substring(0, 100) + (session.sourceText.length > 100 ? '...' : '')
    : 'No source text available';

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Center card with source text */}
        <div className={styles.centerCard}>
          <div className={styles.centerText}>{sourceExcerpt}</div>
        </div>

        {/* Path buttons arranged in circle */}
        {PATHS.map((path, index) => {
          const position = getPathPosition(index);

          return (
            <button
              key={path.type}
              className={styles.pathButton}
              data-path={path.type}
              onClick={() => onPathSelect(path.type)}
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
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
