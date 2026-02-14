import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAtlasStore } from './store/atlasStore';
import { ConversationCompass } from './components/ConversationCompass/ConversationCompass';
import { nodeTypes } from './components/AtlasCard/AtlasCard';
import { edgeTypes } from './components/AtlasConnector/AtlasConnector';
import { CanvasControls } from './components/CanvasControls';
import { TopicInput } from './components/TopicInput/TopicInput';
import { Toolbar } from './components/Toolbar/Toolbar';

export default function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, setActiveNode, loadSession, session } = useAtlasStore();
  const [loading, setLoading] = useState(true);
  const [isExtensionMode, setIsExtensionMode] = useState(false);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setActiveNode(node.id);
  }, [setActiveNode]);

  // Read sessionId from URL and load session from chrome.storage.local
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');

    if (!sessionId) {
      // No sessionId = local dev mode, show topic input
      setIsExtensionMode(false);
      setLoading(false);
      return;
    }

    // Extension mode: load session from chrome.storage
    setIsExtensionMode(true);
    loadSession(sessionId).finally(() => {
      setLoading(false);
    });
  }, [loadSession]);

  // Extension mode: loading spinner
  if (loading && isExtensionMode) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
        Loading session...
      </div>
    );
  }

  // No session yet: show topic input (local dev mode)
  if (!session) {
    return <TopicInput />;
  }

  return (
    <div style={{ width: '100%', height: '100vh', background: 'var(--atlas-paper-bg, #faf9f6)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-paper-grid-dot, #e8e6e1)" />
        <CanvasControls />
        <Toolbar />
        <ConversationCompass />
      </ReactFlow>
    </div>
  );
}
