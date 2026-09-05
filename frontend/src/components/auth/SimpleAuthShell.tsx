import type { ReactNode } from 'react';
import { Brand } from '../../components/ui/Brand';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

/** Lightweight auth shell for the flows without a sliding panel (password recovery). */
export function SimpleAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="nf-authstage">
      <div className="nf-authstage__chrome">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="nf-authcard">
        <div className="nf-authcard__head">
          <Brand />
        </div>
        {children}
      </div>
    </div>
  );
}
