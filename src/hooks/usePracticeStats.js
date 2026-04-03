import { useCallback, useState } from 'react';

const STORAGE_KEY = 'poker-trainer-stats';

function readStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        hands: Number(parsed.hands) || 0,
        correct: Number(parsed.correct) || 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { hands: 0, correct: 0 };
}

export function usePracticeStats() {
  const [stats, setStats] = useState(() => readStats());

  const recordHand = useCallback((wasCorrect) => {
    setStats((prev) => {
      const next = {
        hands: prev.hands + 1,
        correct: prev.correct + (wasCorrect ? 1 : 0),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const accuracy =
    stats.hands > 0 ? Math.round((stats.correct / stats.hands) * 100) : null;

  return { stats, accuracy, recordHand };
}
