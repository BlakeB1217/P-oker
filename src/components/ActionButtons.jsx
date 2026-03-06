/**
 * Action buttons: Fold, Check/Call, Bet/Raise.
 * Parent supplies which actions are available and handles click.
 * @param {{
 *   disabled?: boolean;
 *   actions: { id: string; label: string }[];
 *   onAction: (actionId: string) => void;
 * }} props
 */
export default function ActionButtons({ disabled = false, actions = [], onAction }) {
  const styleMap = {
    fold: 'bg-slate-600 hover:bg-slate-700 text-white border-slate-500',
    check: 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600',
    call: 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600',
    bet_small: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500',
    bet_pot: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500',
    raise: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500',
    all_in: 'bg-red-700 hover:bg-red-600 text-white border-red-600',
  };

  return (
    <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Actions">
      {actions.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onAction(id)}
          className={`px-5 py-2.5 rounded-lg font-semibold border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styleMap[id] || 'bg-slate-600 text-white'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
