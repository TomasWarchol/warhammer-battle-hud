import { entries, quickFrom, testContext } from "./shared.mjs";

export default {
  tests: {
    freeText: false,
    modifier: false,
    catalog: async (ctx) => entries(ctx.oldworld.config.skills, "skill", "skill", (k) => ctx.i18n.localize(k)),
    quick: (_ctx, catalog) => quickFrom(["skill:awareness", "skill:survival", "skill:endurance", "skill:athletics"], catalog),
    difficulty: () => null,
    value: (actor, entry) => actor.system.skills?.[entry.key]?.value,

    async run(actor, entry, options) {
      return { test: await actor.setupSkillTest(entry.key, testContext(options)) };
    },

    read(test) {
      const r = test.result ?? {};
      const successes = Number(r.successes) || 0;
      return { success: Boolean(r.succeeded), detail: "", score: successes, scoreText: String(successes) };
    }
  }
};
