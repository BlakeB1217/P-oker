import { useState, useEffect, useCallback } from 'react';
import { fetchScenario, submitAction } from '../services/api.js';
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

export default function TrainerPage() {
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
    } catch (e) {
      setFeedback({
        recommended_action: '—',
        reasoning: e.message || 'Failed to get feedback.',
        concept: '—',
        userAction: actionId,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const actions = getActions(scenario);
  const showTable = !loading && !loadError && scenario;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="bg-felt text-white py-4 px-4 text-center shadow-md">
        <h1 className="font-display text-2xl font-bold tracking-wide">Poker Strategy Trainer</h1>
        <p className="text-sm text-white/80 mt-1">Choose your action, then see the explanation.</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <ScenarioLoader onLoad={loadScenario} loading={loading} error={loadError}>
          {showTable && (
            <>
              <section aria-label="Poker table">
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
                <section aria-label="Feedback" className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Feedback</h2>
                  <FeedbackPanel feedback={feedback} />
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={loadScenario}
                      className="px-5 py-2.5 rounded-lg font-semibold bg-felt hover:bg-feltDark text-white border-2 border-feltDark transition-colors"
                    >
                      Next hand
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
        </ScenarioLoader>
      </main>
    </div>
  );
}
