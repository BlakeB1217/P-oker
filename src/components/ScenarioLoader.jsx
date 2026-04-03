/**
 * Loading / error UI around scenario content.
 */
export default function ScenarioLoader({ loading, error, children }) {
  return (
    <>
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500" aria-busy="true">
          <div className="w-11 h-11 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin mb-4" />
          <p className="text-slate-400">Dealing next scenario…</p>
        </div>
      )}
      {error && (
        <div
          className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-200"
          role="alert"
        >
          <p className="font-semibold text-red-100">Could not load scenario</p>
          <p className="text-sm mt-1 text-red-200/90">{error}</p>
        </div>
      )}
      {children}
    </>
  );
}
