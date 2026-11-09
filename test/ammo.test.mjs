import { describe, expect, it, vi } from "vitest";
import { ammoState } from "../scripts/bar/ammo-data.mjs";
import { ADAPTERS, adapterFor } from "../scripts/bar/systems/index.mjs";

describe("dane amunicji", () => {
  it("stan zapasu", () => {
    expect([ammoState(0, 3), ammoState(3, 3), ammoState(4, 3)]).toEqual(["empty", "low", "ok"]);
  });
});

describe("adaptery", () => {
  it("rejestr i pełny interfejs", () => {
    expect(Object.keys(ADAPTERS).sort()).toEqual(["impmal", "wfrp4e", "wrath-and-glory"]);
    expect(adapterFor("whtow")).toBeNull();
    for (const a of Object.values(ADAPTERS)) {
      expect(a.quantityPath).toMatch(/^system\.quantity/);
      for (const fn of [a.count, a.allWeapons, a.isRanged, a.isEquipped, a.toggleEquip, a.current, a.choices, a.setAmmo, a.load, a.reload]) expect(fn).toBeTypeOf("function");
    }
  });

  const wfrp = ADAPTERS.wfrp4e;
  it("WFRP: broń z amunicją, stan ładowania, wybór", () => {
    expect(wfrp.isRanged({ system: { consumesAmmo: { value: true }, ammunitionGroup: { value: "bow" } } })).toBe(true);
    expect(wfrp.isRanged({ system: { consumesAmmo: { value: true }, ammunitionGroup: { value: "none" } } })).toBe(false);
    expect(wfrp.isRanged({ system: { consumesAmmo: { value: false }, ammunitionGroup: { value: "bow" } } })).toBe(false);
    expect(wfrp.load({ system: { loading: false } })).toBeNull();
    expect(wfrp.load({ system: { loading: true, loaded: { amt: 0, max: 1, value: false } } })).toEqual({ text: "0 / 1", needsReload: true });
    const arrows = { id: "x" };
    const weapon = { system: { ammoList: [{ _id: "x" }, { _id: "gone" }] }, actor: { items: { get: (id) => (id === "x" ? arrows : undefined) } } };
    expect(wfrp.choices(weapon)).toEqual([arrows]);
  });
  it("WFRP: przeładowanie zakłada test tylko raz", async () => {
    const actor = { checkReloadExtendedTest: vi.fn(), rollReloadTest: vi.fn() };
    await wfrp.reload(actor, { getFlag: () => null });
    expect(actor.checkReloadExtendedTest).toHaveBeenCalledOnce();
    await wfrp.reload(actor, { getFlag: () => "test" });
    expect(actor.checkReloadExtendedTest).toHaveBeenCalledOnce();
    expect(actor.rollReloadTest).toHaveBeenCalledTimes(2);
  });
  it("Imperium Maledictum: magazynek i przeładowanie", async () => {
    const im = ADAPTERS.impmal;
    expect(im.load({ system: { mag: { current: 0, value: 12 } } })).toEqual({ text: "0 / 12", needsReload: true });
    expect(im.isRanged({ system: { isRanged: true, selfAmmo: true } })).toBe(false);
    const reload = vi.fn(() => ({ "system.mag.current": 12 }));
    const weapon = { update: vi.fn(), system: { reload, ammo: { document: {} } } };
    await im.reload({}, weapon);
    expect(reload).toHaveBeenCalledWith(true);
    expect(weapon.update).toHaveBeenCalledWith({ "system.mag.current": 12 });
  });
  it("Wrath & Glory: przeładowanie tylko gdy potrzebne", () => {
    const wng = ADAPTERS["wrath-and-glory"];
    expect(wng.load({ system: { needsReload: false } })).toBeNull();
    expect(wng.load({ system: { needsReload: true } })).toEqual({ text: "", needsReload: true });
    expect(wng.isRanged({ system: { category: "melee" } })).toBe(false);
  });
});
