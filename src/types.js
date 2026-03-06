/**
 * @typedef {Object} Scenario
 * @property {string} [scenario_id] - Backend id (for submit-action)
 * @property {string} position - e.g. "BTN", "SB", "BB"
 * @property {string[]} hero_hand - e.g. ["Ah", "Js"]
 * @property {string[]} board - e.g. ["Kd", "7c", "2s"]
 * @property {number} pot
 * @property {number} stack
 * @property {string} street - e.g. "flop", "turn", "river"
 * @property {string} facing_action - e.g. "bb_check"
 */

/**
 * @typedef {Object} Feedback
 * @property {string} recommended_action
 * @property {string} reasoning
 * @property {string} concept
 * @property {number} [ev_difference]
 */

export default {};
