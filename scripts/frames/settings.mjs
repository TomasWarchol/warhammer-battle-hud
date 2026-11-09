/**
 * Ustawienia. Wygląd i położenie są osobiste; to, co gracze widzą o innych, ustala MG.
 */
import { MODULE_ID, I18N } from "./constants.mjs";

export function registerSettings(onChange) {
  const visible = {
    showFrames: { scope: "client", type: Boolean, default: true },
    skin: { scope: "client", type: String, default: "parchment", choices: { parchment: `${I18N}.Skin.parchment`, imperium: `${I18N}.Skin.imperium` } },
    playersSeeAll: { scope: "world", type: Boolean, default: true }
  };
  for (const [key, data] of Object.entries(visible)) {
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    game.settings.register(MODULE_ID, key, { name: `${I18N}.Settings.${name}Name`, hint: `${I18N}.Settings.${name}Hint`, config: true, onChange, ...data });
  }
  // Wartości zmieniane bezpośrednio na ramkach
  game.settings.register(MODULE_ID, "mode", { scope: "client", config: false, type: String, default: "party" });
  game.settings.register(MODULE_ID, "collapsed", { scope: "client", config: false, type: Boolean, default: false });
  game.settings.register(MODULE_ID, "position", { scope: "client", config: false, type: Object, default: {} });
}

export const getSetting = (key) => game.settings.get(MODULE_ID, key);
export const setSetting = (key, value) => game.settings.set(MODULE_ID, key, value);
