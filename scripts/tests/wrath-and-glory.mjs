import { entries, quickFrom, testContext } from "./shared.mjs";

export default {
  tests: {
    freeText: false,
    modifier: false,
    catalog: async (ctx) => {
      const localize = (k) => ctx.i18n.localize(k);
      return [...entries(ctx.wng.config.skills, "skill", "skill", localize), ...entries(ctx.wng.config.attributes, "attribute", "attribute", localize)];
    },
    quick: (_ctx, catalog) => quickFrom(["skill:awareness", "skill:insight", "skill:investigation", "skill:athletics"], catalog),
    difficulty: () => ({ kind: "dn", initial: 3 }),
    value: (actor, entry) => (entry.kind === "skill" ? actor.system.skills : actor.system.attributes)?.[entry.key]?.total,

    async run(actor, entry, options) {
      const context = testContext(options, { difficulty: options.difficulty });
      const test = entry.kind === "skill" ? await actor.setupSkillTest(entry.key, context) : await actor.setupAttributeTest(entry.key, context);
      return { test };
    },

    read(test) {
      const r = test.result ?? {};
      const icons = Number(r.success) || 0;
      return { success: Boolean(r.isSuccess), detail: `${icons} / ${r.dn}`, score: icons - (Number(r.dn) || 0), scoreText: String(icons) };
    }
  }
};
