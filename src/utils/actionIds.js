/**
 * Normalize action strings for comparison (snake_case, spaces, casing).
 * @param {string | null | undefined} s
 */
export function normalizeActionId(s) {
  if (s == null) return '';
  const t = String(s).trim();
  if (t === '' || t === '—' || t === '-') return '';
  return t.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Whether the user's action matches the recommended action.
 * @param {string | null | undefined} userAction
 * @param {string | null | undefined} recommended
 */
export function actionsMatch(userAction, recommended) {
  return normalizeActionId(userAction) === normalizeActionId(recommended);
}
