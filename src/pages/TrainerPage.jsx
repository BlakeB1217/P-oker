import { useEffect, useState } from 'react';
import PokerTable from '../components/PokerTable.jsx';
import ActionButtons from '../components/ActionButtons.jsx';
import { bestHandScore, compareScores, handName } from '../utils/handEvaluator.js';

const STREETS = ['preflop', 'flop', 'turn', 'river'];
const OPPONENT_STYLES = ['aggressive', 'moderate', 'tight'];
const BET_FRACTIONS = [
  { id: 'bet_1', fraction: 1 / 3, shortLabel: '1/3 pot' },
  { id: 'bet_2', fraction: 1 / 2, shortLabel: '1/2 pot' },
  { id: 'bet_3', fraction: 3 / 4, shortLabel: '3/4 pot' },
  { id: 'bet_4', fraction: 1,     shortLabel: 'Pot' },
  { id: 'bet_5', fraction: 1.5,   shortLabel: '1.5x pot' },
];

function betAmountForId(id, pot) {
  const entry = BET_FRACTIONS.find((b) => b.id === id);
  if (!entry) return 0;
  return Math.max(1, Math.round(pot * entry.fraction));
}

function getBetActions(pot) {
  return BET_FRACTIONS.map(({ id, fraction, shortLabel }) => {
    const amt = Math.max(1, Math.round(pot * fraction));
    return { id, label: `${shortLabel} ($${amt})`, amount: amt };
  });
}

const SB = 1;
const BB = 2;

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

// Show $5 not $5.00
function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function createBotHand(startingStack = 100, opponentStyle = 'aggressive') {
  const deck = shuffle(buildDeck());
  const draw = () => deck.pop();
  const userSB = Math.min(SB, startingStack);
  const botBB = Math.min(BB, startingStack);
  const styleLabel = formatStyleLabel(opponentStyle);

  const hero = [draw(), draw()];
  const botHole = [draw(), draw()];

  draw();
  const flop = [draw(), draw(), draw()];
  draw();
  const turn = draw();
  draw();
  const river = draw();

  return {
    hero,
    bots: [{
      name: `Bot ${styleLabel}`,
      style: opponentStyle,
      hole: botHole,
      folded: false,
      stack: startingStack - botBB,
    }],
    fullBoard: [...flop, turn, river],
    streetIndex: 0,
    pot: userSB + botBB,
    startingStack,
    userStack: startingStack - userSB,
    userCommitted: userSB,
    toCall: botBB - userSB,
    awaitingUserResponse: false,
    showBotCards: false,
    log: [`New hand. User posts $${userSB} SB. Bot ${styleLabel} posts $${botBB} BB.`],
    handOver: false,
    winner: null,
    settled: false,
  };
}

function parseBetAmount(actionId, pot) {
  if (actionId.startsWith('bet_')) return betAmountForId(actionId, pot);
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
  if (roll < 0.3) return 'fold';
  if (roll < 0.75) return 'call';
  if (roll < 0.88) return 'bet_1';
  if (roll < 0.96) return 'bet_2';
  return 'bet_3';
}

function advanceStreetOrShowdown(next) {
  const aliveBots = next.bots.filter((b) => !b.folded);

  if (next.streetIndex < 3) {
    next.streetIndex += 1;
    next.toCall = 0;
    next.awaitingUserResponse = false;
    next.log.push(`Street advances to ${STREETS[next.streetIndex]}.`);
    return next;
  }

  // River is done — showdown
  next.handOver = true;
  next.showBotCards = true;
  const board = next.fullBoard;
  const heroScore = bestHandScore(next.hero, board);

  let winnerBot = null;
  let bestBotScore = null;
  for (const bot of aliveBots) {
    const botScore = bestHandScore(bot.hole, board);
    if (!bestBotScore || compareScores(botScore, bestBotScore) > 0) {
      bestBotScore = botScore;
      winnerBot = bot;
    }
  }

  const cmp = compareScores(heroScore, bestBotScore);
  if (cmp > 0) {
    next.winner = 'User';
    next.log.push(`Showdown: User wins with ${handName(heroScore)}.`);
  } else if (cmp < 0) {
    next.winner = winnerBot.name;
    next.log.push(`Showdown: ${winnerBot.name} wins with ${handName(bestBotScore)}.`);
  } else {
    next.winner = 'Tie';
    next.log.push(`Showdown: Tie — both have ${handName(heroScore)}.`);
  }

  return next;
}

export default function TrainerPage({ onHandGraded }) {
  const [opponentStyle, setOpponentStyle] = useState('aggressive');
  const [userBankroll, setUserBankroll] = useState(100);
  const [botHand, setBotHand] = useState(() => createBotHand(100, 'aggressive'));
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [leaks, setLeaks] = useState(null);
  const [leaksLoading, setLeaksLoading] = useState(false);
  const [decisionsTracked, setDecisionsTracked] = useState(null);
  const [leaksStale, setLeaksStale] = useState(false);

  useEffect(() => {
    fetch('/api/decisions/count')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setDecisionsTracked(d.count))
      .catch(() => {});
  }, []);

  function startNextBotHand() {
    setCoachFeedback(null);
    setBotHand(createBotHand(userBankroll, opponentStyle));
  }

  async function fetchLeaks() {
    setLeaksLoading(true);
    setLeaksStale(false);
    try {
      const res = await fetch('/api/leaks');
      if (res.ok) setLeaks(await res.json());
    } catch {
      // Backend offline
    } finally {
      setLeaksLoading(false);
    }
  }

  async function clearHistory() {
    await fetch('/api/decisions', { method: 'DELETE' });
    setLeaks(null);
    setDecisionsTracked(0);
    setLeaksStale(false);
  }

  async function handleUserAction(actionId) {
    // Snapshot the state we need BEFORE the game updates
    const snapshot = {
      hero_hand: botHand.hero,
      board: getBoardForStreet(botHand.fullBoard, botHand.streetIndex),
      street: STREETS[botHand.streetIndex],
      pot: botHand.pot,
      to_call: botHand.toCall,
      user_action: actionId,
      style: opponentStyle,
    };

    // Game update fires immediately (synchronous, responsive)
    runBotTableAction(actionId);

    // Coach call fires in parallel — silently ignored if backend not running
    setCoachFeedback(null);
    setCoachLoading(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      if (res.ok) {
        const feedback = await res.json();
        setCoachFeedback(feedback);
        setDecisionsTracked((n) => (n ?? 0) + 1);
        setLeaksStale(true);
        onHandGraded?.(feedback.match);
      }
    } catch {
      // Backend offline — no coach feedback, game still works fine
    } finally {
      setCoachLoading(false);
    }
  }

  function runBotTableAction(actionId) {
    setBotHand((prev) => {
      if (prev.handOver) return prev;

      const next = {
        ...prev,
        bots: prev.bots.map((b) => ({ ...b })),
        log: [...prev.log],
      };

      // Fold is always valid
      if (actionId === 'fold') {
        const winningBot = next.bots.find((b) => !b.folded);
        next.handOver = true;
        next.winner = winningBot ? winningBot.name : 'Bot';
        next.showBotCards = true;
        next.log.push(`User folds. ${next.winner} wins the pot.`);
        return next;
      }

      // Phase 2: user is responding to a bot bet after checking
      if (next.awaitingUserResponse) {
        const userPutIn = Math.min(next.toCall, next.userStack);
        next.userStack -= userPutIn;
        next.userCommitted += userPutIn;
        next.pot += userPutIn;
        next.log.push(`User calls $${userPutIn}.`);
        next.awaitingUserResponse = false;
        next.toCall = 0;
        return advanceStreetOrShowdown(next);
      }

      // Phase 1: normal user action
      const userAmount = actionId === 'call' ? next.toCall : parseBetAmount(actionId, next.pot);
      const userPutIn = Math.min(userAmount, next.userStack);
      next.userStack -= userPutIn;
      next.userCommitted += userPutIn;
      next.pot += userPutIn;
      next.log.push(`User ${userPutIn === 0 ? 'checks' : actionId === 'call' ? `calls $${userPutIn}` : `bets $${userPutIn}`}.`);

      const userChecked = userPutIn === 0;
      // Preflop: bot already posted BB; if user just called (no raise), bot checks back
      const preflopBotAlreadyIn = next.streetIndex === 0 && actionId === 'call';
      let needsUserResponse = false;
      let botBetAmount = 0;

      for (const bot of next.bots) {
        if (bot.folded) continue;

        let botAction = preflopBotAlreadyIn ? 'call' : chooseBotAction(bot.style);

        // If user bet, bot can only call or fold — no re-raises
        if (!userChecked && botAction.startsWith('bet_')) {
          botAction = 'call';
        }

        if (botAction === 'fold') {
          bot.folded = true;
          next.log.push(`${bot.name} folds.`);
        } else if (botAction === 'call') {
          // Preflop BB-check costs $0; otherwise match what user put in
          const callAmt = preflopBotAlreadyIn ? 0 : Math.min(userPutIn, bot.stack);
          bot.stack -= callAmt;
          next.pot += callAmt;
          next.log.push(`${bot.name} ${callAmt === 0 ? 'checks' : `calls $${callAmt}`}.`);
        } else {
          // Bot bets — only valid when user checked
          const betAmt = parseBetAmount(botAction, next.pot);
          const botPutIn = Math.min(betAmt, bot.stack);
          if (botPutIn > 0) {
            bot.stack -= botPutIn;
            next.pot += botPutIn;
            next.log.push(`${bot.name} bets $${botPutIn}.`);
            needsUserResponse = true;
            botBetAmount = botPutIn;
          } else {
            next.log.push(`${bot.name} checks.`);
          }
        }
      }

      const aliveBots = next.bots.filter((b) => !b.folded);
      if (aliveBots.length === 0) {
        next.handOver = true;
        next.winner = 'User';
        next.log.push('All bots folded. User wins the pot.');
        return next;
      }

      // Bot bet after user checked — user must respond
      if (needsUserResponse) {
        next.awaitingUserResponse = true;
        next.toCall = botBetAmount;
        return next;
      }

      return advanceStreetOrShowdown(next);
    });
  }

  useEffect(() => {
    if (!botHand.handOver || botHand.settled) return;

    const userWon = botHand.winner === 'User';
    const tie = botHand.winner === 'Tie';
    // Tie: user gets half the pot; loss: user gets nothing back
    const payout = userWon ? botHand.pot : tie ? Math.floor(botHand.pot / 2) : 0;
    const updatedStack = botHand.userStack + payout;
    const resultLine = userWon
      ? `User collects $${fmt(botHand.pot)} pot.`
      : tie
      ? `Split pot. User gets $${fmt(Math.floor(botHand.pot / 2))}.`
      : `User loses $${fmt(botHand.userCommitted)} this hand.`;

    setUserBankroll(updatedStack);
    setBotHand((prev) => ({
      ...prev,
      userStack: updatedStack,
      settled: true,
      log: [...prev.log, resultLine],
    }));
  }, [botHand]);

  const visibleBoard = getBoardForStreet(botHand.fullBoard, botHand.streetIndex);

  // When awaiting response to a bot bet, only show fold/call
  const callLabel = botHand.toCall > 0 ? `Call $${botHand.toCall}` : 'Check';
  const availableBets = botHand.awaitingUserResponse
    ? []
    : getBetActions(botHand.pot).filter(({ amount }) => amount <= botHand.userStack);
  const actions = [{ id: 'fold', label: 'Fold' }, { id: 'call', label: callLabel }, ...availableBets];

  const botHandsForTable = botHand.bots.map((b) => ({
    name: b.name,
    hole: b.hole,
    folded: b.folded,
    revealed: botHand.showBotCards,
    stack: b.stack,
  }));

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
                setCoachFeedback(null);
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
            botHands={botHandsForTable}
          />
        </section>

        <section aria-label="Actions" className="flex flex-col items-center gap-4">
          <p className="text-sm text-slate-300">Bankroll: ${fmt(userBankroll)}</p>
          {botHand.awaitingUserResponse && (
            <p className="text-sm text-amber-300 font-medium">
              Bot bet ${botHand.toCall} — call or fold?
            </p>
          )}
          <ActionButtons
            disabled={botHand.handOver || botHand.userStack <= 0}
            actions={actions}
            onAction={handleUserAction}
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

        {(coachLoading || coachFeedback) && (
          <section className="rounded-xl border border-indigo-700/60 bg-indigo-950/60 p-4" aria-label="Coach feedback">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-300 mb-2">
              Coach {coachFeedback && <span className="text-indigo-500 font-normal normal-case">— {coachFeedback.street}</span>}
            </h2>
            {coachLoading && (
              <p className="text-sm text-indigo-400 animate-pulse">Analyzing your play…</p>
            )}
            {!coachLoading && coachFeedback && (
              <div className="space-y-2 text-sm">
                <p className={`font-semibold ${coachFeedback.match ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {coachFeedback.verdict}
                </p>
                <p className="text-slate-300">
                  <span className="text-indigo-300 font-medium">Hand: </span>
                  {coachFeedback.hand_strength}
                </p>
                <p className="text-slate-300">{coachFeedback.reasoning}</p>
                {!coachFeedback.match && (
                  <p className="text-slate-400">
                    Coach recommended:{' '}
                    <span className="text-indigo-300 font-medium">{coachFeedback.recommended_label}</span>
                  </p>
                )}
                {coachFeedback.action_probs && (
                  <div className="pt-1">
                    <p className="text-xs text-indigo-400 mb-1">Coach preference breakdown:</p>
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(coachFeedback.action_probs)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, prob]) => (
                          <div key={label} className="flex flex-col items-center gap-0.5">
                            <div className="w-12 bg-slate-700 rounded-full h-1.5">
                              <div
                                className="bg-indigo-400 h-1.5 rounded-full"
                                style={{ width: `${Math.round(prob * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{label}</span>
                            <span className="text-xs text-indigo-300">{(prob * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl border border-violet-700/60 bg-violet-950/60 p-4" aria-label="Tendencies">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-300">My Tendencies</h2>
              {decisionsTracked !== null && (
                <p className="text-xs text-violet-500 mt-0.5">{decisionsTracked} decision{decisionsTracked !== 1 ? 's' : ''} tracked</p>
              )}
            </div>
            <div className="flex gap-2">
              {leaks && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-700 transition-colors"
                >
                  Clear history
                </button>
              )}
              <button
                type="button"
                onClick={fetchLeaks}
                disabled={leaksLoading}
                className="text-xs px-3 py-1 rounded-lg bg-violet-700 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
              >
                {leaksLoading ? 'Analyzing…' : leaksStale ? 'Refresh' : 'Analyze My Play'}
              </button>
            </div>
          </div>
          {leaksStale && leaks && (
            <p className="text-xs text-violet-500 mb-2">You've played more hands since last analysis — refresh for updated results.</p>
          )}
          {!leaks && !leaksLoading && (
            <p className="text-sm text-violet-400">Click to see patterns in your play across all tracked decisions.</p>
          )}
          {leaks && !leaks.enough_data && (
            <p className="text-sm text-violet-400">
              Not enough data yet — play {leaks.needed - leaks.decisions_tracked} more decision{leaks.needed - leaks.decisions_tracked !== 1 ? 's' : ''} to unlock analysis.
            </p>
          )}
          {leaks && leaks.enough_data && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-4 flex-wrap">
                <span className="text-slate-300">
                  <span className="text-violet-300 font-medium">Decisions: </span>{leaks.decisions_tracked}
                </span>
                <span className="text-slate-300">
                  <span className="text-violet-300 font-medium">Accuracy: </span>
                  {(leaks.overall_accuracy * 100).toFixed(0)}%
                </span>
                {leaks.worst_street && (
                  <span className="text-slate-300">
                    <span className="text-violet-300 font-medium">Weakest: </span>
                    {leaks.worst_street}
                  </span>
                )}
              </div>
              {leaks.leaks.length === 0 ? (
                <p className="text-emerald-400 font-medium">No major leaks detected — solid play!</p>
              ) : (
                <ul className="space-y-1">
                  {leaks.leaks.map((leak) => (
                    <li key={leak.type} className={`${leak.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>
                      {leak.message}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-3 flex-wrap text-xs text-slate-400">
                {Object.entries(leaks.by_street).map(([street, data]) => (
                  <span key={street}>
                    {street}: <span className={data.accuracy >= 0.6 ? 'text-emerald-400' : 'text-amber-400'}>{(data.accuracy * 100).toFixed(0)}%</span>
                  </span>
                ))}
              </div>

              {leaks.clusters ? (
                <div className="pt-1">
                  <p className="text-xs text-violet-400 font-medium mb-2">Situation clusters — where you go wrong:</p>
                  <div className="space-y-2">
                    {leaks.clusters.map((cluster, i) => (
                      <div key={i} className="rounded-lg border border-violet-800/50 bg-violet-900/20 px-3 py-2">
                        <p className="text-slate-300 text-xs leading-relaxed">{cluster.description}</p>
                        <p className="text-violet-500 text-xs mt-1">{cluster.count} decision{cluster.count !== 1 ? 's' : ''} in this pattern</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : leaks.clusters_needed > 0 ? (
                <p className="text-xs text-violet-500">
                  Make {leaks.clusters_needed} more mistake{leaks.clusters_needed !== 1 ? 's' : ''} to unlock situation cluster analysis.
                </p>
              ) : null}
            </div>
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
