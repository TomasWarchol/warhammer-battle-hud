/**
 * WFRP 4e/5e (system "wfrp4e"): grupy amunicji, broń z cechą Przeładowanie.
 */
const usesAmmo = (weapon) => Boolean(weapon.system.consumesAmmo?.value) && !["", "none", undefined].includes(weapon.system.ammunitionGroup?.value);

export default {
  id: "wfrp4e",
  quantityPath: "system.quantity.value",

  count: (item) => item.system.quantity?.value ?? 0,
  allWeapons: (actor) => actor.itemTypes.weapon ?? [],
  isRanged: usesAmmo,
  isEquipped: (weapon) => Boolean(weapon.system.isEquipped),
  toggleEquip: (_actor, weapon) => weapon.system.toggleEquip(),

  current: (weapon) => weapon.actor.items.get(weapon.system.currentAmmo?.value) ?? null,
  choices: (weapon) => (weapon.system.ammoList ?? []).map((data) => weapon.actor.items.get(data._id)).filter(Boolean),
  setAmmo: (weapon, ammo) => weapon.update({ "system.currentAmmo.value": ammo.id }),

  load(weapon) {
    if (!weapon.system.loading) return null;
    const { amt, max, value } = weapon.system.loaded;
    return { text: `${amt} / ${max}`, needsReload: !value };
  },

  /** System najpierw zakłada test rozszerzony przeładowania, potem go rzuca. */
  async reload(actor, weapon) {
    if (!weapon.getFlag("wfrp4e", "reloading")) await actor.checkReloadExtendedTest(weapon, actor);
    return actor.rollReloadTest(weapon);
  },
};
