import { useEffect, useState } from 'react';
import PokerTable from '../components/PokerTable.jsx';
import ActionButtons from '../components/ActionButtons.jsx';

const STREETS = ['preflop', 'flop', 'turn', 'river'];
const OPPONENT_STYLES = ['aggressive', 'moderate', 'tight'];
const BOT_ACTIONS = [
  { id: 'fold', label: 'Fold' },
  { id: 'call', label: 'Call' },
  { id: 'bet_1', label: '$1' },
  { id: 'bet_2', label: '$2' },
  { id: 'bet_3', label: '$3' },
  { id: 'bet_4', label: '$4' },
  { id: 'bet_5', label: '$5' },
];

function buildDeck() {
  const ranks = '23456789TJQKA';
  const suits = 'cdhs';
  return [...ranks].flatMap((rank) => [...suits].map((suit) => `${rank}${suit}`));
}

function shuffle(items) {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getBoardForStreet(fullBoard, streetIndex) {
  if (streetIndex <= 0) return [];
  if (streetIndex === 1) return fullBoard.slice(0, 3);
  if (streetIndex === 2) return fullBoard.slice(0, 4);
  return fullBoard.slice(0, 5);
}

function formatStyleLabel(style) {
  if (style === 'aggressive') return 'Aggro';
  if (style === 'moderate') return 'Moderate';
  return 'Tight';
}

function createBotHand(startingStack = 100, opponentStyle = 'aggressive') {
  const deck = shuffle(buildDeck());
  const draw = () => deck.pop();
  const smallBlind = Math.min(1, startingStack);
  const userStackAfterBlind = startingStack - smallBlind;

  const hero = [draw(), draw()];
  const botHole = [draw(), draw()];

  draw(); // burn before flop
  const flop = [draw(), draw(), draw()];
  draw(); // burn before turn
  const turn = draw();
  draw(); // burn before river
  const river = draw();

  const fullBoard = [...flop, turn, river];

  return {
    hero,
    bots: [{ name: `Bot ${formatStyleLabel(opponentStyle)}`, style: opponentStyle, hole: botHole, folded: false }],
    fullBoard,
    streetIndex: 0,
    pot: smallBlind + 2, // User posts SB, Bot Aggro posts BB
    startingStack,
    userStack: userStackAfterBlind,
    userCommitted: smallBlind,
    log: [`New hand started. User posts $${smallBlind} SB. Bot ${formatStyleLabel(opponentStyle)} posts $2 BB.`],
    handOver: false,
    winner: null,
    settled: false,
  };
}

function parseAmount(actionId) {
  if (actionId.startsWith('bet_')) return Number(actionId.split('_')[1] || 0);
  if (actionId === 'call') return 2;
  return 0;
}

function chooseBotAction(style) {
  const roll = Math.random();
  if (style === 'aggressive') {
    if (roll < 0.1) return 'fold';
    if (roll < 0.35) return 'call';
    if (roll < 0.5) return 'bet_2';
    if (roll < 0.7) return 'bet_3';
    if (roll < 0.88) return 'bet_4';
    return 'bet_5';
  }
  if (style === 'moderate') {
    if (roll < 0.18) return 'fold';
    if (roll < 0.58) return 'call';
    if (roll < 0.74) return 'bet_1';
    if (roll < 0.87) return 'bet_2';
    if (roll < 0.96) return 'bet_3';
    return 'bet_4';
  }
  // Tight profile folds/calls more and chooses smaller bets
  if (roll < 0.3) return 'fold';
  if (roll < 0.75) return 'call';
  if (roll < 0.88) return 'bet_1';
  if (roll < 0.96) return 'bet_2';
  return 'bet_3';
}

function actionLabel(actionId) {
  if (actionId === 'fold') return 'folds';
  if (actionId === 'call') return 'calls';
  if (actionId.startsWith('bet_')) return `bets $${parseAmount(actionId)}`;
  return actionId;
}

function resolveShowdownWinner(bots) {
  const contenders = ['User', ...bots.filter((bot) => !bot.folded).map((bot) => bot.name)];
  return contenders[Math.floor(Math.random() * contenders.length)];
}

export default function TrainerPage() {
  const [opponentStyle, setOpponentStyle] = useState('aggressive');
  const [userBankroll, setUserBankroll] = useState(100);
  const [botHand, setBotHand] = useState(() => createBotHand(100, 'aggressive'));

  function startNextBotHand() {
    setBotHand(createBotHand(userBankroll, opponentStyle));
  }

  function runBotTableAction(actionId) {
    setBotHand((prev) => {
      if (prev.handOver) return prev;

      const next = {
        ...prev,
        bots: prev.bots.map((b) => ({ ...b })),
        log: [...prev.log],
      };

      if (actionId === 'fold') {
        next.handOver = true;
        next.winner = 'Bots';
        next.settled = false;
        next.log.push('User folds. Bots win the pot.');
        return next;
      }

      const requestedAmount = parseAmount(actionId);
      const userPutIn = Math.min(requestedAmount, next.userStack);
      next.userStack -= userPutIn;
      next.userCommitted += userPutIn;
      next.pot += userPutIn;
      if (requestedAmount > userPutIn) {
        next.log.push(`User can only put in $${userPutIn}.`);
      }
      next.log.push(`User ${actionLabel(actionId)}.`);

      for (const bot of next.bots) {
        if (bot.folded) continue;
        const botAction = chooseBotAction(bot.style);
        if (botAction === 'fold') {
          bot.folded = true;
          next.log.push(`${bot.name} folds.`);
        } else {
          next.pot += parseAmount(botAction);
          next.log.push(`${bot.name} ${actionLabel(botAction)}.`);
        }
      }

      const aliveBots = next.bots.filter((bot) => !bot.folded).length;
      if (aliveBots === 0) {
        next.handOver = true;
        next.winner = 'User';
        next.settled = false;
        next.log.push('All bots folded. User wins the pot.');
        return next;
      }

      if (next.streetIndex < 3) {
        next.streetIndex += 1;
        next.log.push(`Street advances to ${STREETS[next.streetIndex]}.`);
      } else {
        next.handOver = true;
        next.winner = resolveShowdownWinner(next.bots);
        next.settled = false;
        next.log.push(`River action complete. Showdown winner: ${next.winner}.`);
      }

      return next;
    });
  }

  useEffect(() => {
    if (!botHand.handOver || botHand.settled) return;

    const userWon = botHand.winner === 'User';
    const payout = userWon ? botHand.pot : 0;
    const updatedStack = botHand.userStack + payout;
    const resultLine = userWon
      ? `User collects $${botHand.pot.toFixed(2)} pot.`
      : `User loses $${botHand.userCommitted.toFixed(2)} this hand.`;

    setUserBankroll(updatedStack);
    setBotHand((prev) => ({
      ...prev,
      userStack: updatedStack,
      settled: true,
      log: [...prev.log, resultLine],
    }));
  }, [botHand]);
  const visibleBoard = getBoardForStreet(botHand.fullBoard, botHand.streetIndex);

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Bot Table
        </h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">
          Play heads-up style limit hands versus selectable bot profiles with simple betting controls.
        </p>
      </div>

      <>
        <section className="flex flex-wrap items-center gap-2" aria-label="Opponent selector">
          <span className="text-sm text-slate-300 mr-1">Opponent:</span>
          {OPPONENT_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => {
                setOpponentStyle(style);
                setBotHand(createBotHand(userBankroll, style));
              }}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
                opponentStyle === style
                  ? 'bg-emerald-500 text-brand-ink border-emerald-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {formatStyleLabel(style)}
            </button>
          ))}
        </section>

        <section aria-label="Poker table" className="shadow-glow rounded-3xl">
          <PokerTable
            board={visibleBoard}
            heroHand={botHand.hero}
            pot={botHand.pot}
            stack={botHand.userStack}
            position="SB/Button"
            street={STREETS[botHand.streetIndex]}
          />
        </section>

        <section aria-label="Actions" className="flex flex-col items-center gap-4">
          <p className="text-sm text-slate-300">Bankroll: ${userBankroll.toFixed(2)}</p>
          <ActionButtons
            disabled={botHand.handOver || botHand.userStack <= 0}
            actions={BOT_ACTIONS}
            onAction={runBotTableAction}
          />
          {botHand.handOver && (
            <button
              type="button"
              onClick={startNextBotHand}
              className="px-6 py-3 rounded-xl font-semibold bg-emerald-500 text-brand-ink hover:bg-emerald-400 transition-colors"
            >
              Deal next hand
            </button>
          )}
          {botHand.userStack <= 0 && !botHand.handOver && (
            <button
              type="button"
              onClick={() => {
                setUserBankroll(100);
                setBotHand(createBotHand(100, opponentStyle));
              }}
              className="px-6 py-3 rounded-xl font-semibold bg-slate-600 text-white hover:bg-slate-500 transition-colors"
            >
              Reset bankroll
            </button>
          )}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4" aria-label="Hand action log">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-2">Hand log</h2>
          <div className="space-y-1 text-sm text-slate-300 max-h-56 overflow-auto">
            {botHand.log.map((line, idx) => (
              <p key={`${line}-${idx}`}>{line}</p>
            ))}
          </div>
          {botHand.handOver && (
            <p className="mt-3 text-emerald-300 font-medium">Result: {botHand.winner}</p>
          )}
        </section>
      </>
    </main>
  );
}
