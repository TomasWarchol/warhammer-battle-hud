/**
 * Warhammer 40,000: Wrath & Glory (system "wrath-and-glory"): amunicja jako przedmioty, przeładowanie jako stan broni.
 */
export default {
  id: "wrath-and-glory",
  quantityPath: "system.quantity",

  count: (item) => item.system.quantity ?? 0,
  allWeapons: (actor) => actor.itemTypes.weapon ?? [],
  isRanged: (weapon) => ["ranged", "launcher"].includes(weapon.system.category),
  isEquipped: (weapon) => Boolean(weapon.system.equipped),
  toggleEquip: (_actor, weapon) => weapon.update({ "system.equipped": !weapon.system.equipped }),

  current: (weapon) => weapon.system.ammo?.document ?? null,
  choices: (weapon) => (weapon.ammoList ?? []).map((data) => weapon.actor.items.get(data._id)).filter(Boolean),
  setAmmo: (weapon, ammo) => weapon.update({ "system.ammo.id": ammo.id }),

  load: (weapon) => (weapon.system.needsReload ? { text: "", needsReload: true } : null),
  reload: (_actor, weapon) => weapon.system.reload()
};
