import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../ui/Icon';
import { useConnectTools } from '../../context/ConnectToolsContext';

type Capability = 'available' | 'configuration' | 'future';

interface Item {
  key: string;
  icon: IconName;
  status: Capability;
  to?: string;
  action?: 'connect';
}

const ITEMS: Item[] = [
  { key: 'automate', icon: 'zap', to: '/workflows/new', status: 'available' },
  { key: 'createWithAi', icon: 'sparkles', status: 'future' },
  { key: 'analyze', icon: 'chart', status: 'future' },
  { key: 'files', icon: 'grid', status: 'future' },
  { key: 'connectTools', icon: 'puzzle', action: 'connect', status: 'configuration' },
  { key: 'templates', icon: 'templates', to: '/templates', status: 'available' },
  { key: 'workflows', icon: 'workflows', to: '/workflows', status: 'available' },
  { key: 'history', icon: 'executions', to: '/executions', status: 'available' },
];

/** Discoverable, not permanent: capabilities live behind this trigger, not on the main screen. */
export function FunctionalitiesPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { openModal } = useConnectTools();

  return (
    <div className="nf-func" role="dialog" aria-label={t('functionalities.title')}>
      <div className="nf-func__head">
        <span className="nf-func__title">{t('functionalities.title')}</span>
        <button type="button" className="btn-close" aria-label={t('common.close')} onClick={onClose} />
      </div>
      <ul className="nf-func__list">
        {ITEMS.map((item) => {
          const body = (
            <>
              <Icon name={item.icon} size={16} />
              <span className="nf-func__text">
                <span className="nf-func__name">{t(`functionalities.${item.key}.title`)}</span>
                <span className="nf-func__desc">{t(`functionalities.${item.key}.desc`)}</span>
              </span>
              <span className={`nf-badge nf-func__badge nf-func__badge--${item.status}`}>
                {t(`functionalities.status.${item.status}`)}
              </span>
            </>
          );
          return (
            <li key={item.key}>
              {item.action === 'connect' ? (
                <button
                  type="button"
                  className="nf-func__item"
                  onClick={() => {
                    openModal();
                    onClose();
                  }}
                >
                  {body}
                </button>
              ) : item.status === 'future' ? (
                <span className="nf-func__item nf-func__item--soon" aria-disabled="true">
                  {body}
                </span>
              ) : (
                <Link to={item.to!} className="nf-func__item" onClick={onClose}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
