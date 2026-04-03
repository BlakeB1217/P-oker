/**
 * Lightweight curriculum framing — expandable later with modules and videos.
 */
export default function LearnPage({ onPractice }) {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold text-white mb-2">Learn</h1>
      <p className="text-slate-400 mb-10">
        Poker is a laboratory for reasoning with hidden information. These ideas mirror what strong players
        rehearse in practice mode.
      </p>

      <ol className="space-y-8 list-none">
        <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">01</span>
          <h2 className="font-display text-xl font-semibold text-white mt-2 mb-2">Ranges, not hands</h2>
          <p className="text-slate-400 leading-relaxed">
            You rarely know the villain&apos;s exact cards. Good decisions come from estimating what they
            could hold and how your line fares against that whole range.
          </p>
        </li>
        <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">02</span>
          <h2 className="font-display text-xl font-semibold text-white mt-2 mb-2">Pot odds &amp; pressure</h2>
          <p className="text-slate-400 leading-relaxed">
            Price matters. Small mistakes add up — practice spots where calling, folding, or applying
            pressure changes the EV of your session.
          </p>
        </li>
        <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">03</span>
          <h2 className="font-display text-xl font-semibold text-white mt-2 mb-2">Concept tags</h2>
          <p className="text-slate-400 leading-relaxed">
            After each puzzle, note the concept name. Repeating the same tags across spots builds the
            mental library chess players get from motifs and patterns.
          </p>
        </li>
      </ol>

      <div className="mt-10">
        <button
          type="button"
          onClick={onPractice}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold bg-emerald-500 text-brand-ink hover:bg-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
        >
          Go to practice
        </button>
      </div>
    </main>
  );
}
