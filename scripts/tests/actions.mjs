/**
 * Panel akcji dla systemów bez własnych budowniczych: testy z katalogu systemu.
 */
import { t, log } from "../bar/constants.mjs";
import { rollTest } from "./index.mjs";

const KINDS = ["skill", "characteristic", "attribute"];

/** Grupy testów z wartościami postaci. */
export function testGroups(tests, catalog, actor, label) {
  return KINDS
    .map((kind) => ({
      label: label(kind),
      actions: catalog.filter((entry) => entry.group === kind).map((entry) => ({
        name: entry.label,
        value: entry.id,
        detail: tests.value?.(actor, entry) ?? "",
        cssClass: ""
      }))
    }))
    .filter((group) => group.actions.length);
}

export function testActions(tests, catalog) {
  return {
    tabs: () => [{ id: "tests", label: t("Tab.Tests") }],
    groups: (actor) => testGroups(tests, catalog, actor, (kind) => t(`Tests.${kind}`)),
    async perform(actor, value, mods) {
      if (mods.right) return;
      const entry = catalog.find((e) => e.id === value);
      if (!entry) return;
      try {
        const result = await rollTest(tests, actor, entry);
        if (result?.skipped) ui.notifications.warn(t(`Skip.${result.skipped}`));
      } catch (err) {
        log.error(`Test – ${actor.name}`, err);
        ui.notifications.error(t("Failed"));
      }
    }
  };
}
