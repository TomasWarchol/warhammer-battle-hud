/**
 * Co ramki pokazują w każdym systemie. Nowy system to jeden wpis poniżej.
 * bars: paski ({ key, kind, value, max }), stats: małe liczby ({ key, icon, value, max }).
 * Brakujące dane pomijamy, bo wrogowie i stworzenia często mają tylko część pól.
 */

const present = (entries) => entries.filter((e) => e.value !== undefined && e.value !== null);
const pool = (data) => ({ value: data?.value, max: data?.max });

export const ADAPTERS = {
  wfrp4e: {
    partyTypes: ["character"],
    bars: (a) => present([{ key: "wounds", kind: "health", ...pool(a.system.status?.wounds) }]),
    stats: (a) => {
      const s = a.system.status ?? {};
      return present([
        { key: "advantage", icon: "fa-angles-up", value: s.advantage?.value },
        { key: "fortune", icon: "fa-clover", value: s.fortune?.value },
        { key: "resolve", icon: "fa-shield-heart", value: s.resolve?.value },
        { key: "corruption", icon: "fa-skull", ...pool(s.corruption) },
        { key: "encumbrance", icon: "fa-weight-hanging", value: s.encumbrance?.current === undefined ? undefined : Number(s.encumbrance.current), max: s.encumbrance?.max }
      ]);
    }
  },

  whtow: {
    partyTypes: ["character"],
    bars: (a) => present([{ key: "fate", kind: "resource", value: a.system.fate?.current, max: a.system.fate?.max }]),
    stats: (a) => present([
      { key: "wounds", icon: "fa-droplet", value: a.itemTypes.wound?.length },
      { key: "resilience", icon: "fa-shield", value: a.system.resilience?.value }
    ])
  },

  impmal: {
    partyTypes: ["character"],
    bars: (a) => present([{ key: "wounds", kind: "damage", ...pool(a.system.combat?.wounds) }]),
    stats: (a) => present([
      { key: "criticals", icon: "fa-droplet", ...pool(a.system.combat?.criticals) },
      { key: "fate", icon: "fa-clover", ...pool(a.system.fate) },
      { key: "corruption", icon: "fa-skull", ...pool(a.system.corruption) }
    ])
  },

  "wrath-and-glory": {
    partyTypes: ["agent"],
    bars: (a) => present([
      { key: "wounds", kind: "damage", ...pool(a.system.combat?.wounds) },
      { key: "shock", kind: "damage", ...pool(a.system.combat?.shock) }
    ]),
    stats: (a) => present([
      { key: "wrath", icon: "fa-fire", value: a.system.resources?.wrath },
      { key: "corruption", icon: "fa-skull", value: a.system.corruption?.current }
    ])
  },

  "age-of-sigmar-soulbound": {
    partyTypes: ["player"],
    bars: (a) => present([
      { key: "toughness", kind: "health", ...pool(a.system.combat?.health?.toughness) },
      { key: "wounds", kind: "damage", ...pool(a.system.combat?.health?.wounds) },
      { key: "mettle", kind: "resource", ...pool(a.system.combat?.mettle) }
    ]),
    stats: () => []
  }
};

export const adapterFor = (systemId) => ADAPTERS[systemId] ?? null;
