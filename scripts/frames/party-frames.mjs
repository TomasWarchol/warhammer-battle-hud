/**
 * Ramki drużyny na ekranie. Klik: cel, podwójny klik: przejście do tokena, prawy klik: karta postaci.
 */
import { MODULE_ID, t } from "./constants.mjs";
import { getSetting, setSetting } from "./settings.mjs";
import { clampPosition, nextMode, percent, pickActors, tone } from "./frames-data.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
/** Czas na drugie kliknięcie, zanim pojedyncze zadziała. */
const DOUBLE_CLICK_MS = 220;

export class PartyFrames extends HandlebarsApplicationMixin(ApplicationV2) {
  static adapter = null;
  static #instance = null;

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-root`,
    classes: [MODULE_ID],
    window: { frame: false, positioned: false },
    actions: { cycleMode: PartyFrames.#onCycleMode, toggleCollapse: PartyFrames.#onToggleCollapse }
  };

  static PARTS = { frames: { template: `modules/${MODULE_ID}/templates/frames.hbs` } };

  static refresh() {
    this.#instance ??= new this();
    if (getSetting("showFrames")) this.#instance.render({ force: true });
    else if (this.#instance.rendered) this.#instance.close();
  }

  #clickTimer = null;

  #actors() {
    return pickActors({
      mode: getSetting("mode"),
      users: game.users.contents,
      actors: game.actors.contents,
      combatants: game.combat?.combatants.contents.map((c) => c.actor) ?? [],
      controlled: canvas.tokens?.controlled.map((token) => token.actor) ?? [],
      partyTypes: this.constructor.adapter.partyTypes,
      isGM: game.user.isGM
    });
  }

  #conditions(actor) {
    return (actor.temporaryEffects ?? []).filter((e) => e.img).map((e) => ({ name: e.name, img: e.img, value: Number.isFinite(e.conditionValue) && e.conditionValue > 1 ? e.conditionValue : null }));
  }

  #frame(actor, seeAll) {
    const { adapter } = this.constructor;
    const full = actor.isOwner || seeAll;
    const token = actor.getActiveTokens?.()[0];
    return {
      uuid: actor.uuid,
      name: actor.name,
      img: actor.img,
      targeted: Boolean(token?.isTargeted),
      active: game.combat?.combatant?.actor?.uuid === actor.uuid,
      bars: adapter.bars(actor).map((bar) => {
        const fill = percent(bar.value, bar.max);
        return { label: t(`Stat.${bar.key}`), fill, tone: tone(bar.kind, fill), text: full ? `${bar.value} / ${bar.max}` : "" };
      }),
      stats: full ? adapter.stats(actor).map((stat) => ({ ...stat, label: t(`Stat.${stat.key}`) })) : [],
      conditions: full ? this.#conditions(actor) : []
    };
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const seeAll = game.user.isGM || getSetting("playersSeeAll");
    const mode = getSetting("mode");
    return Object.assign(context, {
      skin: getSetting("skin"),
      collapsed: getSetting("collapsed"),
      modeLabel: t(`Mode.${mode}`),
      frames: this.#actors().map((actor) => this.#frame(actor, seeAll))
    });
  }

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    const root = this.element;
    root.addEventListener("click", (event) => this.#onClick(event));
    root.addEventListener("dblclick", (event) => this.#onDoubleClick(event));
    root.addEventListener("contextmenu", (event) => this.#onContextMenu(event));
    root.addEventListener("pointerdown", (event) => this.#onDragStart(event));
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#place(getSetting("position"));
  }

  #place(saved) {
    if (!Number.isFinite(saved?.left)) return;
    const { offsetWidth, offsetHeight } = this.element;
    const { left, top } = clampPosition(saved, offsetWidth, offsetHeight, window.innerWidth, window.innerHeight);
    Object.assign(this.element.style, { left: `${left}px`, top: `${top}px` });
  }

  #tokenAt(event) {
    const frame = event.target.closest("[data-uuid]");
    if (!frame) return {};
    const actor = fromUuidSync(frame.dataset.uuid);
    return { actor, token: actor?.getActiveTokens?.()[0] };
  }

  #onClick(event) {
    const { token, actor } = this.#tokenAt(event);
    if (!actor) return;
    clearTimeout(this.#clickTimer);
    this.#clickTimer = setTimeout(() => {
      if (!token) return ui.notifications.info(t("NoToken", { name: actor.name }));
      token.setTarget(!token.isTargeted, { releaseOthers: false });
      this.render();
    }, DOUBLE_CLICK_MS);
  }

  #onDoubleClick(event) {
    const { token, actor } = this.#tokenAt(event);
    if (!actor) return;
    clearTimeout(this.#clickTimer);
    if (!token) return ui.notifications.info(t("NoToken", { name: actor.name }));
    canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 250 });
  }

  #onContextMenu(event) {
    const { actor } = this.#tokenAt(event);
    if (!actor) return;
    event.preventDefault();
    if (actor.testUserPermission(game.user, "LIMITED")) actor.sheet.render({ force: true });
  }

  /** Ramki przesuwa się za nagłówek; położenie zapisujemy po puszczeniu. */
  #onDragStart(event) {
    const header = event.target.closest(".whf-header");
    if (!header || event.target.closest("button") || event.button !== 0) return;
    const { element } = this;
    const box = element.getBoundingClientRect();
    const offset = { x: event.clientX - box.left, y: event.clientY - box.top };
    const move = (e) => this.#place({ left: e.clientX - offset.x, top: e.clientY - offset.y });
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      const { left, top } = element.getBoundingClientRect();
      setSetting("position", { left: Math.round(left), top: Math.round(top) });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  static async #onCycleMode() {
    await setSetting("mode", nextMode(getSetting("mode")));
    this.render();
  }

  static async #onToggleCollapse() {
    await setSetting("collapsed", !getSetting("collapsed"));
    this.render();
  }
}
