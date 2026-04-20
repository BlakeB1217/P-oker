import { useState, useEffect, useCallback } from 'react';
import { fetchScenario, submitAction } from '../services/api.js';
import { actionsMatch } from '../utils/actionIds.js';
import PokerTable from '../components/PokerTable.jsx';
import ActionButtons from '../components/ActionButtons.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import ScenarioLoader from '../components/ScenarioLoader.jsx';

const STREETS = ['preflop', 'flop', 'turn', 'river'];
const BOT_ACTIONS = [
  { id: 'fold', label: 'Fold' },
  { id: 'call', label: 'Call' },
  { id: 'bet_1', label: '$1' },
  { id: 'bet_2', label: '$2' },
  { id: 'bet_3', label: '$3' },
  { id: 'bet_4', label: '$4' },
  { id: 'bet_5', label: '$5' },
];

/** Derive available actions from scenario (facing_action, street). */
function getActions(scenario) {
  if (!scenario) return [];
  const facing = (scenario.facing_action || '').toLowerCase();
  const hasBet = /bet|raise|open/.test(facing);
  if (hasBet) {
    return [
      { id: 'fold', label: 'Fold' },
      { id: 'call', label: 'Call' },
      { id: 'bet_small', label: 'Raise' },
      { id: 'all_in', label: 'All in' },
    ];
  }
  return [
    { id: 'check', label: 'Check' },
    { id: 'bet_small', label: 'Bet' },
    { id: 'bet_pot', label: 'Bet pot' },
  ];
}

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

function createBotHand() {
  const deck = shuffle(buildDeck());
  const draw = () => deck.pop();

  const hero = [draw(), draw()];
  const botAggro = [draw(), draw()];
  const botTight = [draw(), draw()];

  draw(); // burn before flop
  const flop = [draw(), draw(), draw()];
  draw(); // burn before turn
  const turn = draw();
  draw(); // burn before river
  const river = draw();

  const fullBoard = [...flop, turn, river];

  return {
    hero,
    bots: [
      { name: 'Bot Aggro', style: 'aggressive', hole: botAggro, folded: false },
      { name: 'Bot Tight', style: 'tight', hole: botTight, folded: false },
    ],
    fullBoard,
    streetIndex: 0,
    pot: 3, // $1 small blind + $2 big blind baseline
    log: ['New hand started. User posts $1 SB. Bot Aggro posts $2 BB.'],
    handOver: false,
    winner: null,
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

/**
 * @param {{ onHandGraded?: (wasCorrect: boolean) => void }} props
 */
export default function TrainerPage({ onHandGraded }) {
  const [mode, setMode] = useState('bot-table');
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [botHand, setBotHand] = useState(createBotHand);

  const loadScenario = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    setFeedback(null);
    try {
      const data = await fetchScenario();
      setScenario(data);
    } catch (e) {
      setLoadError(e.message || 'Failed to load scenario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'trainer') {
      loadScenario();
    }
  }, [loadScenario, mode]);

  async function handleAction(actionId) {
    if (!scenario || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const data = await submitAction({
        handState: scenario,
        userAction: actionId,
        scenarioId: scenario.scenario_id ?? null,
      });
      setFeedback({
        ...data,
        userAction: actionId,
      });
      const rec = data.recommended_action;
      const wasCorrect = actionsMatch(actionId, rec);
      onHandGraded?.(wasCorrect);
    } catch (e) {
      setFeedback({
        recommended_action: '—',
        reasoning: e.message || 'Failed to get feedback.',
        concept: '—',
        userAction: actionId,
      });
      onHandGraded?.(false);
    } finally {
      setSubmitting(false);
    }
  }

  function startNextBotHand() {
    setBotHand(createBotHand());
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
        next.log.push('User folds. Bots win the pot.');
        return next;
      }

      next.pot += parseAmount(actionId);
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
        next.log.push('All bots folded. User wins the pot.');
        return next;
      }

      if (next.streetIndex < 3) {
        next.streetIndex += 1;
        next.log.push(`Street advances to ${STREETS[next.streetIndex]}.`);
      } else {
        next.handOver = true;
        next.winner = 'Showdown';
        next.log.push('River action complete. Showdown.');
      }

      return next;
    });
  }

  const actions = getActions(scenario);
  const showTable = !loading && !loadError && scenario;
  const visibleBoard = getBoardForStreet(botHand.fullBoard, botHand.streetIndex);

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Practice
        </h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">
          Click into trainer mode for puzzles, or bot table mode to play through live hands with simple
          betting controls.
        </p>
      </div>

      <section className="flex flex-wrap gap-2" aria-label="Mode selector">
        <button
          type="button"
          onClick={() => setMode('bot-table')}
          className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
            mode === 'bot-table'
              ? 'bg-emerald-500 text-brand-ink border-emerald-400'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          Bot table mode
        </button>
        <button
          type="button"
          onClick={() => setMode('trainer')}
          className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
            mode === 'trainer'
              ? 'bg-emerald-500 text-brand-ink border-emerald-400'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          Trainer mode
        </button>
      </section>

      {mode === 'bot-table' && (
        <>
          <section aria-label="Poker table" className="shadow-glow rounded-3xl">
            <PokerTable
              board={visibleBoard}
              heroHand={botHand.hero}
              pot={botHand.pot}
              stack={100}
              position="SB/Button"
              street={STREETS[botHand.streetIndex]}
            />
          </section>

          <section aria-label="Actions" className="flex flex-col items-center gap-4">
            <ActionButtons disabled={botHand.handOver} actions={BOT_ACTIONS} onAction={runBotTableAction} />
            {botHand.handOver && (
              <button
                type="button"
                onClick={startNextBotHand}
                className="px-6 py-3 rounded-xl font-semibold bg-emerald-500 text-brand-ink hover:bg-emerald-400 transition-colors"
              >
                Deal next hand
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
      )}

      {mode === 'trainer' && (
        <>
          <aside
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-slate-300"
            aria-label="Practice tip"
          >
            <span className="font-semibold text-emerald-400/90">Tip:</span> Name the villain&apos;s likely
            range before you click. Then check whether your action matches the recommended concept.
          </aside>

          <ScenarioLoader loading={loading} error={loadError}>
            {showTable && (
              <>
                <section aria-label="Poker table" className="shadow-glow rounded-3xl">
                  <PokerTable
                    board={scenario.board}
                    heroHand={scenario.hero_hand}
                    pot={scenario.pot}
                    stack={scenario.stack}
                    position={scenario.position}
                    street={scenario.street}
                  />
                </section>

                <section aria-label="Actions" className="flex flex-col items-center gap-4">
                  <ActionButtons disabled={submitting} actions={actions} onAction={handleAction} />
                </section>

                {feedback && (
                  <section aria-label="Feedback" className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-200">Coach feedback</h2>
                    <FeedbackPanel feedback={feedback} />
                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={loadScenario}
                        className="px-6 py-3 rounded-xl font-semibold bg-emerald-500 text-brand-ink hover:bg-emerald-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
                      >
                        Next puzzle
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}
          </ScenarioLoader>
        </>
      )}
    </main>
  );
}
