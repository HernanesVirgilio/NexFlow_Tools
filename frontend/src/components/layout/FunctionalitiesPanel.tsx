import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../ui/Icon';

interface Item {
  key: string;
  icon: IconName;
  to: string;
}

// Every entry routes to a real page — no "Em breve" items here.
const ITEMS: Item[] = [
  { key: 'automate', icon: 'zap', to: '/workflows/new' },
  { key: 'connectTools', icon: 'puzzle', to: '/integrations' },
  { key: 'templates', icon: 'templates', to: '/templates' },
  { key: 'workflows', icon: 'workflows', to: '/workflows' },
  { key: 'history', icon: 'executions', to: '/executions' },
];

/** Discoverable, not permanent: capabilities live behind this trigger, not on the main screen. */
export function FunctionalitiesPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="nf-func" role="dialog" aria-label={t('functionalities.title')}>
      <div className="nf-func__head">
        <span className="nf-func__title">{t('functionalities.title')}</span>
        <button type="button" className="btn-close" aria-label={t('common.close')} onClick={onClose} />
      </div>
      <ul className="nf-func__list">
        {ITEMS.map((item) => (
          <li key={item.key}>
            <Link to={item.to} className="nf-func__item" onClick={onClose}>
              <Icon name={item.icon} size={16} />
              <span className="nf-func__text">
                <span className="nf-func__name">{t(`functionalities.${item.key}.title`)}</span>
                <span className="nf-func__desc">{t(`functionalities.${item.key}.desc`)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
