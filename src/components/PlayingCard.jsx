/**
 * Renders a single playing card from shorthand e.g. "Ah", "Kd", "7c", "2s".
 * Suits: h=hearts, d=diamonds, c=clubs, s=spades.
 */
export default function PlayingCard({ code, faceDown = false, className = '' }) {
  if (faceDown) {
    return (
      <div
        className={`aspect-[2.5/3.5] min-w-[3rem] max-w-[4.5rem] rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 shadow-md ${className}`}
        aria-label="Card face down"
      />
    );
  }

  const suitMap = { h: '♥', d: '♦', c: '♣', s: '♠' };
  const colorMap = { h: 'text-red-600', d: 'text-red-600', c: 'text-slate-800', s: 'text-slate-800' };
  const rank = code.slice(0, -1);
  const suitChar = suitMap[code.slice(-1)] || '';
  const color = colorMap[code.slice(-1)] || 'text-slate-800';

  return (
    <div
      className={`aspect-[2.5/3.5] min-w-[3rem] max-w-[4.5rem] rounded-lg bg-card border-2 border-slate-300 shadow-md flex flex-col items-center justify-center p-0.5 font-display text-lg font-bold ${color} ${className}`}
      aria-label={`${rank} of ${suitChar}`}
    >
      <span>{rank}</span>
      <span className="text-xl leading-none">{suitChar}</span>
    </div>
  );
}
