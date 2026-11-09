/** Trudność przesunięta o `steps` stopni w stronę trudniejszych (lista od najłatwiejszej). */
export function shiftDifficulty(key, steps, order) {
  const index = order.indexOf(key);
  if (index < 0) return key;
  return order[Math.min(order.length - 1, index + Math.max(0, steps))];
}
