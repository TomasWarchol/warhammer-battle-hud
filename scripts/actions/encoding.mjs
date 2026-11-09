/**
 * Kodowanie akcji HUD do wartości przycisku (`encodedValue`) – bez zależności od Foundry.
 *
 * Format: "typ|id|dodatek". TAH Core przekazuje tę wartość do RollHandlera po kliknięciu.
 * Identyfikatory UUID efektów zawierają kropki, ale nie "|", więc separator jest bezpieczny.
 */

export const DELIMITER = "|";

/** Typy akcji obsługiwane przez moduł. */
export const ACTION_TYPES = Object.freeze({
  characteristic: "characteristic",
  skill: "skill",
  weapon: "weapon",
  armour: "armour",
  spell: "spell",
  channel: "channel",
  channelWind: "channelWind",
  prayer: "prayer",
  trait: "trait",
  talent: "talent",
  extended: "extended",
  item: "item",
  effect: "effect",
  condition: "condition",
  advantage: "advantage"
});

/** Składa wartość przycisku z typu, id i opcjonalnego dodatku. */
export function encodeAction(type, id = "", extra = "") {
  const parts = [type, id, extra].map((part) => String(part ?? ""));
  while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
  return parts.join(DELIMITER);
}

/** Rozkłada wartość przycisku; zwraca `null` dla pustej lub nieznanej wartości. */
export function decodeAction(value) {
  if (!value || typeof value !== "string") return null;
  const [type, id = "", ...rest] = value.split(DELIMITER);
  if (!Object.values(ACTION_TYPES).includes(type)) return null;
  return { type, id, extra: rest.join(DELIMITER) };
}
