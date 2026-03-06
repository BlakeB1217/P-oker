import BoardCards from './BoardCards.jsx';
import HeroHand from './HeroHand.jsx';

/**
 * Visual poker table: board, hero hand, pot, stack, position, street.
 * @param {{
 *   board: string[];
 *   heroHand: string[];
 *   pot: number;
 *   stack: number;
 *   position: string;
 *   street: string;
 * }} props
 */
export default function PokerTable({ board = [], heroHand = [], pot = 0, stack = 0, position = '', street = '' }) {
  return (
    <div className="relative rounded-[3rem] bg-felt border-8 border-feltDark shadow-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center gap-4 py-6 px-4">
      {/* Subtle table texture */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.3)_100%)]" aria-hidden />

      <div className="relative z-10 flex flex-wrap justify-center gap-3 text-feltDark/90 text-sm font-medium">
        <span aria-label="Street">{street || '—'}</span>
        <span aria-hidden>·</span>
        <span aria-label="Position">Position: {position || '—'}</span>
        <span aria-hidden>·</span>
        <span aria-label="Pot size">Pot: {pot}</span>
        <span aria-hidden>·</span>
        <span aria-label="Stack size">Stack: {stack}</span>
      </div>

      <div className="relative z-10">
        <BoardCards board={board} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-1">
        <span className="text-amber-200/90 text-xs font-medium uppercase tracking-wider">Your hand</span>
        <HeroHand heroHand={heroHand} />
      </div>
    </div>
  );
}
