import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';

const STORAGE_KEY = 'nf_onboarded';
const CATEGORIES = ['sales', 'marketing', 'support', 'productivity', 'it'] as const;

function readDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return true; // storage unavailable — don't nag
  }
}

function markDone() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Lightweight, skippable first-run guide. Two real steps: pick a focus area,
 * then jump into the real builder or the real template catalog. Nothing is
 * faked — the only thing persisted is that the guide has been seen.
 */
export function OnboardingModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => !readDone());
  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number] | null>(null);

  if (!open) return null;

  function dismiss() {
    markDone();
    setOpen(false);
  }

  function go(path: string) {
    markDone();
    setOpen(false);
    navigate(path);
  }

  return (
    <>
      <div className="modal-backdrop show" />
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="nf-onb-title">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content nf-card nf-onb">
            <div className="nf-onb__head">
              <span className="nf-onb__step">{t('onboarding.stepOf', { current: step, total: 2 })}</span>
              <button type="button" className="btn-close" aria-label={t('onboarding.skip')} onClick={dismiss} />
            </div>

            {step === 1 ? (
              <div className="nf-onb__body">
                <h2 id="nf-onb-title" className="nf-onb__title">
                  {t('onboarding.step1Title')}
                </h2>
                <p className="nf-onb__lead">{t('onboarding.step1Lead')}</p>
                <div className="nf-onb__cats">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`nf-onb__cat${category === c ? ' is-active' : ''}`}
                      onClick={() => setCategory(c)}
                    >
                      {t(`templates.categories.${c}`)}
                    </button>
                  ))}
                </div>
                <div className="nf-onb__foot">
                  <button type="button" className="btn btn-link nf-onb__skip" onClick={dismiss}>
                    {t('onboarding.skip')}
                  </button>
                  <button type="button" className="btn btn-nf-primary" onClick={() => setStep(2)}>
                    {t('onboarding.next')}
                    <Icon name="arrow-right" size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="nf-onb__body">
                <h2 id="nf-onb-title" className="nf-onb__title">
                  {t('onboarding.step2Title')}
                </h2>
                <p className="nf-onb__lead">{t('onboarding.step2Lead')}</p>
                <div className="nf-onb__choices">
                  <button
                    type="button"
                    className="nf-onb__choice"
                    onClick={() => go(category ? `/templates?category=${category}` : '/templates')}
                  >
                    <Icon name="templates" size={18} />
                    <span className="nf-onb__choice-title">{t('onboarding.chooseTemplate')}</span>
                    <span className="nf-onb__choice-desc">{t('onboarding.chooseTemplateDesc')}</span>
                  </button>
                  <button type="button" className="nf-onb__choice" onClick={() => go('/workflows/new')}>
                    <Icon name="plus" size={18} />
                    <span className="nf-onb__choice-title">{t('onboarding.chooseBlank')}</span>
                    <span className="nf-onb__choice-desc">{t('onboarding.chooseBlankDesc')}</span>
                  </button>
                </div>
                <div className="nf-onb__foot">
                  <button type="button" className="btn btn-link nf-onb__skip" onClick={() => setStep(1)}>
                    <Icon name="arrow-left" size={15} />
                    {t('onboarding.back')}
                  </button>
                  <button type="button" className="btn btn-link nf-onb__skip" onClick={dismiss}>
                    {t('onboarding.skip')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
