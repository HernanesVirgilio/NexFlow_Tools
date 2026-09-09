import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import { CATEGORY_ORDER, nodeIcon } from './nodeMeta';
import type { NodeTypeDef } from '../../services/types';

interface Props {
  catalog: NodeTypeDef[];
  onAdd: (type: string) => void;
}

export function NodePalette({ catalog, onAdd }: Props) {
  const { t } = useTranslation();

  return (
    <aside className="nf-palette" aria-label={t('builder.palette')}>
      <h2 className="nf-palette__title">{t('builder.palette')}</h2>
      {CATEGORY_ORDER.map((category) => {
        const items = catalog.filter((n) => n.category === category);
        if (!items.length) return null;
        return (
          <div key={category} className="nf-palette__group">
            <span className="nf-palette__group-label">{t(`builder.categories.${category}`)}</span>
            {items.map((node) => (
              <button
                key={node.type}
                type="button"
                className={`nf-palette__item nf-palette__item--${node.capability}`}
                onClick={() => onAdd(node.type)}
              >
                <span className="nf-palette__item-icon">
                  <Icon name={nodeIcon(node.type)} size={15} />
                </span>
                <span className="nf-palette__item-text">
                  <span className="nf-palette__item-name">{t(`builder.nodes.${node.type}.title`)}</span>
                  <span className="nf-palette__item-cap">{t(`builder.capability.${node.capability}`)}</span>
                </span>
                <Icon name="plus" size={13} />
              </button>
            ))}
          </div>
        );
      })}
    </aside>
  );
}
