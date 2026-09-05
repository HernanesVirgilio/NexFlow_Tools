import { useTranslation } from 'react-i18next';
import { AuthArt } from './AuthArt';

type Mode = 'connect' | 'automate';

const RING_R = 120;
const NODE_ANGLES = [-90, -30, 30, 90, 150, 210];

function nodeAt(angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: 150 + RING_R * Math.cos(rad), y: 150 + RING_R * Math.sin(rad) };
}

/**
 * NexFlow Intelligence Core — the animated centrepiece of the auth overlay.
 *
 * Purely decorative (aria-hidden). All motion is CSS (transforms / opacity /
 * stroke-dashoffset) so there is no animation loop in JS and no React state
 * churn. `prefers-reduced-motion` disables it in the stylesheet.
 *
 * The compact <AuthArt/> is rendered alongside and swapped in by CSS on small
 * screens, where the full orbital scene would be too dense.
 */
export function IntelligenceCore({ mode }: { mode: Mode }) {
  const { t } = useTranslation();

  const labels =
    mode === 'connect'
      ? [
          t('auth.panel.nodes.apps'),
          t('auth.panel.nodes.apis'),
          t('auth.panel.nodes.data'),
          t('auth.panel.nodes.tools'),
          t('auth.panel.nodes.docs'),
          t('auth.panel.nodes.ai'),
        ]
      : [
          t('auth.panel.flow.idea'),
          t('auth.panel.flow.connect'),
          t('auth.panel.flow.automate'),
          t('auth.panel.flow.result'),
          t('auth.panel.nodes.ai'),
          t('auth.panel.nodes.data'),
        ];

  return (
    <div className="nf-core" aria-hidden="true">
      <div className="nf-core__scene" data-mode={mode}>
        <svg viewBox="0 0 300 300" role="presentation">
          <g className="nf-core__ring nf-core__ring--outer">
            <circle cx="150" cy="150" r="128" />
            <circle className="nf-core__ring-tick" cx="150" cy="22" r="3" />
          </g>
          <g className="nf-core__ring nf-core__ring--mid">
            <circle cx="150" cy="150" r="92" />
          </g>

          <g className="nf-core__nodes">
            {NODE_ANGLES.map((angle, i) => {
              const { x, y } = nodeAt(angle);
              const anchor = x < 140 ? 'end' : x > 160 ? 'start' : 'middle';
              const lx = anchor === 'end' ? x - 10 : anchor === 'start' ? x + 10 : x;
              return (
                <g key={angle}>
                  <path className="nf-core__link" d={`M${x} ${y} L150 150`} />
                  <circle className="nf-core__node" cx={x} cy={y} r="6" />
                  <text className="nf-core__label" x={lx} y={y + 3} textAnchor={anchor}>
                    {labels[i]}
                  </text>
                </g>
              );
            })}
          </g>

          <circle className="nf-core__orb-glow" cx="150" cy="150" r="40" />
          <circle className="nf-core__orb" cx="150" cy="150" r="24" />
          <circle className="nf-core__orb-inner" cx="150" cy="150" r="11" />

          <path
            className="nf-core__wave"
            d="M104 256 q 8 -16 16 0 t 16 0 t 16 0 t 16 0 t 16 0"
          />
        </svg>
      </div>

      <AuthArt mode={mode} />

      {/*
        No metrics here: the auth screen is unauthenticated, so there is no real
        per-user data to show. Real workflow/execution counts live on the
        dashboard (behind login). This card carries the product statement only.
      */}
      <div className="nf-core__status">
        <span className="nf-core__status-title">{t('auth.panel.core.title')}</span>
        <p className="nf-core__status-msg">{t('auth.panel.core.message')}</p>
      </div>
    </div>
  );
}
