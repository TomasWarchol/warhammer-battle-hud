/**
 * Panel akcji WFRP4e: zakładki z budowniczych akcji, kliknięcie wykonuje akcję przez API systemu.
 */
import * as B from "./builders.mjs";
import { decodeAction } from "./encoding.mjs";
import { getEdition } from "./edition.mjs";
import { resolveIntent } from "./intent.mjs";
import { GROUPS, LAYOUT } from "./layout.mjs";
import { performAction } from "./wfrp-actions.mjs";

const G = B.GROUP_IDS;
const FULL_ACTORS = ["character", "npc", "creature"];

/** Efekty aktora i jego przedmiotów (do ręcznych skryptów). */
const collectEffects = (actor) => [...(actor.effects ?? []), ...[...(actor.items ?? [])].flatMap((item) => [...(item.effects ?? [])])];

/** Akcje postaci według grup. Pojazdy mają tylko stany. */
export function actionsByGroup(actor, env) {
  if (!FULL_ACTORS.includes(actor.type)) return { [G.conditions]: B.buildConditions(actor, env) };
  const skills = B.buildSkills(actor);
  const weapons = B.buildWeapons(actor, env);
  const spells = B.buildSpells(actor, env);
  const prayers = B.buildPrayers(actor);
  return {
    [G.characteristics]: B.buildCharacteristics(actor, env),
    [G.skillsBasic]: skills.basic,
    [G.skillsAdvanced]: skills.advanced,
    [G.weaponsMelee]: weapons.melee,
    [G.weaponsRanged]: weapons.ranged,
    [G.armour]: B.buildArmour(actor, env),
    [G.traits]: B.buildTraits(actor, env),
    [G.petty]: spells.petty,
    [G.spells]: spells.spells,
    [G.channelling]: spells.channelling,
    [G.blessings]: prayers.blessings,
    [G.miracles]: prayers.miracles,
    [G.talents]: B.buildTalents(actor),
    [G.extended]: B.buildExtendedTests(actor),
    [G.effects]: B.buildManualEffects(collectEffects(actor)),
    [G.conditions]: B.buildConditions(actor, env),
    [G.advantage]: B.buildAdvantage(actor, env)
  };
}

/** Zakładki z co najmniej jedną akcją, z grupami do pokazania. */
export function buildPanel(actor, env) {
  const byGroup = actionsByGroup(actor, env);
  const view = (action) => ({
    name: action.name,
    img: action.img,
    value: action.encodedValue,
    detail: action.info1?.text ?? "",
    tooltip: action.tooltip,
    cssClass: action.cssClass ?? ""
  });
  return LAYOUT.map((tab) => ({
    id: tab.id,
    label: env.localize(tab.name),
    groups: tab.groups
      .filter((id) => byGroup[id]?.length)
      .map((id) => ({ label: env.localize(GROUPS[id]), actions: byGroup[id].map(view) }))
  })).filter((tab) => tab.groups.length);
}

export function wfrpActions(getSetting) {
  const settings = () => ({
    onlyEquipped: getSetting("actionsOnlyEquipped"),
    showUnrollableTraits: getSetting("showUnrollableTraits"),
    blindOnShift: getSetting("blindOnShift"),
    skipDialogByDefault: getSetting("skipDialogByDefault")
  });
  const env = () => ({
    config: game.wfrp4e?.config ?? {},
    localize: (key) => game.i18n.localize(key),
    edition: getEdition(),
    settings: settings(),
    conditionValue: (actor, key) => {
      const effect = actor.hasCondition?.(key);
      return effect ? (effect.conditionValue ?? 1) : 0;
    }
  });
  const panel = (actor) => buildPanel(actor, env());
  return {
    tabs: (actor) => panel(actor).map(({ id, label }) => ({ id, label })),
    groups: (actor, tabId) => panel(actor).find((tab) => tab.id === tabId)?.groups ?? [],
    async perform(actor, value, mods) {
      const action = decodeAction(value);
      if (!action) return;
      const intent = resolveIntent(action.type, mods, settings());
      if (intent.intent !== "none") await performAction(actor, action, intent);
    }
  };
}
