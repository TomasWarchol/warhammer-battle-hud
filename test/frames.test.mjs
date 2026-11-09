import { describe, expect, it } from "vitest";
import { clampPosition, MODES, nextMode, percent, pickActors, tone } from "../scripts/frames/frames-data.mjs";
import { ADAPTERS, adapterFor } from "../scripts/frames/systems.mjs";

describe("wybór postaci", () => {
  const actor = (uuid, type = "character", hasPlayerOwner = true) => ({ uuid, type, hasPlayerOwner });
  const anna = actor("a");
  const bruno = actor("b");
  const rat = actor("r", "npc", false);
  const base = { partyTypes: ["character"], isGM: true };
  it("drużyna: postacie przypisane graczom, bez powtórzeń i bez MG", () => {
    const users = [{ isGM: true, character: rat }, { isGM: false, character: anna }, { isGM: false, character: anna }, { isGM: false, character: null }];
    expect(pickActors({ ...base, mode: "party", users, actors: [anna, bruno] })).toEqual([anna]);
  });
  it("drużyna bez przypisań: postacie należące do graczy", () => {
    expect(pickActors({ ...base, mode: "party", users: [], actors: [anna, bruno, rat] })).toEqual([anna, bruno]);
  });
  it("walka: MG widzi wszystkich, gracz tylko postacie graczy", () => {
    expect(pickActors({ ...base, mode: "combat", combatants: [anna, rat, null] })).toEqual([anna, rat]);
    expect(pickActors({ ...base, isGM: false, mode: "combat", combatants: [anna, rat, null] })).toEqual([anna]);
  });
  it("zaznaczone tokeny", () => {
    expect(pickActors({ ...base, mode: "selected", controlled: [rat, rat, null] })).toEqual([rat]);
  });
  it("kolejny tryb wraca do pierwszego", () => {
    expect(MODES.map(nextMode)).toEqual(["combat", "selected", "party"]);
  });
});

describe("paski i położenie", () => {
  it("procent w granicach", () => {
    expect([percent(5, 10), percent(15, 10), percent(-1, 10), percent(3, 0), percent(3, undefined)]).toEqual([50, 100, 0, 0, 0]);
  });
  it("kolor: zdrowie maleje, obrażenia rosną", () => {
    expect([tone("health", 100), tone("health", 40), tone("health", 20)]).toEqual(["healthy", "hurt", "critical"]);
    expect([tone("damage", 0), tone("damage", 60), tone("damage", 80)]).toEqual(["healthy", "hurt", "critical"]);
    expect(tone("resource", 0)).toBe("resource");
  });
  it("pozycja nie ucieka poza ekran", () => {
    expect(clampPosition({ left: 5000, top: -20 }, 200, 300, 1000, 800)).toEqual({ left: 800, top: 0 });
  });
});

describe("adaptery", () => {
  it("wszystkie systemy", () => {
    expect(Object.keys(ADAPTERS).sort()).toEqual(["age-of-sigmar-soulbound", "impmal", "wfrp4e", "whtow", "wrath-and-glory"]);
    expect(adapterFor("dnd5e")).toBeNull();
  });
  it("puste dane nie psują ramki (np. stworzenia)", () => {
    for (const a of Object.values(ADAPTERS)) {
      const actor = { system: {}, itemTypes: {} };
      expect(a.bars(actor)).toEqual([]);
      expect(a.stats(actor)).toEqual([]);
    }
  });
  it("WFRP: Rany i zasoby", () => {
    const actor = { system: { status: { wounds: { value: 7, max: 12 }, fortune: { value: 2 }, resolve: { value: 1 }, advantage: { value: 3 }, corruption: { value: 1, max: 6 }, encumbrance: { current: "2.50", max: 8 } } } };
    expect(ADAPTERS.wfrp4e.bars(actor)).toEqual([{ key: "wounds", kind: "health", value: 7, max: 12 }]);
    const stats = ADAPTERS.wfrp4e.stats(actor);
    expect(stats.map((s) => s.key)).toEqual(["advantage", "fortune", "resolve", "corruption", "encumbrance"]);
    expect(stats.at(-1)).toMatchObject({ value: 2.5, max: 8 });
  });
  it("The Old World: Rany jako liczba przedmiotów", () => {
    const actor = { itemTypes: { wound: [{}, {}] }, system: { fate: { current: 1, max: 3 }, resilience: { value: 4 } } };
    expect(ADAPTERS.whtow.stats(actor)[0]).toMatchObject({ key: "wounds", value: 2 });
    expect(ADAPTERS.whtow.bars(actor)[0]).toMatchObject({ key: "fate", value: 1, max: 3 });
  });
  it("Soulbound: Wytrzymałość maleje, Rany rosną", () => {
    const actor = { system: { combat: { health: { toughness: { value: 5, max: 9 }, wounds: { value: 1, max: 4 } }, mettle: { value: 2, max: 3 } } } };
    expect(ADAPTERS["age-of-sigmar-soulbound"].bars(actor).map((b) => b.kind)).toEqual(["health", "damage", "resource"]);
  });
});
