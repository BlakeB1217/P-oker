import { useState, useEffect, useCallback } from 'react';
import { fetchScenario, submitAction } from '../services/api.js';
import { actionsMatch } from '../utils/actionIds.js';
import PokerTable from '../components/PokerTable.jsx';
import ActionButtons from '../components/ActionButtons.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import ScenarioLoader from '../components/ScenarioLoader.jsx';

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

/**
 * @param {{ onHandGraded?: (wasCorrect: boolean) => void }} props
 */
export default function TrainerPage({ onHandGraded }) {
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    loadScenario();
  }, [loadScenario]);

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

  const actions = getActions(scenario);
  const showTable = !loading && !loadError && scenario;

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Practice
        </h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">
          Pick the line you would take at the table. Feedback appears after you commit — like a tactics
          puzzle with the solution revealed.
        </p>
      </div>

      <aside
        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-slate-300"
        aria-label="Practice tip"
      >
        <span className="font-semibold text-emerald-400/90">Tip:</span>{' '}
        Name the villain&apos;s likely range before you click. Then check whether your action matches the
        recommended concept.
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
              <ActionButtons
                disabled={submitting}
                actions={actions}
                onAction={handleAction}
              />
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
    </main>
  );
}
