import { useEffect, useState } from 'react';
import { REMATCH_BUSINESS, type BrandTheme } from './data/rematchData';
import { BrandLogo } from './components/BrandLogo';
import { ClientFlow } from './components/ClientFlow';
import { OwnerPanel } from './components/OwnerPanel';
import { useRematchStore } from './state/useRematchStore';

type ViewMode = 'client' | 'owner';

const THEME_CLASS: Record<BrandTheme, string> = {
  classic: '',
  xmas: 'theme-xmas',
  hyrox: 'theme-hyrox'
};

const WA_QUESTION_URL = `https://wa.me/${REMATCH_BUSINESS.whatsappPhone}?text=${encodeURIComponent(
  'Hola REMATCH, tengo una duda sobre las clases.'
)}`;

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3 21 2" />
      <path d="m16 7 3 3" />
    </svg>
  );
}

export default function App() {
  const store = useRematchStore();
  const [mode, setMode] = useState<ViewMode>('client');
  const shellClass = ['rm-shell', THEME_CLASS[store.theme]].filter(Boolean).join(' ');

  // Sincroniza la clase del tema en :root para que body y <dialog> en top-layer hereden los colores.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-xmas', 'theme-hyrox');
    const cls = THEME_CLASS[store.theme];
    if (cls) root.classList.add(cls);
    return () => {
      root.classList.remove('theme-xmas', 'theme-hyrox');
    };
  }, [store.theme]);

  return (
    <div className={shellClass}>
      <div className="rm-card-frame">
        <header className="rm-topbar">
          <div className="rm-topbar-brand">
            <BrandLogo theme={store.theme} customLogoUrl={store.customLogo} />
            <p className="rm-header-sub">
              {REMATCH_BUSINESS.zone} · {REMATCH_BUSINESS.clubTag}
            </p>
          </div>

          <nav className="rm-mode-switcher" aria-label="Cambiar de vista">
            <button
              type="button"
              className="rm-mode-btn"
              aria-pressed={mode === 'client'}
              onClick={() => setMode('client')}
            >
              <UserIcon />
              Vista Cliente
            </button>
            <button
              type="button"
              className="rm-mode-btn owner-active"
              aria-pressed={mode === 'owner'}
              onClick={() => setMode('owner')}
            >
              <ClipboardIcon />
              Vista Dueño
            </button>
          </nav>

          <div className="rm-topbar-action">
            {mode === 'client' ? (
              <a className="rm-wa-pill" href={WA_QUESTION_URL} target="_blank" rel="noopener noreferrer">
                <ChatIcon />
                ¿Dudas?
              </a>
            ) : (
              <span className="rm-owner-badge">
                <KeyIcon />
                Modo Dueño
              </span>
            )}
          </div>
        </header>

        <main className="rm-stage-main">
          {/* Ambas vistas quedan montadas para no perder el avance al cambiar de vista. */}
          <div hidden={mode !== 'client'}>
            <ClientFlow />
          </div>
          <div hidden={mode !== 'owner'}>
            <OwnerPanel />
          </div>
        </main>

        {mode === 'client' && (
          <p className="rm-footer-note">Nuestra Sra. de Los Ángeles 5, La Loma · Sin cuentas ni contraseñas</p>
        )}
      </div>
    </div>
  );
}
