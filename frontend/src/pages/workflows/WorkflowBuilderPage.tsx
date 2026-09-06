import { useParams } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { workflowService } from '../../services/workflow.service';
import type { NodeTypeDef, Workflow } from '../../services/types';
import { AsyncBoundary } from '../../components/ui/AsyncBoundary';
import { BuilderShell } from '../../components/builder/BuilderShell';
import '@xyflow/react/dist/style.css';

export default function WorkflowBuilderPage() {
  const { id = '' } = useParams();
  const state = useAsync<{ workflow: Workflow; catalog: NodeTypeDef[] }>(
    async () => {
      const [workflow, catalog] = await Promise.all([
        workflowService.get(id) as Promise<Workflow>,
        workflowService.nodeTypes(),
      ]);
      return { workflow, catalog };
    },
    [id],
  );

  return (
    <AsyncBoundary state={state}>
      {({ workflow, catalog }) => <BuilderShell workflow={workflow} catalog={catalog} />}
    </AsyncBoundary>
  );
}
