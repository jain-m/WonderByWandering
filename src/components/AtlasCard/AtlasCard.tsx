/**
 * AtlasCard — Custom React Flow Node Component
 * E3-3: Build AtlasCard custom React Flow node — the structural shell
 */

import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useAtlasStore } from '../../store/atlasStore';
import type { AtlasNodeData } from '../../store/atlasStore';
import type { PathType } from '../../generation/mockGenerator';
import styles from './AtlasCard.module.css';
import '../AtlasConnector/AtlasConnector.css';

// ============================================================
// Path Type Color Mapping
// ============================================================

const PATH_COLORS: Record<PathType, string> = {
  clarify: 'var(--color-path-clarify)',
  'go-deeper': 'var(--color-path-go-deeper)',
  challenge: 'var(--color-path-challenge)',
  apply: 'var(--color-path-apply)',
  connect: 'var(--color-path-connect)',
  surprise: 'var(--color-path-surprise)',
};

const PATH_LABELS: Record<PathType, string> = {
  clarify: 'Clarify',
  'go-deeper': 'Go Deeper',
  challenge: 'Challenge',
  apply: 'Apply',
  connect: 'Connect',
  surprise: 'Surprise',
};

// ============================================================
// AtlasCard Component
// ============================================================

type AtlasCardNode = Node<AtlasNodeData>;

const AtlasCard: React.FC<NodeProps<AtlasCardNode>> = ({ id, data }) => {
  const { answerVisibility, nodeStates, activeNodeId, toggleAnswer } = useAtlasStore();

  const nodeState = nodeStates[id] || 'idle';
  const isAnswerVisible = answerVisibility[id] || false;
  const isActive = activeNodeId === id;
  const accentColor = PATH_COLORS[data.pathType];

  // Determine card CSS classes
  const cardClasses = [
    styles.card,
    isActive && styles.cardActive,
    nodeState === 'loading' && styles.loadingState,
    nodeState === 'error' && styles.errorState,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses}>
      {/* Target Handle (top) */}
      <Handle type="target" position={Position.Top} />

      {/* 1. Path Badge */}
      <div className={styles.pathBadge} style={{ backgroundColor: accentColor }}>
        {PATH_LABELS[data.pathType]}
      </div>

      {/* 2. Question */}
      <h3 className={styles.question}>{data.question}</h3>

      {/* 3. Context Line (optional) */}
      {data.context && <p className={styles.contextLine}>{data.context}</p>}

      {/* 4. Show Answer Button / Spinner / Error */}
      {nodeState === 'idle' && (
        <button
          className={styles.showAnswerButton}
          style={{ backgroundColor: accentColor }}
          onClick={() => toggleAnswer(id)}
        >
          Show Answer
        </button>
      )}

      {nodeState === 'loading' && <div className={styles.spinner} />}

      {nodeState === 'error' && (
        <>
          <p className={styles.errorMessage}>Failed to load answer</p>
          <button className={styles.retryButton} onClick={() => toggleAnswer(id)}>
            Retry
          </button>
        </>
      )}

      {/* 5. Answer Body (only when resolved AND visible) */}
      {nodeState === 'resolved' && isAnswerVisible && data.answer && (
        <div className={styles.answerBody}>
          <p className={styles.answerSummary}>{data.answer.summary}</p>
          <ul className={styles.answerBullets}>
            {data.answer.bullets.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Branch Footer (only when resolved AND visible) */}
      {nodeState === 'resolved' && isAnswerVisible && (
        <div className={styles.branchFooter}>
          <button
            className={styles.branchButton}
            style={{ borderColor: accentColor, color: accentColor }}
            disabled
          >
            Branch: Question
          </button>
          <button
            className={styles.branchButton}
            style={{ borderColor: accentColor, color: accentColor }}
            disabled
          >
            Branch: Answer
          </button>
        </div>
      )}

      {/* Source Handle (bottom) */}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// ============================================================
// Export with React.memo and nodeTypes registration
// ============================================================

export default React.memo(AtlasCard);

export const nodeTypes = {
  atlasCard: AtlasCard,
};
