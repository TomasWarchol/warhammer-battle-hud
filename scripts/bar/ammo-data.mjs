/**
 * Amunicja – czysta logika, bez zależności od Foundry.
 */

/** Stan zapasu do oznaczenia na pasku. */
export function ammoState(count, low) {
  if (count <= 0) return "empty";
  return count <= low ? "low" : "ok";
}
