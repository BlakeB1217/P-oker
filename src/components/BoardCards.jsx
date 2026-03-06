import PlayingCard from './PlayingCard.jsx';

/**
 * Displays the community board (flop, turn, river).
 * @param {{ board: string[] }} props
 */
export default function BoardCards({ board = [] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1 sm:gap-2" role="group" aria-label="Board cards">
      {board.map((code, i) => (
        <PlayingCard key={`${code}-${i}`} code={code} />
      ))}
    </div>
  );
}
