import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type Connection,
} from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { WorkflowNode } from './WorkflowNode';
import type { NfNode } from './useBuilderGraph';

interface Props {
  nodes: NfNode[];
  edges: Edge[];
  onNodesChange: (c: NodeChange<NfNode>[]) => void;
  onEdgesChange: (c: EdgeChange[]) => void;
  onConnect: (c: Connection) => void;
  onSelect: (id: string | null) => void;
  emptyHint: string;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelect,
  emptyHint,
}: Props) {
  const { t } = useTranslation();
  const nodeTypes = useMemo(() => ({ nfNode: WorkflowNode }), []);

  return (
    <div className="nf-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => onSelect(n.id)}
        onPaneClick={() => onSelect(null)}
        fitView
        minZoom={0.3}
        maxZoom={1.75}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
        <Controls
          showInteractive={false}
          aria-label={t('builder.canvasControls')}
        />
      </ReactFlow>
      {nodes.length === 0 && (
        <div className="nf-canvas__empty">
          <p>{emptyHint}</p>
        </div>
      )}
    </div>
  );
}
