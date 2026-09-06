import { useCallback, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import type { NodeCapability, NodeTypeDef, WorkflowDefinition } from '../../services/types';

export interface NfNodeData extends Record<string, unknown> {
  nodeType: string;
  config: Record<string, unknown>;
  label?: string;
  capability: NodeCapability;
  isTrigger: boolean;
}
export type NfNode = Node<NfNodeData, 'nfNode'>;

let seq = 0;
const nid = (type: string) => `${type}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const eid = () => `e-${Date.now().toString(36)}-${(seq++).toString(36)}`;

function meta(catalog: NodeTypeDef[], type: string) {
  const d = catalog.find((c) => c.type === type);
  return { capability: (d?.capability ?? 'coming-soon') as NodeCapability, isTrigger: d?.isTrigger ?? false };
}

function fromDefinition(def: WorkflowDefinition | null, catalog: NodeTypeDef[]): { nodes: NfNode[]; edges: Edge[] } {
  if (!def) return { nodes: [], edges: [] };
  return {
    nodes: def.nodes.map((n) => ({
      id: n.id,
      type: 'nfNode',
      position: n.position,
      data: { nodeType: n.type, config: n.config ?? {}, label: n.label, ...meta(catalog, n.type) },
    })),
    edges: def.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
    })),
  };
}

export function useBuilderGraph(initial: WorkflowDefinition | null, catalog: NodeTypeDef[]) {
  const first = useMemo(() => fromDefinition(initial, catalog), [initial, catalog]);
  const [nodes, setNodes] = useState<NfNode[]>(first.nodes);
  const [edges, setEdges] = useState<Edge[]>(first.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const touched = useRef(false);

  const touch = useCallback(() => {
    touched.current = true;
    setDirty(true);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<NfNode>[]) => {
      setNodes((ns) => applyNodeChanges(changes, ns));
      if (changes.some((c) => c.type === 'position' || c.type === 'remove')) touch();
    },
    [touch],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((es) => applyEdgeChanges(changes, es));
      if (changes.some((c) => c.type === 'remove')) touch();
    },
    [touch],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      setEdges((es) => addEdge({ ...c, id: eid() }, es));
      touch();
    },
    [touch],
  );

  const addNode = useCallback(
    (type: string) => {
      const def = catalog.find((d) => d.type === type);
      if (!def) return;
      const id = nid(type);
      setNodes((ns) => [
        ...ns,
        {
          id,
          type: 'nfNode',
          position: { x: 120 + (ns.length % 3) * 60, y: 60 + ns.length * 96 },
          data: { nodeType: type, config: { ...def.defaultConfig }, ...meta(catalog, type) },
        },
      ]);
      setSelectedId(id);
      touch();
    },
    [catalog, touch],
  );

  const updateNodeConfig = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...patch } } } : n)),
      );
      touch();
    },
    [touch],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
      setSelectedId((s) => (s === id ? null : s));
      touch();
    },
    [touch],
  );

  const toDefinition = useCallback(
    (): WorkflowDefinition => ({
      version: 1,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
        config: n.data.config,
        label: n.data.label,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
      })),
    }),
    [nodes, edges],
  );

  return {
    nodes: useMemo(() => nodes.map((n) => ({ ...n, selected: n.id === selectedId })), [nodes, selectedId]),
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedId,
    selectNode: setSelectedId,
    selectedNode: nodes.find((n) => n.id === selectedId) ?? null,
    addNode,
    updateNodeConfig,
    deleteNode,
    dirty,
    markSaved: useCallback(() => setDirty(false), []),
    toDefinition,
    isEmpty: nodes.length === 0,
  };
}
