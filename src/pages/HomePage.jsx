/**
 * Landing hub: value proposition and entry into Practice (Chess.com–style home).
 */
export default function HomePage({ onPractice, onLearn }) {
  return (
    <main className="flex-1">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]"
          aria-hidden
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <p className="text-emerald-400/90 text-sm font-semibold uppercase tracking-wider mb-3">
            Decisions under uncertainty
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight max-w-3xl leading-tight">
            Train poker judgment like you train tactics in chess.
          </h1>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl leading-relaxed">
            Each spot is a puzzle: incomplete information, pressure, and tradeoffs. Practice compares your
            choice to a recommended line and explains the concept so patterns stick.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPractice}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-emerald-500 text-brand-ink hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
            >
              Start practice
            </button>
            <button
              type="button"
              onClick={onLearn}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border border-white/15 text-slate-200 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
            >
              Why this works
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16 grid sm:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-display text-lg font-semibold text-white mb-2">Scenario puzzles</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Real table context — street, position, pot, stack — so decisions feel grounded, not abstract.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-display text-lg font-semibold text-white mb-2">Instant coaching</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            After you act, see the recommended play, plain-language reasoning, and the concept tag to review.
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-display text-lg font-semibold text-white mb-2">Track progress</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your hands and accuracy accumulate over time in the header — a light nudge to keep practicing.
          </p>
        </article>
      </div>
    </main>
  );
}
