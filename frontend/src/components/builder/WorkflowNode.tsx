import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { nodeIcon } from './nodeMeta';
import type { NfNode } from './useBuilderGraph';

const CAP_ICON = {
  available: 'check',
  'configuration-required': 'alert',
  'coming-soon': 'clock',
} as const;

function WorkflowNodeBase({ data, selected }: NodeProps<NfNode>) {
  const { t } = useTranslation();
  const { nodeType, capability, isTrigger } = data;

  return (
    <div className={`nf-node nf-node--${capability}${selected ? ' is-selected' : ''}`} data-testid={`node-${nodeType}`}>
      {!isTrigger && <Handle type="target" position={Position.Top} className="nf-node__handle" />}
      <div className="nf-node__head">
        <span className="nf-node__icon">
          <Icon name={nodeIcon(nodeType)} size={16} />
        </span>
        <span className="nf-node__title">{t(`builder.nodes.${nodeType}.title`)}</span>
      </div>
      <p className="nf-node__desc">{t(`builder.nodes.${nodeType}.desc`)}</p>
      <div className="nf-node__status">
        <Icon name={CAP_ICON[capability]} size={12} />
        {t(`builder.capability.${capability}`)}
      </div>
      <Handle type="source" position={Position.Bottom} className="nf-node__handle" />
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeBase);
