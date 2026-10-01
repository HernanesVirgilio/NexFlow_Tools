import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAsync } from '../hooks/useAsync';
import { integrationsService } from '../services/integrations.service';
import { AsyncBoundary } from '../components/ui/AsyncBoundary';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';
import { useErrorMessage } from '../components/ui/ErrorState';

/**
 * Real integrations, not a catalogue of wishes. Today that is exactly one
 * provider — Google (Gmail/Drive/Sheets account connection) — because that is
 * the only one with real backend OAuth plumbing (backend/src/integrations).
 * Nothing here ever claims "Connected" unless the backend's own record says so.
 */
export function IntegrationsPage() {
  const { t } = useTranslation();
  const toMessage = useErrorMessage();
  const [params, setParams] = useSearchParams();
  const state = useAsync(() => integrationsService.overview(), []);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackStatus = params.get('status');

  function dismissCallbackStatus() {
    const next = new URLSearchParams(params);
    next.delete('status');
    setParams(next, { replace: true });
  }

  async function connectGoogle() {
    setConnecting(true);
    setError(null);
    try {
      const { url } = await integrationsService.connectUrl();
      window.location.href = url;
    } catch (err) {
      setError(toMessage(err));
      setConnecting(false);
    }
  }

  async function disconnectGoogle() {
    setDisconnecting(true);
    setError(null);
    try {
      await integrationsService.disconnectGoogle();
      state.reload();
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="nf-integrations">
      <PageHeader title={t('integrations.title')} />
      <p className="nf-integrations__lead">{t('integrations.lead')}</p>

      {callbackStatus === 'connected' && (
        <div className="alert alert-success py-2" role="alert">
          {t('integrations.callback.connected')}
          <button type="button" className="btn-close float-end" aria-label={t('common.close')} onClick={dismissCallbackStatus} />
        </div>
      )}
      {callbackStatus === 'denied' && (
        <div className="alert alert-warning py-2" role="alert">
          {t('integrations.callback.denied')}
          <button type="button" className="btn-close float-end" aria-label={t('common.close')} onClick={dismissCallbackStatus} />
        </div>
      )}
      {callbackStatus === 'error' && (
        <div className="alert alert-danger py-2" role="alert">
          {t('integrations.callback.error')}
          <button type="button" className="btn-close float-end" aria-label={t('common.close')} onClick={dismissCallbackStatus} />
        </div>
      )}
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <AsyncBoundary state={state} skeleton={<IntegrationsSkeleton />}>
        {(data) => {
          const google = data.integrations.find((i) => i.provider === 'google')!;
          return (
            <div className="nf-card nf-card--pad nf-integration-tile">
              <span className="nf-integration-tile__mark" aria-hidden="true">
                <Icon name="link" size={20} />
              </span>
              <div className="nf-integration-tile__body">
                <h2 className="nf-integration-tile__name">{t('integrations.google.name')}</h2>
                <p className="nf-integration-tile__desc">{t('integrations.google.desc')}</p>
                {!data.configured ? (
                  <span className="nf-status nf-status--pending">{t('integrations.notConfigured')}</span>
                ) : google.connected ? (
                  <span className="nf-status nf-status--completed">
                    {t('integrations.connectedAs', { email: google.accountEmail ?? t('integrations.unknownAccount') })}
                  </span>
                ) : (
                  <span className="nf-status nf-status--pending">{t('integrations.notConnected')}</span>
                )}
              </div>
              <div className="nf-integration-tile__action">
                {!data.configured ? (
                  <button type="button" className="btn btn-outline-secondary btn-sm" disabled title={t('integrations.notConfiguredHint')}>
                    {t('integrations.connect')}
                  </button>
                ) : google.connected ? (
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void disconnectGoogle()} disabled={disconnecting}>
                    {disconnecting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : t('integrations.disconnect')}
                  </button>
                ) : (
                  <button type="button" className="btn btn-nf-primary btn-sm" onClick={() => void connectGoogle()} disabled={connecting}>
                    {connecting ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : t('integrations.connect')}
                  </button>
                )}
              </div>
            </div>
          );
        }}
      </AsyncBoundary>

      <p className="nf-integrations__note">{t('integrations.note')}</p>
    </div>
  );
}

function IntegrationsSkeleton() {
  return (
    <div className="nf-card nf-card--pad nf-integration-tile" aria-busy="true">
      <Skeleton w="40px" h="40px" />
      <div className="nf-integration-tile__body">
        <Skeleton w="30%" h="1rem" />
        <Skeleton w="60%" h="0.85rem" className="mt-2" />
      </div>
    </div>
  );
}
