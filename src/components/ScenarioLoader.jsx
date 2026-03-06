/**
 * Handles loading a new scenario: calls onLoad on mount and can expose refresh.
 * Used by TrainerPage to trigger initial load and "Next hand".
 */
export default function ScenarioLoader({ onLoad, loading, error, children }) {
  return (
    <>
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500" aria-busy="true">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mb-3" />
          <p>Loading scenario…</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-800 dark:text-red-200" role="alert">
          <p className="font-medium">Could not load scenario</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      {children}
    </>
  );
}
