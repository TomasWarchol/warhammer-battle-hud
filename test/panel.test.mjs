import { describe, expect, it } from "vitest";
import { GROUP_IDS as G, buildConditions } from "../scripts/actions/builders.mjs";
import { GROUPS, LAYOUT } from "../scripts/actions/layout.mjs";
import { testGroups } from "../scripts/tests/actions.mjs";
import { testsFor } from "../scripts/tests/index.mjs";

describe("układ panelu", () => {
  it("każda grupa układu ma nazwę, a panel nie zależy od zewnętrznego HUD-a", () => {
    for (const tab of LAYOUT) for (const id of tab.groups) expect(GROUPS[id]).toBeTruthy();
    expect(GROUPS.token).toBeUndefined();
    expect(LAYOUT.flatMap((tab) => tab.groups)).toContain(G.conditions);
  });
});

describe("nazwy stanów", () => {
  const env = (known) => ({
    localize: (key) => known[key] ?? key,
    conditionValue: () => 0,
    config: { conditions: { prone: "C.Prone", defeated: "C.Defeated" }, statusEffects: [{ id: "defeated", name: "S.Defeated" }] }
  });

  it("nie pokazuje surowego klucza, gdy brakuje tłumaczenia", () => {
    const [prone, defeated] = buildConditions({}, env({ "C.Prone": "Powalony" }));
    expect(prone.name).toBe("Powalony");
    expect(defeated.name).toBe("Defeated");
  });

  it("korzysta z nazwy efektu statusu, jeśli jest przetłumaczona", () => {
    const [, defeated] = buildConditions({}, env({ "S.Defeated": "Pokonany" }));
    expect(defeated.name).toBe("Pokonany");
  });
});

describe("testy systemów", () => {
  it("wszystkie obsługiwane systemy mają testy", () => {
    for (const id of ["wfrp4e", "whtow", "impmal", "wrath-and-glory", "age-of-sigmar-soulbound"]) {
      const tests = testsFor(id);
      expect(typeof tests.run).toBe("function");
      expect(typeof tests.catalog).toBe("function");
    }
    expect(testsFor("dnd5e")).toBeNull();
  });

  it("panel testów grupuje katalog i pomija puste grupy", () => {
    const catalog = [
      { id: "skill:a", label: "A", group: "skill" },
      { id: "attribute:b", label: "B", group: "attribute" }
    ];
    const tests = { value: (_actor, entry) => (entry.id === "skill:a" ? 7 : undefined) };
    const groups = testGroups(tests, catalog, {}, (kind) => kind.toUpperCase());
    expect(groups.map((g) => g.label)).toEqual(["SKILL", "ATTRIBUTE"]);
    expect(groups[0].actions[0]).toMatchObject({ name: "A", value: "skill:a", detail: 7 });
    expect(groups[1].actions[0].detail).toBe("");
  });
});
