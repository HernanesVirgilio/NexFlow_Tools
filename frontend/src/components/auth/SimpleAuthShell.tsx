import type { ReactNode } from 'react';
import { Brand } from '../../components/ui/Brand';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

/** Lightweight auth shell for the flows without a sliding panel (password recovery). */
export function SimpleAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="nf-authstage nf-authstage--simple">
      <header className="nf-authstage__top">
        <Brand />
        <div className="nf-authstage__chrome">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="nf-authstage__main">
        <div className="nf-authcard">{children}</div>
      </main>
    </div>
  );
}
