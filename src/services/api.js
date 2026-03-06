const API_BASE = '';

// Stub data so the app works without a backend (click-around only)
const STUB_SCENARIO = {
  scenario_id: 'stub-1',
  position: 'BTN',
  hero_hand: ['Ah', 'Js'],
  board: ['Kd', '7c', '2s'],
  pot: 12,
  stack: 100,
  street: 'flop',
  facing_action: 'bb_check',
};

const STUB_FEEDBACK = {
  recommended_action: 'bet_small',
  reasoning: 'You have range advantage on this dry board and strong overcards.',
  concept: 'range advantage',
  ev_difference: 0.18,
};

/**
 * Fetch a new poker scenario from the backend. Uses stub if backend unavailable.
 * @returns {Promise<import('../types').Scenario>}
 */
export async function fetchScenario() {
  try {
    const res = await fetch(`${API_BASE}/scenario`);
    if (res.ok) return res.json();
  } catch (_) {}
  return Promise.resolve({ ...STUB_SCENARIO });
}

/**
 * Submit the user's action and get feedback. Uses stub if backend unavailable.
 * @returns {Promise<import('../types').Feedback>}
 */
export async function submitAction({ handState, userAction, scenarioId }) {
  try {
    const res = await fetch(`${API_BASE}/submit-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hand_state: handState,
        user_action: userAction,
        scenario_id: scenarioId ?? null,
      }),
    });
    if (res.ok) return res.json();
  } catch (_) {}
  return Promise.resolve({ ...STUB_FEEDBACK });
}
