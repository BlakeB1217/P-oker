import { actionsMatch } from '../utils/actionIds.js';

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
  const isCorrect = userAction != null && actionsMatch(userAction, recommended_action);

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6 text-left shadow-inner"
      aria-live="polite"
      role="region"
      aria-label="Coach feedback"
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recommended
        </span>
        <span className="font-display font-bold text-emerald-400">{formatAction(recommended_action)}</span>
        {userAction != null && (
          <span
            className={`text-sm font-medium px-2.5 py-1 rounded-lg border ${
              isCorrect
                ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-100 border-amber-500/25'
            }`}
          >
            {isCorrect ? 'Correct' : `You chose: ${formatAction(userAction)}`}
          </span>
        )}
      </div>
      <p className="text-slate-300 leading-relaxed mb-4">{reasoning}</p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">Concept</span>
        <span className="font-medium text-white">{concept}</span>
        {ev_difference != null && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">EV diff: {ev_difference}</span>
          </>
        )}
      </div>
    </div>
  );
}
