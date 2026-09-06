import { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { workflowService } from '../../services/workflow.service';
import type { NodeTypeDef, Workflow } from '../../services/types';
import { useErrorMessage } from '../ui/ErrorState';
import { BuilderToolbar, type SaveState } from './BuilderToolbar';
import { NodePalette } from './NodePalette';
import { NodeInspector } from './NodeInspector';
import { WorkflowCanvas } from './WorkflowCanvas';
import { useBuilderGraph } from './useBuilderGraph';

export function BuilderShell({ workflow, catalog }: { workflow: Workflow; catalog: NodeTypeDef[] }) {
  const { t } = useTranslation();
  const toMessage = useErrorMessage();
  const g = useBuilderGraph(workflow.definition, catalog);

  const [name, setName] = useState(workflow.name);
  const [isActive, setIsActive] = useState(workflow.isActive);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const nameDirty = name.trim() !== workflow.name;
  useEffect(() => {
    if (g.dirty || nameDirty) setSaveState('unsaved');
  }, [g.dirty, nameDirty]);

  async function save() {
    setBusy(true);
    setSaveState('saving');
    setNotice(null);
    try {
      await workflowService.update(workflow.id, { name: name.trim(), definition: g.toDefinition() });
      g.markSaved();
      workflow.name = name.trim();
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    setNotice(null);
    try {
      const updated = await workflowService.update(workflow.id, { isActive: !isActive });
      setIsActive(updated.isActive);
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setNotice(null);
    try {
      await workflowService.execute(workflow.id);
      setNotice({ type: 'success', text: t('workflows.runStarted') });
    } catch (err) {
      setNotice({ type: 'danger', text: toMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ReactFlowProvider>
      <div className="nf-builder">
        <BuilderToolbar
          workflowId={workflow.id}
          name={name}
          onNameChange={setName}
          isActive={isActive}
          saveState={saveState}
          busy={busy}
          onSave={save}
          onTest={test}
          onToggleActive={toggleActive}
        />
        {notice && (
          <div className={`alert alert-${notice.type} py-2 m-2 mb-0`} role="alert">
            {notice.text}
          </div>
        )}
        <div className="nf-builder__body">
          <NodePalette catalog={catalog} onAdd={g.addNode} />
          <WorkflowCanvas
            nodes={g.nodes}
            edges={g.edges}
            onNodesChange={g.onNodesChange}
            onEdgesChange={g.onEdgesChange}
            onConnect={g.onConnect}
            onSelect={g.selectNode}
            emptyHint={t('builder.canvasEmpty')}
          />
          <NodeInspector node={g.selectedNode} onChange={g.updateNodeConfig} onDelete={g.deleteNode} />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
