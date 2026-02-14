/**
 * AtlasCard — Custom React Flow Node Component
 * E3-3: Build AtlasCard custom React Flow node — the structural shell
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Handle, Position, type NodeProps, type Node, type Edge } from '@xyflow/react';
import { useAtlasStore } from '../../store/atlasStore';
import type { AtlasNodeData } from '../../store/atlasStore';
import type { PathType, BranchType } from '../../generation/mockGenerator';
import { generateAnswer, generateBranches } from '../../generation';
import { startGeneration, markResolved, markError } from '../../utils/nodeStates';
import { DURATION } from '../../utils/motion';
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
  // Granular selectors — only re-render when THIS node's relevant state changes
  const nodeState = useAtlasStore((s) => s.nodeStates[id] || 'idle');
  const isAnswerVisible = useAtlasStore((s) => s.answerVisibility[id] || false);
  const activeNodeId = useAtlasStore((s) => s.activeNodeId);
  const toggleAnswer = useAtlasStore((s) => s.toggleAnswer);
  const updateNodeData = useAtlasStore((s) => s.updateNodeData);
  const addNodes = useAtlasStore((s) => s.addNodes);
  const addEdges = useAtlasStore((s) => s.addEdges);
  const setActiveNode = useAtlasStore((s) => s.setActiveNode);
  const edges = useAtlasStore((s) => s.edges);
  const isCollapsed = useAtlasStore((s) => !!s.collapsedBranches[id]);
  const collapseBranch = useAtlasStore((s) => s.collapseBranch);
  const expandBranch = useAtlasStore((s) => s.expandBranch);

  const isActive = activeNodeId === id;
  const accentColor = PATH_COLORS[data.pathType];

  // Clear isNew flag after spawn animation completes (prevents re-trigger on viewport changes)
  useEffect(() => {
    if (data.isNew) {
      const staggerDelay = (data.spawnIndex ?? 0) * DURATION.SIBLING_STAGGER;
      const totalDuration = DURATION.CARD_FADE_DELAY + staggerDelay + DURATION.CARD_FADE_IN + 50;
      const timer = setTimeout(() => {
        updateNodeData(id, { isNew: false });
      }, totalDuration);
      return () => clearTimeout(timer);
    }
  }, [data.isNew, data.spawnIndex, id, updateNodeData]);

  // Check if this node is on the active thread (root -> activeNodeId path)
  const isOnActiveThread = useMemo(() => {
    if (!activeNodeId) return false;
    if (id === activeNodeId) return true;

    // Build parent map: childId -> parentId
    const parentOf = new Map<string, string>();
    for (const edge of edges) {
      parentOf.set(edge.target, edge.source);
    }

    // Walk from activeNodeId to root, collecting node IDs
    let current = activeNodeId;
    while (current) {
      if (current === id) return true;
      current = parentOf.get(current) || '';
    }
    return false;
  }, [edges, activeNodeId, id]);

  // Check if this node has children (is non-leaf)
  const hasChildren = useMemo(() => {
    return edges.some((e) => e.source === id);
  }, [edges, id]);

  // Build summary data when this branch is collapsed
  const branchSummary = useMemo(() => {
    if (!isCollapsed) return null;
    const state = useAtlasStore.getState();
    const collapsed = state.collapsedBranches[id];
    if (!collapsed) return null;

    const hiddenNodes = state.nodes.filter((n) =>
      collapsed.hiddenNodeIds.includes(n.id)
    );
    const answeredNodes = hiddenNodes.filter((n) => n.data.answer);
    const bullets = answeredNodes
      .map((n) => n.data.answer!.summary)
      .slice(0, 3); // max 3 key summaries

    return {
      nodeCount: hiddenNodes.length,
      answeredCount: answeredNodes.length,
      bullets,
    };
  }, [isCollapsed, id]);

  const handleShowAnswer = useCallback(async () => {
    if (!startGeneration(id)) return; // prevents duplicate calls

    try {
      const result = await generateAnswer({
        question: data.question,
        context: data.context,
        pathType: data.pathType,
        sourceText: data.sourceText,
      });

      // Store answer in node data
      updateNodeData(id, { answer: result });
      markResolved(id);
      // Make answer visible — read lazily to avoid subscribing to entire answerVisibility
      if (!useAtlasStore.getState().answerVisibility[id]) {
        toggleAnswer(id);
      }
    } catch (err) {
      markError(id);
    }
  }, [id, data, updateNodeData, toggleAnswer]);

  const handleBranch = useCallback(async (branchType: BranchType) => {
    try {
      const branches = await generateBranches({
        question: data.question,
        context: data.context,
        answer: data.answer,
        pathType: data.pathType,
        sourceText: data.sourceText,
      }, branchType);

      // Read nodes lazily — no subscription needed for one-shot position lookup
      const currentNode = useAtlasStore.getState().nodes.find((n) => n.id === id);
      const parentX = currentNode?.position?.x ?? 0;
      const parentY = currentNode?.position?.y ?? 0;

      // Position children below parent with even spacing
      const childCount = branches.length;
      const spacing = 300;
      const yOffset = 300;
      const startX = parentX - ((childCount - 1) * spacing) / 2;

      const newNodes: Node<AtlasNodeData>[] = branches.map((branch, index) => ({
        id: `node-${Date.now()}-branch-${index}`,
        type: 'atlasCard',
        position: { x: startX + index * spacing, y: parentY + yOffset },
        data: {
          question: branch.question,
          context: branch.context,
          pathType: data.pathType,
          sourceText: data.sourceText,
          isNew: true,
          spawnIndex: index,
        },
      }));

      const newEdges: Edge[] = newNodes.map((node) => ({
        id: `edge-${id}-${node.id}`,
        source: id,
        target: node.id,
        type: 'atlasConnector',
      }));

      addNodes(newNodes);
      addEdges(newEdges);
      const firstNode = newNodes[0];
      if (firstNode) {
        setActiveNode(firstNode.id);
      }
    } catch (error) {
      console.error('Failed to generate branches:', error);
    }
  }, [id, data, addNodes, addEdges, setActiveNode]);

  // Determine card CSS classes
  const cardClasses = [
    styles.card,
    isActive && styles.cardActive,
    !isActive && isOnActiveThread && styles.cardOnThread,
    data.isNew && styles.cardSpawn,
    nodeState === 'loading' && styles.loadingState,
    nodeState === 'error' && styles.errorState,
  ]
    .filter(Boolean)
    .join(' ');

  // Stagger animation delay based on spawnIndex
  const spawnStyle = data.isNew
    ? {
        animationDelay: `${
          DURATION.CARD_FADE_DELAY + (data.spawnIndex ?? 0) * DURATION.SIBLING_STAGGER
        }ms`,
      }
    : undefined;

  return (
    <div className={cardClasses} style={spawnStyle}>
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
          onClick={handleShowAnswer}
        >
          Show Answer
        </button>
      )}

      {nodeState === 'loading' && <div className={styles.spinner} />}

      {nodeState === 'error' && (
        <>
          <p className={styles.errorMessage}>Failed to load answer</p>
          <button className={styles.retryButton} onClick={handleShowAnswer}>
            Retry
          </button>
        </>
      )}

      {/* 5. Answer Body + 6. Branch Footer — animated reveal */}
      {nodeState === 'resolved' && data.answer && (
        <div
          className={`${styles.answerReveal}${isAnswerVisible ? ` ${styles.answerVisible}` : ''}`}
        >
          <div className={styles.answerRevealInner}>
            <div className={styles.answerBody}>
              <p className={styles.answerSummary}>{data.answer.summary}</p>
              <ul className={styles.answerBullets}>
                {data.answer.bullets.map((bullet, index) => (
                  <li key={index}>{bullet}</li>
                ))}
              </ul>
            </div>
            <div className={styles.branchFooter}>
              <button
                className={styles.branchButton}
                style={{ borderColor: accentColor, color: accentColor }}
                onClick={() => handleBranch('question')}
              >
                Branch: Question
              </button>
              <button
                className={styles.branchButton}
                style={{ borderColor: accentColor, color: accentColor }}
                onClick={() => handleBranch('answer')}
              >
                Branch: Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Summarize / Expand Branch Controls */}
      {hasChildren && !isCollapsed && nodeState === 'resolved' && (
        <button
          className={styles.summarizeButton}
          onClick={() => collapseBranch(id)}
        >
          Summarize Branch
        </button>
      )}

      {isCollapsed && branchSummary && (
        <div className={styles.branchSummary}>
          <div className={styles.summaryHeader}>
            {branchSummary.nodeCount} node{branchSummary.nodeCount !== 1 ? 's' : ''} ({branchSummary.answeredCount} answered)
          </div>
          {branchSummary.bullets.length > 0 && (
            <ul className={styles.summaryBullets}>
              {branchSummary.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}
          <button
            className={styles.expandButton}
            onClick={() => expandBranch(id)}
          >
            Expand Branch
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
