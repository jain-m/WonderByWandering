import { useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface Session {
  sessionId: string;
  sourceText: string;
  coreQuestion: string;
  pathSuggestions: string[];
  demoMode: boolean;
  createdAt: number;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Read sessionId from URL and load session from chrome.storage.local
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');

    if (!sessionId) {
      setLoading(false);
      return;
    }

    const key = `session_${sessionId}`;

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([key], (result: Record<string, Session>) => {
        const data = result[key];
        if (data) {
          setSession(data);
        }
        setLoading(false);
      });
    } else {
      // Fallback for dev mode outside extension
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
        Loading session...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', background: 'var(--atlas-paper-bg, #faf9f6)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-paper-grid-dot, #e8e6e1)" />
        <Controls />
      </ReactFlow>

      {/* Session info overlay — will be replaced by ConversationCompass in E4-1 */}
      {session && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--atlas-card-bg, #fff)',
          border: '1px solid var(--atlas-card-border, #e0ddd5)',
          borderRadius: 'var(--radius-card, 12px)',
          padding: '24px',
          maxWidth: '480px',
          boxShadow: 'var(--shadow-card, 0 2px 8px rgba(0,0,0,0.08))',
          textAlign: 'center',
          zIndex: 10,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary, #1a1a1a)' }}>
            Knowledge Atlas
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted, #8a8a8a)', marginBottom: '16px' }}>
            {session.coreQuestion}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary, #4a4a4a)', lineHeight: 1.6 }}>
            {session.sourceText.length > 200
              ? session.sourceText.substring(0, 200) + '...'
              : session.sourceText}
          </p>
        </div>
      )}
    </div>
  );
}
