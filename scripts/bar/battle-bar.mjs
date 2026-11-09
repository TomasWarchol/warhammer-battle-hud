/**
 * Pasek walki: panel akcji postaci oraz amunicja, przeładowanie i szybka zmiana broni.
 * Pokazuje zaznaczoną postać, a bez zaznaczenia postać przypisaną do gracza.
 */
import { MODULE_ID, t, log } from "./constants.mjs";
import { getSetting } from "./settings.mjs";
import { ammoState } from "./ammo-data.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class BattleBar extends HandlebarsApplicationMixin(ApplicationV2) {
  /** Adapter amunicji; `null` w systemach, które jej nie śledzą. */
  static adapter = null;
  /** Panel akcji aktywnego systemu (ustawiany w "ready"). */
  static actions = null;
  static #instance = null;

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-bar`,
    classes: [MODULE_ID],
    window: { frame: false, positioned: false },
    actions: {
      toggleList: BattleBar.#onToggleList,
      chooseAmmo: BattleBar.#onChooseAmmo,
      reload: BattleBar.#onReload,
      toggleEquip: BattleBar.#onToggleEquip,
      openTab: BattleBar.#onOpenTab,
      runAction: BattleBar.#onRunAction
    }
  };

  static PARTS = { bar: { template: `modules/${MODULE_ID}/templates/battle-bar.hbs` } };

  /** Postać, którą pasek pokazuje: zaznaczony token, a bez niego postać przypisana do gracza. */
  static get actor() {
    const selected = canvas.tokens?.controlled.find((token) => token.actor?.isOwner);
    return selected?.actor ?? game.user.character ?? null;
  }

  /** Pokazuje, odświeża albo chowa pasek zależnie od bieżącej postaci. */
  static refresh() {
    this.#instance ??= new this();
    const actor = this.actor;
    const ammo = this.adapter && getSetting("showBar") && actor && this.adapter.allWeapons(actor).length > 0;
    const visible = ammo || (actor && this.actions && getSetting("showActions"));
    if (visible) this.#instance.render({ force: true });
    else if (this.#instance.rendered) this.#instance.close();
  }

  /** Lista broni, dla której otwarto wybór amunicji. */
  openList = null;
  /** Zakładka panelu akcji, która jest rozwinięta. */
  openTab = null;

  get adapter() {
    return this.constructor.adapter;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const { adapter } = this;
    const actor = this.constructor.actor;
    if (!actor) return context;
    Object.assign(context, this.#actionContext(actor));
    if (!adapter || !getSetting("showBar")) return Object.assign(context, { weapons: [], gear: [] });
    const low = getSetting("lowAmmo");
    const onlyEquipped = getSetting("onlyEquipped");
    const all = adapter.allWeapons(actor);
    const ranged = all.filter((w) => adapter.isRanged(w) && (!onlyEquipped || adapter.isEquipped(w)));
    const entry = (item) => ({ id: item.id, name: item.name, img: item.img, count: adapter.count(item) });

    return Object.assign(context, {
      weapons: ranged.map((weapon) => {
        const ammo = adapter.current(weapon);
        const list = adapter.choices(weapon);
        return {
          id: weapon.id,
          name: weapon.name,
          img: weapon.img,
          equipped: adapter.isEquipped(weapon),
          ammo: ammo ? { ...entry(ammo), state: ammoState(adapter.count(ammo), low) } : null,
          load: adapter.load(weapon),
          open: this.openList === weapon.id,
          options: list.map((item) => ({ ...entry(item), current: item.id === ammo?.id }))
        };
      }),
      gear: getSetting("showGear") ? all.filter((w) => !ranged.includes(w)).map((w) => ({ id: w.id, name: w.name, img: w.img, equipped: adapter.isEquipped(w) })) : []
    });
  }

  #actionContext(actor) {
    const { actions } = this.constructor;
    if (!actions || !getSetting("showActions")) return { actionTabs: [], actionPanel: null };
    const tabs = actions.tabs(actor);
    if (!tabs.some((tab) => tab.id === this.openTab)) this.openTab = null;
    return {
      actionTabs: tabs.map((tab) => ({ ...tab, active: tab.id === this.openTab })),
      actionPanel: this.openTab ? actions.groups(actor, this.openTab) : null
    };
  }

  /** Prawy klik na akcji: arkusz przedmiotu, zdjęcie stanu, uszkodzenie sprzętu z Ctrl. */
  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    this.element.addEventListener("contextmenu", (event) => {
      const button = event.target.closest(".whb-action");
      if (!button) return;
      event.preventDefault();
      this.#perform(button, event, true);
    });
  }

  #perform(button, event, right) {
    const actor = this.constructor.actor;
    if (!actor) return ui.notifications.warn(t("NoActor"));
    const mods = { right, shift: event.shiftKey, alt: event.altKey, ctrl: event.ctrlKey };
    return this.constructor.actions.perform(actor, button.dataset.value, mods);
  }

  /** Pasek makr bywa jedno- lub dwurzędowy, więc wysokość liczymy z jego rzeczywistego położenia. */
  _onRender(context, options) {
    super._onRender(context, options);
    const top = document.getElementById("hotbar")?.getBoundingClientRect().top;
    if (top > 0) this.element.style.bottom = `${window.innerHeight - top + 8}px`;
  }

  /** Pozycje z paska dotyczą zawsze aktualnej postaci, a błędy systemu nie mogą zostawiać kliknięcia bez odpowiedzi. */
  async #withWeapon(target, action) {
    const actor = this.constructor.actor;
    const weapon = actor?.items.get(target.closest("[data-weapon]")?.dataset.weapon);
    if (!weapon) return;
    try {
      await action(actor, weapon);
    } catch (err) {
      log.error(weapon.name, err);
      ui.notifications.error(typeof err === "string" ? err : t("Failed"));
    }
  }

  static #onToggleList(_event, target) {
    const id = target.closest("[data-weapon]")?.dataset.weapon;
    this.openList = this.openList === id ? null : id;
    this.render();
  }

  static #onChooseAmmo(_event, target) {
    this.openList = null;
    return this.#withWeapon(target, async (actor, weapon) => {
      const ammo = actor.items.get(target.dataset.ammo);
      if (ammo) await this.adapter.setAmmo(weapon, ammo);
    });
  }

  static #onOpenTab(_event, target) {
    this.openTab = this.openTab === target.dataset.tab ? null : target.dataset.tab;
    this.render();
  }

  static #onRunAction(event, target) {
    return this.#perform(target, event, false);
  }

  static #onReload(_event, target) {
    return this.#withWeapon(target, (actor, weapon) => this.adapter.reload(actor, weapon));
  }

  static #onToggleEquip(_event, target) {
    return this.#withWeapon(target, (actor, weapon) => this.adapter.toggleEquip(actor, weapon));
  }
}
