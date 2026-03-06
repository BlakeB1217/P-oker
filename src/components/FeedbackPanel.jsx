/**
 * Displays feedback after user acts: recommended action, reasoning, concept, optional EV.
 * @param {{
 *   recommended_action: string;
 *   reasoning: string;
 *   concept: string;
 *   ev_difference?: number;
 *   userAction?: string;
 * } | null} feedback
 */
export default function FeedbackPanel({ feedback }) {
  if (!feedback) return null;

  const { recommended_action, reasoning, concept, ev_difference, userAction } = feedback;
  const formatAction = (a) => (a || '').replace(/_/g, ' ');
  const isCorrect = userAction != null && userAction === recommended_action;

  return (
    <section
      className="rounded-xl border-2 border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 p-4 sm:p-5 text-left"
      aria-live="polite"
      aria-label="Feedback"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Recommended:
        </span>
        <span className="font-display font-bold text-emerald-700 dark:text-emerald-400">
          {formatAction(recommended_action)}
        </span>
        {userAction != null && (
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded ${
              isCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
            }`}
          >
            {isCorrect ? 'Correct' : `You chose: ${formatAction(userAction)}`}
          </span>
        )}
      </div>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{reasoning}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500 dark:text-slate-400">Concept:</span>
        <span className="font-medium text-slate-800 dark:text-slate-200">{concept}</span>
        {ev_difference != null && (
          <>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-300">EV diff: {ev_difference}</span>
          </>
        )}
      </div>
    </section>
  );
}
