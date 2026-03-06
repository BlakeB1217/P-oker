import PlayingCard from './PlayingCard.jsx';

/**
 * Displays hero's hole cards.
 * @param {{ heroHand: string[] }} props
 */
export default function HeroHand({ heroHand = [] }) {
  return (
    <div className="flex justify-center gap-1 sm:gap-2" role="group" aria-label="Your hole cards">
      {heroHand.map((code, i) => (
        <PlayingCard key={`${code}-${i}`} code={code} className="ring-2 ring-amber-400/60" />
      ))}
    </div>
  );
}
