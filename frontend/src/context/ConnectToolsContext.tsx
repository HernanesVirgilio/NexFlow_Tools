import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface ConnectToolsContextValue {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ConnectToolsContext = createContext<ConnectToolsContextValue | null>(null);

/**
 * Lets the sidebar's "Integrações" item and the dashboard's "Conecte suas
 * ferramentas" card open the exact same modal instance instead of each
 * rendering — and duplicating the state of — their own copy.
 */
export function ConnectToolsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({ open, openModal: () => setOpen(true), closeModal: () => setOpen(false) }),
    [open],
  );
  return <ConnectToolsContext.Provider value={value}>{children}</ConnectToolsContext.Provider>;
}

export function useConnectTools() {
  const ctx = useContext(ConnectToolsContext);
  if (!ctx) throw new Error('useConnectTools must be used within ConnectToolsProvider');
  return ctx;
}
