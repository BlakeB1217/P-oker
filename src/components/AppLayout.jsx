/**
 * Product shell: top navigation (Chess.com–style hub) and main content area.
 * @param {{
 *   children: import('react').ReactNode;
 *   current: 'home' | 'practice' | 'learn';
 *   onNavigate: (view: 'home' | 'practice' | 'learn') => void;
 *   stats: { hands: number; correct: number };
 *   accuracy: number | null;
 * }} props
 */
export default function AppLayout({ children, current, onNavigate, stats, accuracy }) {
  const link =
    'px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink';
  const active =
    'bg-white/10 text-white';
  const idle =
    'text-slate-400 hover:text-white hover:bg-white/5';

  return (
    <div className="min-h-screen bg-brand-ink text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-ink/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60"
            >
              <span
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-felt to-feltDark flex items-center justify-center text-white text-xs font-bold shadow-lg border border-white/10"
                aria-hidden
              >
                P
              </span>
              <span className="font-display text-lg font-semibold text-white tracking-tight hidden sm:inline">
                P-oker
              </span>
            </button>

            <nav className="flex items-center gap-1" aria-label="Main">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className={`${link} ${current === 'home' ? active : idle}`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className={`${link} ${current === 'practice' ? active : idle}`}
              >
                Practice
              </button>
              <button
                type="button"
                onClick={() => onNavigate('learn')}
                className={`${link} ${current === 'learn' ? active : idle}`}
              >
                Learn
              </button>
            </nav>
          </div>

          <div
            className="hidden sm:flex items-center gap-3 text-xs text-slate-400 tabular-nums"
            aria-live="polite"
          >
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">
              <span className="text-slate-500">Hands</span>{' '}
              <span className="text-slate-200 font-semibold">{stats.hands}</span>
            </span>
            {accuracy != null && (
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1">
                <span className="text-slate-500">Accuracy</span>{' '}
                <span className="text-emerald-400 font-semibold">{accuracy}%</span>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col">{children}</div>

      <footer className="border-t border-white/10 py-4 px-4 text-center text-xs text-slate-500">
        Educational trainer — compare your choices to recommended lines and build intuition under uncertainty.
      </footer>
    </div>
  );
}
