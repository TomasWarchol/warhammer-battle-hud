/**
 * Zamiana kliknięcia (przycisk myszy + modyfikatory) na zamiar akcji – bez zależności od Foundry.
 *
 * Domyślne sterowanie:
 *  - lewy klik: test (z dialogiem), stan +1, Przewaga +1, wpis talentu/przedmiotu na czat,
 *  - prawy klik: arkusz przedmiotu, stan −1, Przewaga −1,
 *  - Shift: test jako Blind GM (ustawienie),
 *  - Alt: test bez dialogu (albo z dialogiem, gdy w ustawieniach pomijanie jest domyślne),
 *  - Ctrl + lewy / prawy na broni i pancerzu: naprawa / uszkodzenie o 1.
 */
import { ACTION_TYPES as T } from "./encoding.mjs";

/** Typy, które uruchamiają test systemu. */
export const ROLLABLE = new Set([T.characteristic, T.skill, T.weapon, T.spell, T.channel, T.channelWind, T.prayer, T.trait, T.extended]);

/** Typy powiązane z przedmiotem (prawy klik otwiera arkusz). */
const ITEM_BACKED = new Set([T.skill, T.weapon, T.armour, T.spell, T.channel, T.prayer, T.trait, T.talent, T.extended, T.item]);

/** Typy sprzętu, który można uszkodzić i naprawić. */
const DAMAGEABLE = new Set([T.weapon, T.armour]);

/**
 * @typedef {object} Intent
 * @property {"roll"|"sheet"|"post"|"damage"|"repair"|"increase"|"decrease"|"run"|"none"} intent
 * @property {boolean} [skipDialog]  pominąć dialog testu
 * @property {string}  [rollMode]    wymuszony tryb rzutu (np. "blindroll")
 */

/**
 * @param {string} type  typ akcji (ACTION_TYPES)
 * @param {{right?: boolean, shift?: boolean, alt?: boolean, ctrl?: boolean}} mods
 * @param {{blindOnShift?: boolean, skipDialogByDefault?: boolean}} [settings]
 * @returns {Intent}
 */
export function resolveIntent(type, mods = {}, settings = {}) {
  const { right = false, shift = false, alt = false, ctrl = false } = mods;
  const { blindOnShift = true, skipDialogByDefault = false } = settings;

  if (ctrl && DAMAGEABLE.has(type)) return { intent: right ? "damage" : "repair" };

  if (type === T.condition || type === T.advantage) return { intent: right ? "decrease" : "increase" };

  if (type === T.effect) return { intent: right ? "sheet" : "run" };

  if (right) return { intent: ITEM_BACKED.has(type) ? "sheet" : "none" };

  if (ROLLABLE.has(type)) {
    const intent = { intent: "roll", skipDialog: alt !== skipDialogByDefault };
    if (shift && blindOnShift) intent.rollMode = "blindroll";
    return intent;
  }

  if (type === T.armour) return { intent: "sheet" };
  if (type === T.talent || type === T.item) return { intent: "post" };
  return { intent: "none" };
}
