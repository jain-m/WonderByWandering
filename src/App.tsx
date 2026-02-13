import { useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAtlasStore } from './store/atlasStore';
import { ConversationCompass } from './components/ConversationCompass/ConversationCompass';
import { nodeTypes } from './components/AtlasCard/AtlasCard';
import { edgeTypes } from './components/AtlasConnector/AtlasConnector';
import { CanvasControls } from './components/CanvasControls';

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, loadSession } = useAtlasStore();
  const [loading, setLoading] = useState(true);

  // Read sessionId from URL and load session from chrome.storage.local
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');

    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Load session using store action
    loadSession(sessionId).finally(() => {
      setLoading(false);
    });
  }, [loadSession]);

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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-paper-grid-dot, #e8e6e1)" />
        <CanvasControls />
        <ConversationCompass />
      </ReactFlow>
    </div>
  );
}
