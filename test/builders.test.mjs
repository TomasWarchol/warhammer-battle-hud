import { describe, expect, it } from "vitest";
import * as B from "../scripts/actions/builders.mjs";
import { GROUPS, LAYOUT } from "../scripts/actions/layout.mjs";

let nextId = 0;
const item = (type, name, system = {}, extra = {}) => ({ id: `${type}${++nextId}`, type, name, img: `${type}.webp`, system, ...extra });

const actor = {
  type: "character",
  system: {
    characteristics: { ws: { value: 45 }, bs: { value: 30 } },
    status: { advantage: { value: 2, max: 10 } }
  },
  itemTypes: {
    skill: [
      item("skill", "Unik", { advanced: { value: "bsc" }, total: { value: 40 } }),
      item("skill", "Splatanie Magii (Aqshy)", { advanced: { value: "adv" }, total: { value: 52 } }),
      item("skill", "Atletyka", { advanced: { value: "bsc" }, total: { value: 35 } })
    ],
    weapon: [
      item("weapon", "Miecz", { isEquipped: true, isRanged: false, damageToItem: { value: 1 } }),
      item("weapon", "Łuk", { isEquipped: true, isRanged: true, damageToItem: { value: 0 }, ammo: { name: "Strzały", system: { quantity: { value: 12 } } } }),
      item("weapon", "Sztylet w plecaku", { isEquipped: false, isRanged: false, damageToItem: { value: 0 } })
    ],
    armour: [item("armour", "Kaftan", { isEquipped: true, APdamage: { body: 1, head: 0 } })],
    trait: [
      item("trait", "Ugryzienie", { rollable: { value: true } }),
      item("trait", "Rozmiar", { rollable: { value: false } })
    ],
    spell: [
      item("spell", "Rzutka", { lore: { value: ["petty"] }, cn: { value: 0 }, description: { value: "<p>Mała&nbsp;iskra</p>" } }),
      item("spell", "Kula ognia", { lore: { value: ["fire"] }, cn: { value: 7 } })
    ],
    prayer: [
      item("prayer", "Zimowy chłód", { type: { value: "miracle" } }),
      item("prayer", "Błogosławieństwo siły", { type: { value: "blessing" } })
    ],
    talent: [item("talent", "Bardzo silny"), item("talent", "Bardzo silny"), item("talent", "Czujny")],
    extendedTest: [item("extendedTest", "Strach", { SL: { current: 1, target: 3 } })]
  }
};

const env = {
  config: {
    characteristics: { ws: "CHAR.WS", bs: "CHAR.BS", s: "CHAR.S" },
    conditions: { bleeding: "COND.Bleeding", prone: "COND.Prone" },
    statusEffects: [{ id: "bleeding", img: "bleed.svg", system: { condition: { numbered: true } } }, { id: "prone", system: { condition: {} } }]
  },
  localize: (key) => `L(${key})`,
  edition: "4e",
  settings: { onlyEquipped: true, showUnrollableTraits: false },
  conditionValue: (_actor, key) => (key === "bleeding" ? 2 : 0)
};

describe("builders", () => {
  it("cechy z konfiguracji, tylko istniejące u aktora", () => {
    expect(B.buildCharacteristics(actor, env)).toEqual([
      { id: "characteristic-ws", name: "L(CHAR.WS)", encodedValue: "characteristic|ws", info1: { text: "45" } },
      { id: "characteristic-bs", name: "L(CHAR.BS)", encodedValue: "characteristic|bs", info1: { text: "30" } }
    ]);
  });

  it("umiejętności podstawowe i zaawansowane, alfabetycznie", () => {
    const { basic, advanced } = B.buildSkills(actor);
    expect(basic.map((a) => a.name)).toEqual(["Atletyka", "Unik"]);
    expect(advanced.map((a) => [a.name, a.info1.text])).toEqual([["Splatanie Magii (Aqshy)", "52"]]);
    expect(basic[0].encodedValue).toMatch(/^skill\|skill\d+$/);
  });

  it("broń: założona, z amunicją i oznaczeniem uszkodzenia", () => {
    const { melee, ranged } = B.buildWeapons(actor, env);
    expect(melee.map((a) => a.name)).toEqual(["Miecz"]);
    expect(melee[0].cssClass).toBe("wfrp4e-action-hud-damaged");
    expect(ranged[0]).toMatchObject({ name: "Łuk", info1: { text: "12", title: "Strzały" } });
  });

  it("BN pokazuje też niezałożoną broń", () => {
    const { melee } = B.buildWeapons({ ...actor, type: "npc" }, env);
    expect(melee.map((a) => a.name)).toEqual(["Miecz", "Sztylet w plecaku"]);
  });

  it("pancerz z sumą uszkodzeń", () => {
    expect(B.buildArmour(actor, env)[0]).toMatchObject({ name: "Kaftan", info1: { text: "-1" } });
  });

  it("cechy stworzeń: tylko z testem, chyba że ustawienie", () => {
    expect(B.buildTraits(actor, env).map((a) => a.encodedValue.split("|")[0])).toEqual(["trait"]);
    const all = B.buildTraits(actor, { ...env, settings: { showUnrollableTraits: true } });
    expect(all.map((a) => [a.name, a.encodedValue.split("|")[0]])).toEqual([["Rozmiar", "talent"], ["Ugryzienie", "trait"]]);
  });

  it("czary: magia prosta osobno, splatanie tylko w 4e", () => {
    const s = B.buildSpells(actor, env);
    expect(s.petty.map((a) => a.name)).toEqual(["Rzutka"]);
    expect(s.petty[0].tooltip).toBe("Mała iskra");
    expect(s.spells[0]).toMatchObject({ name: "Kula ognia", info1: { text: "7" } });
    expect(s.channelling.map((a) => a.encodedValue.split("|")[0])).toEqual(["channel"]);
    expect(B.buildSpells(actor, { ...env, edition: "5e" }).channelling).toEqual([]);
  });

  it("modlitwy: błogosławieństwa i cuda", () => {
    const p = B.buildPrayers(actor);
    expect(p.blessings.map((a) => a.name)).toEqual(["Błogosławieństwo siły"]);
    expect(p.miracles.map((a) => a.name)).toEqual(["Zimowy chłód"]);
  });

  it("talenty zgrupowane po nazwie z licznikiem", () => {
    expect(B.buildTalents(actor).map((a) => [a.name, a.info1?.text])).toEqual([["Bardzo silny", "×2"], ["Czujny", undefined]]);
  });

  it("testy rozszerzone z postępem", () => {
    expect(B.buildExtendedTests(actor)[0].info1).toEqual({ text: "1/3" });
  });

  it("ręczne skrypty efektów bez duplikatów", () => {
    const effect = { uuid: "Actor.a.ActiveEffect.e", name: "Krwawienie", img: "e.webp", manualScripts: [{ Label: "Krwawienie", index: 0 }, { Label: "Leczenie", index: 1 }] };
    const actions = B.buildManualEffects([effect, effect, { uuid: "x", name: "Bez skryptów", manualScripts: [] }]);
    expect(actions.map((a) => [a.name, a.encodedValue])).toEqual([
      ["Krwawienie", "effect|Actor.a.ActiveEffect.e|0"],
      ["Krwawienie: Leczenie", "effect|Actor.a.ActiveEffect.e|1"]
    ]);
  });

  it("stany: aktywne podświetlone, numerowane z wartością", () => {
    const [bleeding, prone] = B.buildConditions(actor, env);
    expect(bleeding).toMatchObject({ name: "L(COND.Bleeding)", cssClass: "toggle active", info1: { text: "2" }, img: "bleed.svg" });
    expect(prone).toMatchObject({ cssClass: "toggle", info1: undefined });
  });

  it("Przewaga z maksimum", () => {
    expect(B.buildAdvantage(actor, env)).toEqual([{ id: "advantage", name: "L(WFRP4E_HUD.Advantage)", encodedValue: "advantage", info1: { text: "2/10" } }]);
    expect(B.buildAdvantage({ system: {} }, env)).toEqual([]);
  });

  it("brak przedmiotów nie psuje budowania", () => {
    const empty = { type: "character", system: {}, itemTypes: {} };
    expect(B.buildSkills(empty)).toEqual({ basic: [], advanced: [] });
    expect(B.buildWeapons(empty, env)).toEqual({ melee: [], ranged: [] });
    expect(B.buildCharacteristics(empty, env)).toEqual([]);
  });
});

describe("defaults", () => {
  it("każda grupa z układu jest zdefiniowana", () => {
    for (const tab of LAYOUT) for (const id of tab.groups) expect(GROUPS[id], id).toBeDefined();
  });

  it("każda grupa budowniczego ma miejsce w układzie", () => {
    const placed = new Set(LAYOUT.flatMap((t) => t.groups));
    for (const id of Object.values(B.GROUP_IDS)) expect(placed.has(id), id).toBe(true);
  });
});

describe("poprawki broni i splatania", () => {
  const weapon = (name, isEquipped) => ({ id: name, name, system: { isEquipped } });
  const fighter = (list) => ({ type: "character", itemTypes: { weapon: list }, items: list });
  const envOnly = { localize: (k) => `L(${k})`, edition: "4e", settings: { onlyEquipped: true } };

  it("bez założonej broni pokazuje wszystkie", () => {
    expect(B.buildWeapons(fighter([weapon("B", false), weapon("A", false)]), envOnly).melee.map((a) => a.name)).toEqual(["A", "B"]);
  });
  it("z założoną bronią pokazuje tylko ją", () => {
    expect(B.buildWeapons(fighter([weapon("B", true), weapon("A", false)]), envOnly).melee.map((a) => a.name)).toEqual(["B"]);
  });

  const mage = { type: "character", itemTypes: { spell: [{ id: "s1", name: "Kula", system: { lore: { value: "fire" }, cn: { value: 5 } } }] }, system: { status: { channelling: { wind: "aqshy", value: 3, winds: { aqshy: { label: "Aqshy", img: "a.webp" }, ghur: { label: "Ghur", img: "g.webp" } } } } } };
  it("5e: splatanie według Wiatru, z bieżącą wartością", () => {
    const { channelling } = B.buildSpells(mage, { ...envOnly, edition: "5e" });
    expect(channelling.map((a) => a.encodedValue)).toEqual(["channelWind|aqshy", "channelWind|ghur"]);
    expect(channelling[0]).toMatchObject({ name: "L(Aqshy)", img: "a.webp", info1: { text: "3" } });
    expect(channelling[1].info1).toBeUndefined();
  });
  it("4e: splatanie według czaru, bez Wiatrów", () => {
    expect(B.buildSpells(mage, envOnly).channelling.map((a) => a.encodedValue)).toEqual(["channel|s1"]);
  });
});
