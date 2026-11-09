/**
 * Budowanie list akcji HUD z danych aktora – bez zależności od Foundry.
 *
 * Każda funkcja dostaje aktora (dokument WFRP albo atrapę w testach) i środowisko `env`:
 *   { config, localize(key), edition: "4e"|"5e", settings: { onlyEquipped, showUnrollableTraits },
 *     conditionValue(actor, key) }
 * i zwraca listę danych akcji w formacie TAH Core: { id, name, encodedValue, img?, info1?, cssClass?, tooltip? }.
 */
import { ACTION_TYPES as T, encodeAction } from "./encoding.mjs";

/** Grupy HUD (id grup TAH) – układ w scripts/defaults.mjs. */
export const GROUP_IDS = Object.freeze({
  characteristics: "characteristics",
  skillsBasic: "skills-basic",
  skillsAdvanced: "skills-advanced",
  weaponsMelee: "weapons-melee",
  weaponsRanged: "weapons-ranged",
  armour: "armour",
  traits: "traits",
  petty: "spells-petty",
  spells: "spells",
  channelling: "channelling",
  blessings: "blessings",
  miracles: "miracles",
  talents: "talents",
  extended: "extended-tests",
  effects: "effects",
  conditions: "conditions",
  advantage: "advantage"
});

const MAX_TOOLTIP = 500;

const items = (actor, type) => actor?.itemTypes?.[type] ?? [];
const byName = (a, b) => String(a.name).localeCompare(String(b.name));

/** Skrócony opis przedmiotu do podpowiedzi (bez HTML). */
export function plainDescription(item) {
  const html = item?.system?.description?.value ?? "";
  const text = String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text.length > MAX_TOOLTIP ? `${text.slice(0, MAX_TOOLTIP - 1)}…` : text;
}

/** Wspólne pola akcji opartej na przedmiocie. */
function itemAction(item, type, extra = {}) {
  return {
    id: `${type}-${item.id}`,
    name: item.name,
    img: item.img,
    encodedValue: encodeAction(type, item.id),
    ...extra
  };
}

/** Postacie graczy pokazują tylko założony sprzęt (gdy włączone); NPC i stwory – wszystko. */
function showGear(actor, item, env) {
  if (!env.settings?.onlyEquipped || actor.type !== "character") return true;
  return item.system?.isEquipped !== false;
}

export function buildCharacteristics(actor, env) {
  const characteristics = actor?.system?.characteristics ?? {};
  return Object.entries(env.config?.characteristics ?? {})
    .filter(([key]) => characteristics[key])
    .map(([key, label]) => ({
      id: `${T.characteristic}-${key}`,
      name: env.localize(label),
      encodedValue: encodeAction(T.characteristic, key),
      info1: { text: String(characteristics[key].value ?? "") }
    }));
}

/** Umiejętności podstawowe i zaawansowane osobno (system: advanced.value = "bsc" | "adv"). */
export function buildSkills(actor) {
  const basic = [];
  const advanced = [];
  for (const skill of [...items(actor, "skill")].sort(byName)) {
    const action = itemAction(skill, T.skill, { info1: { text: String(skill.system?.total?.value ?? "") } });
    (skill.system?.advanced?.value === "adv" ? advanced : basic).push(action);
  }
  return { basic, advanced };
}

export function buildWeapons(actor, env) {
  const melee = [];
  const ranged = [];
  const weapons = [...items(actor, "weapon")].sort(byName);
  // Bez założonej broni filtr zostawiłby pustą listę, więc pokazujemy wszystkie
  const anyEquipped = weapons.some((weapon) => weapon.system?.isEquipped);
  for (const weapon of weapons) {
    if (anyEquipped && !showGear(actor, weapon, env)) continue;
    const system = weapon.system ?? {};
    const damaged = system.damageToItem?.value > 0;
    const action = itemAction(weapon, T.weapon, {
      cssClass: damaged ? "wfrp4e-action-hud-damaged" : undefined,
      info2: damaged ? { text: `-${system.damageToItem.value}`, title: env.localize("WFRP4E_HUD.Info.Damage") } : undefined
    });
    if (system.isRanged) {
      const ammo = system.ammo;
      if (ammo) action.info1 = { text: String(ammo.system?.quantity?.value ?? ""), title: ammo.name };
      ranged.push(action);
    } else {
      melee.push(action);
    }
  }
  return { melee, ranged };
}

export function buildArmour(actor, env) {
  return [...items(actor, "armour")]
    .filter((armour) => showGear(actor, armour, env))
    .sort(byName)
    .map((armour) => {
      const damage = Object.values(armour.system?.APdamage ?? {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
      return itemAction(armour, T.armour, {
        cssClass: damage > 0 ? "wfrp4e-action-hud-damaged" : undefined,
        info1: damage > 0 ? { text: `-${damage}`, title: env.localize("WFRP4E_HUD.Info.Damage") } : undefined
      });
    });
}

/** Cechy z testem (rollable). Pozostałe tylko gdy włączone w ustawieniach. */
export function buildTraits(actor, env) {
  return [...items(actor, "trait")]
    .filter((trait) => trait.system?.rollable?.value || env.settings?.showUnrollableTraits)
    .sort(byName)
    .map((trait) => itemAction(trait, trait.system?.rollable?.value ? T.trait : T.talent, {
      tooltip: plainDescription(trait) || undefined
    }));
}

/** Czary: Magia Prosta osobno; reszta z nazwą tradycji. Splatanie osobno: w 4e według czaru, w 5e według Wiatru. */
export function buildSpells(actor, env) {
  const petty = [];
  const spells = [];
  const channelling = [];
  for (const spell of [...items(actor, "spell")].sort(byName)) {
    const lores = [spell.system?.lore?.value].flat().filter(Boolean);
    const cn = spell.system?.cn?.value;
    const tooltip = plainDescription(spell) || undefined;
    const isPetty = lores.includes("petty");
    const info1 = cn ? { text: String(cn), title: env.localize("WFRP4E_HUD.Info.CN") } : undefined;
    (isPetty ? petty : spells).push(itemAction(spell, T.spell, { info1, tooltip }));
    if (!isPetty && cn && env.edition !== "5e") {
      channelling.push({
        ...itemAction(spell, T.channel, { info1, tooltip }),
        id: `${T.channel}-${spell.id}`
      });
    }
  }
  if (env.edition === "5e") {
    const status = actor.system?.status?.channelling;
    for (const [wind, data] of Object.entries(status?.winds ?? {})) {
      channelling.push({
        id: `${T.channelWind}-${wind}`,
        name: env.localize(data.label),
        img: data.img,
        encodedValue: encodeAction(T.channelWind, wind),
        info1: status.wind === wind && status.value > 0 ? { text: String(status.value) } : undefined
      });
    }
  }
  return { petty, spells, channelling };
}

export function buildPrayers(actor) {
  const blessings = [];
  const miracles = [];
  for (const prayer of [...items(actor, "prayer")].sort(byName)) {
    const action = itemAction(prayer, T.prayer, { tooltip: plainDescription(prayer) || undefined });
    (prayer.system?.type?.value === "miracle" ? miracles : blessings).push(action);
  }
  return { blessings, miracles };
}

/** Talenty: jeden wpis na nazwę, z liczbą wykupień. */
export function buildTalents(actor) {
  const byTalentName = new Map();
  for (const talent of items(actor, "talent")) {
    const entry = byTalentName.get(talent.name);
    if (entry) entry.count += 1;
    else byTalentName.set(talent.name, { talent, count: 1 });
  }
  return [...byTalentName.values()]
    .sort((a, b) => byName(a.talent, b.talent))
    .map(({ talent, count }) => itemAction(talent, T.talent, {
      info1: count > 1 ? { text: `×${count}` } : undefined,
      tooltip: plainDescription(talent) || undefined
    }));
}

export function buildExtendedTests(actor) {
  return [...items(actor, "extendedTest")].sort(byName).map((test) => {
    const sl = test.system?.SL ?? {};
    return itemAction(test, T.extended, { info1: { text: `${sl.current ?? 0}/${sl.target ?? 0}` } });
  });
}

/**
 * Ręczne skrypty efektów (trigger "manual") z efektów aktora i jego przedmiotów.
 * @param {Array<{uuid: string, name: string, img?: string, manualScripts?: Array}>} effects
 */
export function buildManualEffects(effects) {
  const seen = new Set();
  const actions = [];
  for (const effect of effects ?? []) {
    if (!effect?.uuid || seen.has(effect.uuid)) continue;
    seen.add(effect.uuid);
    for (const script of effect.manualScripts ?? []) {
      const label = script.Label ?? script.label ?? effect.name;
      actions.push({
        id: `${T.effect}-${effect.uuid}-${script.index}`,
        name: label === effect.name ? effect.name : `${effect.name}: ${label}`,
        img: effect.img,
        encodedValue: encodeAction(T.effect, effect.uuid, script.index)
      });
    }
  }
  return actions.sort(byName);
}

/** Nazwa stanu; system nie ma tłumaczenia dla każdego z nich, a surowego klucza nie pokazujemy. */
function conditionName(key, label, status, env) {
  for (const source of [label, status?.name]) {
    const text = source ? env.localize(source) : source;
    if (text && text !== source) return text;
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Stany z konfiguracji systemu; aktywne podświetlone, numerowane z wartością. */
export function buildConditions(actor, env) {
  const numbered = new Set(
    (env.config?.statusEffects ?? []).filter((s) => s.system?.condition?.numbered).map((s) => s.id)
  );
  return Object.entries(env.config?.conditions ?? {}).map(([key, label]) => {
    const value = env.conditionValue(actor, key);
    const status = (env.config?.statusEffects ?? []).find((s) => s.id === key);
    return {
      id: `${T.condition}-${key}`,
      name: conditionName(key, label, status, env),
      img: status?.img,
      encodedValue: encodeAction(T.condition, key),
      cssClass: value ? "toggle active" : "toggle",
      info1: value && numbered.has(key) ? { text: String(value) } : undefined
    };
  });
}

export function buildAdvantage(actor, env) {
  const advantage = actor?.system?.status?.advantage;
  if (!advantage) return [];
  return [{
    id: `${T.advantage}`,
    name: env.localize("WFRP4E_HUD.Advantage"),
    encodedValue: encodeAction(T.advantage),
    info1: { text: `${advantage.value ?? 0}${advantage.max ? `/${advantage.max}` : ""}` }
  }];
}
