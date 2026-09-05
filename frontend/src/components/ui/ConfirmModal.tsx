import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Lightweight modal (no Bootstrap JS dependency). Reused for every confirm dialog. */
export function ConfirmModal({ open, title, message, confirmLabel, danger, busy, onConfirm, onClose }: Props) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <>
      <div className="modal-backdrop show" />
      <div className="modal d-block" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content nf-card">
            <div className="modal-header border-0">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label={t('common.cancel')} onClick={onClose} />
            </div>
            <div className="modal-body">{message}</div>
            <div className="modal-footer border-0">
              <button className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>
                {t('common.cancel')}
              </button>
              <button
                className={`btn ${danger ? 'btn-danger' : 'btn-nf-primary'}`}
                onClick={onConfirm}
                disabled={busy}
              >
                {confirmLabel ?? t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
