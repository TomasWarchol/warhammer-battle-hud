/**
 * Ramki drużyny – czysta logika, bez zależności od Foundry.
 */

export const MODES = ["party", "combat", "selected"];

/** Kolejny tryb listy, po ostatnim wraca pierwszy. */
export const nextMode = (mode) => MODES[(MODES.indexOf(mode) + 1) % MODES.length];

const unique = (actors) => [...new Map(actors.filter(Boolean).map((a) => [a.uuid, a])).values()];

/**
 * Które postacie pokazać.
 * party: przypisane graczom, a gdy nikogo nie przypisano, postacie należące do graczy.
 * combat: walczący (gracze widzą tylko postacie graczy). selected: zaznaczone tokeny.
 */
export function pickActors({ mode, users = [], actors = [], combatants = [], controlled = [], partyTypes, isGM }) {
  if (mode === "combat") return unique(isGM ? combatants : combatants.filter((a) => a?.hasPlayerOwner));
  if (mode === "selected") return unique(controlled);
  const assigned = unique(users.filter((u) => !u.isGM).map((u) => u.character)).filter((a) => partyTypes.includes(a.type));
  return assigned.length ? assigned : unique(actors.filter((a) => a.hasPlayerOwner && partyTypes.includes(a.type)));
}

/** Wypełnienie paska w procentach, od 0 do 100. */
export function percent(value, max) {
  if (!(max > 0)) return 0;
  return Math.round(Math.min(100, Math.max(0, (Number(value) / max) * 100)));
}

/**
 * Kolor paska. `health` to wartość malejąca (mało znaczy źle), `damage` rosnąca (dużo znaczy źle), `resource` jest neutralny.
 */
export function tone(kind, pct) {
  if (kind === "resource") return "resource";
  const remaining = kind === "damage" ? 100 - pct : pct;
  if (remaining <= 25) return "critical";
  return remaining <= 50 ? "hurt" : "healthy";
}

/** Zapisana pozycja, przesunięta tak, by ramki nie uciekły poza ekran. */
export function clampPosition({ left, top }, width, height, viewportWidth, viewportHeight) {
  return {
    left: Math.max(0, Math.min(left, Math.max(0, viewportWidth - width))),
    top: Math.max(0, Math.min(top, Math.max(0, viewportHeight - height)))
  };
}
