const RANK_ORDER = '23456789TJQKA';

function cardRank(card) {
  return RANK_ORDER.indexOf(card[0]);
}

function cardSuit(card) {
  return card[1];
}

function choose5(cards) {
  const combos = [];
  const n = cards.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++)
            combos.push([cards[a], cards[b], cards[c], cards[d], cards[e]]);
  return combos;
}

function evaluate5(cards) {
  const ranks = cards.map(cardRank).sort((a, b) => b - a);
  const suits = cards.map(cardSuit);

  const counts = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([r, c]) => [Number(r), c])
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const isFlush = suits.every((s) => s === suits[0]);

  let isStraight = ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5;
  let straightHigh = ranks[0];
  // Wheel: A-2-3-4-5
  if (
    !isStraight &&
    ranks[0] === 12 &&
    ranks[1] === 3 &&
    ranks[2] === 2 &&
    ranks[3] === 1 &&
    ranks[4] === 0
  ) {
    isStraight = true;
    straightHigh = 3;
  }

  if (isFlush && isStraight) return [8, straightHigh];
  if (groups[0][1] === 4) return [7, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]];
  if (isFlush) return [5, ...ranks];
  if (isStraight) return [4, straightHigh];
  if (groups[0][1] === 3) return [3, groups[0][0], ...ranks.filter((r) => r !== groups[0][0])];
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const p1 = Math.max(groups[0][0], groups[1][0]);
    const p2 = Math.min(groups[0][0], groups[1][0]);
    const kicker = ranks.find((r) => r !== p1 && r !== p2);
    return [2, p1, p2, kicker];
  }
  if (groups[0][1] === 2) return [1, groups[0][0], ...ranks.filter((r) => r !== groups[0][0])];
  return [0, ...ranks];
}

export function compareScores(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export function bestHandScore(holeCards, board) {
  const all = [...holeCards, ...board];
  return choose5(all).reduce((best, five) => {
    const score = evaluate5(five);
    return !best || compareScores(score, best) > 0 ? score : best;
  }, null);
}

const HAND_NAMES = [
  'High card',
  'One pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
];

export function handName(score) {
  return HAND_NAMES[score[0]] ?? 'Unknown';
}
