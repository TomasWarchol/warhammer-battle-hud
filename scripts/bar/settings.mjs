/**
 * Ustawienia paska. Co widać, wybiera każdy gracz u siebie; próg amunicji ustala MG dla całego świata.
 */
import { MODULE_ID, I18N } from "./constants.mjs";

export function registerSettings(hasAmmo, onChange) {
  const definitions = {
    showActions: { scope: "client", type: Boolean, default: true },
    actionsOnlyEquipped: { scope: "client", type: Boolean, default: true },
    blindOnShift: { scope: "client", type: Boolean, default: true },
    skipDialogByDefault: { scope: "client", type: Boolean, default: false },
    showUnrollableTraits: { scope: "client", type: Boolean, default: false },
    showTokenTests: { scope: "client", type: Boolean, default: true, requiresReload: true },
    ...(hasAmmo ? {
      showBar: { scope: "client", type: Boolean, default: true },
      onlyEquipped: { scope: "client", type: Boolean, default: true },
      showGear: { scope: "client", type: Boolean, default: true },
      lowAmmo: { scope: "world", type: Number, default: 3 }
    } : {})
  };
  for (const [key, data] of Object.entries(definitions)) {
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    game.settings.register(MODULE_ID, key, { name: `${I18N}.Settings.${name}Name`, hint: `${I18N}.Settings.${name}Hint`, config: true, onChange, ...data });
  }
}

export const getSetting = (key) => game.settings.get(MODULE_ID, key);
