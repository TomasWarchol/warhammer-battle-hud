/**
 * Szybkie testy z wartościami na Token HUD, dla właściciela tokena.
 */
import { t, log } from "../bar/constants.mjs";
import { rollTest } from "./index.mjs";

const abbreviate = (label) => label.replace(/\s*\(.*$/, "").slice(0, 3).toLocaleUpperCase();

async function roll(tests, actor, entry) {
  try {
    const result = await rollTest(tests, actor, entry);
    if (result?.skipped) ui.notifications.warn(t(`Skip.${result.skipped}`));
  } catch (err) {
    log.error(`Token HUD – ${actor.name}`, err);
    ui.notifications.error(t("Failed"));
  }
}

function button(tests, actor, entry) {
  const value = tests.value?.(actor, entry);
  const element = document.createElement("button");
  element.type = "button";
  element.className = "control-icon whb-hud-test";
  element.dataset.tooltip = value === undefined ? entry.label : `${entry.label}: ${value}`;
  element.setAttribute("aria-label", entry.label);
  const name = document.createElement("span");
  name.textContent = abbreviate(entry.label);
  element.append(name);
  if (value !== undefined) {
    const number = document.createElement("strong");
    number.textContent = value;
    element.append(number);
  }
  element.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    roll(tests, actor, entry);
  });
  return element;
}

/** @param {object} tests @param {Array} catalog  katalog testów budowany raz po starcie */
export function registerTokenTests(tests, catalog) {
  const quick = tests.quick(game, catalog);
  if (!quick.length) return;
  Hooks.on("renderTokenHUD", (hud, html) => {
    const actor = hud.actor ?? hud.document?.actor;
    if (!actor?.isOwner) return;
    const root = html instanceof HTMLElement ? html : hud.element;
    root.querySelector(".whb-hud")?.remove();
    const column = document.createElement("div");
    column.className = "col whb-hud";
    for (const entry of quick) column.append(button(tests, actor, entry));
    root.append(column);
  });
}
