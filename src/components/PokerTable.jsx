import BoardCards from './BoardCards.jsx';
import HeroHand from './HeroHand.jsx';
import PlayingCard from './PlayingCard.jsx';

export default function PokerTable({
  board = [],
  heroHand = [],
  pot = 0,
  stack = 0,
  position = '',
  street = '',
  botHands = [],
}) {
  return (
    <div className="relative rounded-[3rem] bg-felt border-8 border-feltDark shadow-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center gap-4 py-6 px-4">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.3)_100%)]" aria-hidden />

      <div className="relative z-10 flex flex-wrap justify-center gap-3 text-amber-200 text-sm font-semibold drop-shadow">
        <span aria-label="Street">{street || '—'}</span>
        <span aria-hidden>·</span>
        <span aria-label="Position">Position: {position || '—'}</span>
        <span aria-hidden>·</span>
        <span aria-label="Pot size">Pot: {pot}</span>
        <span aria-hidden>·</span>
        <span aria-label="Stack size">Stack: {stack}</span>
      </div>

      {botHands.length > 0 && (
        <div className="relative z-10 flex flex-col items-center gap-3">
          {botHands.map((bot) => (
            <div key={bot.name} className="flex flex-col items-center gap-1">
              <span className="text-amber-100/90 text-xs font-medium uppercase tracking-wider">
                {bot.folded ? `${bot.name} (folded)` : `${bot.name} — Stack: $${bot.stack}`}
              </span>
              <div className="flex gap-1 sm:gap-2">
                {bot.hole.map((code, i) => (
                  <PlayingCard
                    key={`${code}-${i}`}
                    code={code}
                    faceDown={!bot.revealed}
                    className={bot.folded ? 'opacity-40' : ''}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
