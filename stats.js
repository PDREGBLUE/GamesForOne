export function streaks(results) {
  let current = 0, best = 0;
  for (const result of results) {
    if (result === 'won') best = Math.max(best, ++current);
    else if (result === 'lost') current = 0;
  }
  return { current, best };
}
