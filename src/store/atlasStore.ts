/**
 * Atlas Store — Zustand state management for Knowledge Atlas
 * E3-2: Set up Zustand store
 */

import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type { PathType, AnswerResult } from '../generation/mockGenerator';

// ============================================================
// Types
// ============================================================

export type NodeState = 'idle' | 'loading' | 'error' | 'resolved';
export type UiMode = 'compass' | 'exploring';

export interface Session {
  sessionId: string;
  sourceText: string;
  coreQuestion: string;
  pathSuggestions: string[];
  demoMode: boolean;
  createdAt: number;
}

export interface AtlasNodeData {
  question: string;
  context?: string;
  answer?: AnswerResult;
  pathType: PathType;
  sourceText: string;
  isNew?: boolean; // for spawn animation
  spawnIndex?: number; // sibling index for stagger animation
  [key: string]: unknown; // React Flow requires this
}

// ============================================================
// Store Interface
// ============================================================

interface AtlasState {
  // Data
  nodes: Node<AtlasNodeData>[];
  edges: Edge[];
  session: Session | null;

  // UI state
  activeNodeId: string | null;
  uiMode: UiMode;
  answerVisibility: Record<string, boolean>;
  nodeStates: Record<string, NodeState>;

  // Actions
  addNode: (node: Node<AtlasNodeData>) => void;
  addNodes: (nodes: Node<AtlasNodeData>[]) => void;
  addEdge: (edge: Edge) => void;
  addEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: Partial<AtlasNodeData>) => void;
  setActiveNode: (id: string | null) => void;
  toggleAnswer: (nodeId: string) => void;
  setNodeState: (nodeId: string, state: NodeState) => void;
  setUiMode: (mode: UiMode) => void;
  setSession: (session: Session) => void;
  loadSession: (sessionId: string) => Promise<void>;
  resetCanvas: () => void;

  // React Flow callbacks
  onNodesChange: OnNodesChange<Node<AtlasNodeData>>;
  onEdgesChange: OnEdgesChange;
}

// ============================================================
// Initial State
// ============================================================

const initialState = {
  nodes: [] as Node<AtlasNodeData>[],
  edges: [] as Edge[],
  session: null as Session | null,
  activeNodeId: null as string | null,
  uiMode: 'compass' as UiMode,
  answerVisibility: {} as Record<string, boolean>,
  nodeStates: {} as Record<string, NodeState>,
};

// ============================================================
// Store
// ============================================================

export const useAtlasStore = create<AtlasState>()((set, get) => ({
  ...initialState,

  // --- Node/Edge mutations ---

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  addNodes: (newNodes) =>
    set((state) => ({ nodes: [...state.nodes, ...newNodes] })),

  addEdge: (edge) =>
    set((state) => ({ edges: [...state.edges, edge] })),

  addEdges: (newEdges) =>
    set((state) => ({ edges: [...state.edges, ...newEdges] })),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    })),

  // --- UI state ---

  setActiveNode: (id) => set({ activeNodeId: id }),

  toggleAnswer: (nodeId) =>
    set((state) => ({
      answerVisibility: {
        ...state.answerVisibility,
        [nodeId]: !state.answerVisibility[nodeId],
      },
    })),

  setNodeState: (nodeId, nodeState) =>
    set((state) => ({
      nodeStates: {
        ...state.nodeStates,
        [nodeId]: nodeState,
      },
    })),

  setUiMode: (mode) => set({ uiMode: mode }),

  // --- Session ---

  setSession: (session) => set({ session }),

  loadSession: async (sessionId) => {
    const key = `session_${sessionId}`;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise<void>((resolve) => {
        chrome.storage.local.get([key], (result: Record<string, Session>) => {
          const data = result[key];
          if (data) {
            set({ session: data });
          }
          resolve();
        });
      });
    }
  },

  // --- Reset ---

  resetCanvas: () =>
    set({
      ...initialState,
      session: get().session, // preserve session on reset
    }),

  // --- React Flow controlled callbacks ---

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),
}));
