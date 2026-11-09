/**
 * Wykonanie akcji HUD w systemie WFRP4e.
 *
 * Testy idą przez API aktora (`setupSkill`, `setupWeapon`, ...). System sam wybiera klasy
 * testów i dialogów dla aktywnej edycji (EditionManager 4e/5e), więc HUD nie musi ich znać.
 */
import { ACTION_TYPES as T } from "./encoding.mjs";
import { t, log } from "./constants.mjs";

/** Kontekst testu dla systemu: pominięcie dialogu i wymuszony tryb rzutu. */
function testContext({ skipDialog, rollMode }) {
  const context = {};
  if (skipDialog) context.skipDialog = true;
  if (rollMode) context.fields = { rollMode };
  return context;
}

/** Uruchamia test zwrócony przez metodę `setup*` aktora (dialog → test → rzut). */
async function runTest(setupPromise) {
  const test = await setupPromise;
  if (test && typeof test.roll === "function") await test.roll();
  return test;
}

/** Test dla akcji typu rzutu. */
async function roll(actor, action, intent) {
  const context = testContext(intent);
  if (action.type === T.characteristic) return runTest(actor.setupCharacteristic(action.id, context));

  // W 5e splata się według Wiatru, nie czaru
  if (action.type === T.channelWind) return runTest(actor.setupChannelling(action.id, context));

  const item = actor.items.get(action.id);
  if (!item) return ui.notifications.warn(t("Notify.ItemMissing"));

  switch (action.type) {
    case T.skill: return runTest(actor.setupSkill(item, context));
    case T.weapon: return runTest(actor.setupWeapon(item, context));
    case T.spell: return runTest(actor.setupCast(item, context));
    case T.channel: return runTest(actor.setupChannell(item, context));
    case T.prayer: return runTest(actor.setupPrayer(item, context));
    case T.trait: return runTest(actor.setupTrait(item, context));
    // Test rozszerzony sam wykonuje rzut po dialogu
    case T.extended: return actor.setupExtendedTest(item, context);
  }
}

/** Uszkodzenie (+1) albo naprawa (−1) broni lub pancerza. */
async function damageGear(actor, action, amount) {
  const item = actor.items.get(action.id);
  if (!item?.system?.damageItem) return;
  if (item.type === "armour") {
    // Pancerz: tylko lokacje, które mają PZ; uszkadzamy/naprawiamy wszystkie naraz
    const locations = Object.entries(item.system.AP ?? {}).filter(([, ap]) => ap > 0).map(([loc]) => loc);
    return item.system.damageItem(amount, locations);
  }
  return item.system.damageItem(amount);
}

async function toggleCondition(actor, key, increase) {
  if (increase) return actor.addCondition(key);
  if (actor.hasCondition(key)) return actor.removeCondition(key);
}

async function runManualScript(actor, action) {
  const effect = await fromUuid(action.id);
  const script = effect?.manualScripts?.find((s) => String(s.index) === String(action.extra));
  if (!script) return ui.notifications.warn(t("Notify.EffectMissing"));
  return script.execute({ actor });
}

async function openSheet(actor, action) {
  if (action.type === T.effect) {
    const effect = await fromUuid(action.id);
    return (effect?.parent ?? effect)?.sheet?.render(true);
  }
  return actor.items.get(action.id)?.sheet?.render(true);
}

async function postToChat(actor, action) {
  const item = actor.items.get(action.id);
  if (!item) return;
  if (typeof item.postItem === "function") return item.postItem();
  return item.sheet?.render(true);
}

/**
 * Wykonuje akcję dla jednego aktora.
 * @param {Actor} actor
 * @param {{type: string, id: string, extra: string}} action  zdekodowana akcja
 * @param {import("./intent.mjs").Intent} intent
 */
export async function performAction(actor, action, intent) {
  try {
    switch (intent.intent) {
      case "roll": return await roll(actor, action, intent);
      case "sheet": return await openSheet(actor, action);
      case "post": return await postToChat(actor, action);
      case "damage": return await damageGear(actor, action, 1);
      case "repair": return await damageGear(actor, action, -1);
      case "run": return await runManualScript(actor, action);
      case "increase":
      case "decrease": {
        const up = intent.intent === "increase";
        if (action.type === T.advantage) return await actor.modifyAdvantage(up ? 1 : -1);
        return await toggleCondition(actor, action.id, up);
      }
    }
  } catch (err) {
    log.error(`Akcja ${action.type}/${action.id} nie powiodła się`, err);
    ui.notifications.error(t("Notify.ActionFailed"));
  }
}
