/**
 * Warhammer 40,000: Imperium Maledictum (system "impmal"): magazynki; broń zakłada się do rąk.
 */
export default {
  id: "impmal",
  quantityPath: "system.quantity",

  count: (item) => item.system.quantity ?? 0,
  allWeapons: (actor) => actor.itemTypes.weapon ?? [],
  isRanged: (weapon) => Boolean(weapon.system.isRanged) && !weapon.system.selfAmmo,
  isEquipped: (weapon) => Boolean(weapon.system.isEquipped),
  toggleEquip: (actor, weapon) => actor.update(actor.system.hands.toggle(undefined, weapon)),

  current: (weapon) => weapon.system.ammo?.document ?? null,
  choices: (weapon) => weapon.system.ammoList ?? [],
  setAmmo: (weapon, ammo) => weapon.update({ "system.ammo.id": ammo.id }),

  load(weapon) {
    const { current, value } = weapon.system.mag ?? {};
    return value ? { text: `${current} / ${value}`, needsReload: current <= 0 } : null;
  },

  reload: (_actor, weapon) => weapon.update(weapon.system.reload(Boolean(weapon.system.ammo?.document)))
};
