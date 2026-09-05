import { useTranslation } from 'react-i18next';

/**
 * Abstract automation artwork for the auth overlay. Purely decorative
 * (aria-hidden) — it echoes the product idea without stock imagery:
 *  - "connect": tools / APIs / data / AI / docs wired into one hub
 *  - "automate": Idea → Connect → Automate → Result
 */
export function AuthArt({ mode }: { mode: 'connect' | 'automate' }) {
  const { t } = useTranslation();

  if (mode === 'connect') {
    const nodes = [
      { x: 26, y: 24, label: t('auth.panel.nodes.apps') },
      { x: 150, y: 16, label: t('auth.panel.nodes.apis') },
      { x: 232, y: 60, label: t('auth.panel.nodes.data') },
      { x: 210, y: 150, label: t('auth.panel.nodes.ai') },
      { x: 40, y: 150, label: t('auth.panel.nodes.docs') },
    ];
    return (
      <div className="nf-authart" aria-hidden="true">
        <svg viewBox="0 0 260 190" role="presentation">
          {nodes.map((n, i) => (
            <path key={`l${i}`} className="nf-authart__link" d={`M${n.x + 18} ${n.y + 10} L130 95`} />
          ))}
          <rect className="nf-authart__hub" x="108" y="76" width="44" height="38" rx="9" />
          <circle className="nf-authart__pulse" cx="130" cy="95" r="4" />
          {nodes.map((n, i) => (
            <g key={`n${i}`}>
              <rect className="nf-authart__node" x={n.x} y={n.y} width="40" height="24" rx="7" />
              <text className="nf-authart__label" x={n.x + 20} y={n.y + 16} textAnchor="middle">
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  const steps = [
    t('auth.panel.flow.idea'),
    t('auth.panel.flow.connect'),
    t('auth.panel.flow.automate'),
    t('auth.panel.flow.result'),
  ];
  return (
    <div className="nf-authart" aria-hidden="true">
      <svg viewBox="0 0 260 200" role="presentation">
        <path className="nf-authart__link" d="M130 26 L130 174" />
        {steps.map((label, i) => {
          const y = 12 + i * 50;
          return (
            <g key={label}>
              <rect className="nf-authart__node" x="70" y={y} width="120" height="30" rx="9" />
              <text className="nf-authart__label" x="130" y={y + 19} textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
        <circle className="nf-authart__pulse" cx="130" cy="100" r="4" />
      </svg>
    </div>
  );
}
