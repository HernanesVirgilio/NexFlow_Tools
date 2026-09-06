import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ah } from '../../utils/asyncHandler';
import { workflowService } from './workflow.service';
import { createWorkflowSchema, idParam, updateWorkflowSchema } from './workflow.schemas';
import { executionService } from '../executions/execution.service';
import { nodeCatalogView } from '../../automation/nodeCatalog';

export const workflowRoutes = Router();
workflowRoutes.use(requireAuth);

// Authoritative node catalogue for the visual builder (labels are i18n keys on the client).
workflowRoutes.get('/node-types', ah(async (_req, res) => {
  res.json(nodeCatalogView());
}));

workflowRoutes.get('/', ah(async (req, res) => {
  res.json(await workflowService.list(req.user!.id));
}));

workflowRoutes.post('/', validate({ body: createWorkflowSchema }), ah(async (req, res) => {
  res.status(201).json(await workflowService.create(req.user!.id, req.body));
}));

workflowRoutes.get('/:id', validate({ params: idParam }), ah(async (req, res) => {
  res.json(await workflowService.get(req.params.id, req.user!.id));
}));

workflowRoutes.patch('/:id', validate({ params: idParam, body: updateWorkflowSchema }), ah(async (req, res) => {
  res.json(await workflowService.update(req.params.id, req.user!.id, req.body));
}));

workflowRoutes.delete('/:id', validate({ params: idParam }), ah(async (req, res) => {
  await workflowService.remove(req.params.id, req.user!.id);
  res.status(204).end();
}));

workflowRoutes.post('/:id/execute', validate({ params: idParam }), ah(async (req, res) => {
  res.status(202).json(await workflowService.execute(req.params.id, req.user!.id));
}));

workflowRoutes.get('/:id/executions', validate({ params: idParam }), ah(async (req, res) => {
  res.json(await executionService.listForWorkflow(req.params.id, req.user!.id));
}));
