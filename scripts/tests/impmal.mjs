import { entries, quickFrom, readPercentile, testContext } from "./shared.mjs";

export default {
  tests: {
    freeText: false,
    modifier: true,
    catalog: async (ctx) => {
      const localize = (k) => ctx.i18n.localize(k);
      return [...entries(ctx.impmal.config.skills, "skill", "skill", localize), ...entries(ctx.impmal.config.characteristics, "characteristic", "characteristic", localize)];
    },
    quick: (_ctx, catalog) => quickFrom(["skill:awareness", "skill:intuition", "skill:discipline", "skill:fortitude"], catalog),

    difficulty: (ctx) => ({
      kind: "select",
      initial: "challenging",
      choices: Object.entries(ctx.impmal.config.difficulties).map(([id, d]) => ({ id, label: ctx.i18n.localize(d.name) }))
    }),

    async run(actor, entry, options) {
      const context = testContext(options, { difficulty: options.difficulty, modifier: options.modifier });
      const test = entry.kind === "skill" ? await actor.setupSkillTest({ key: entry.key }, context) : await actor.setupCharacteristicTest(entry.key, context);
      return { test };
    },

    value: (actor, entry) => (entry.kind === "skill" ? actor.system.skills : actor.system.characteristics)?.[entry.key]?.total,

    read: readPercentile
  }
};
