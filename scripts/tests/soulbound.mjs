import { entries, quickFrom, testContext } from "./shared.mjs";

export default {
  tests: {
    freeText: false,
    modifier: false,
    catalog: async (ctx) => {
      const localize = (k) => ctx.i18n.localize(k);
      return [...entries(ctx.aos.config.skills, "skill", "skill", localize), ...entries(ctx.aos.config.attributes, "attribute", "attribute", localize)];
    },
    quick: (_ctx, catalog) => quickFrom(["skill:awareness", "skill:determination", "skill:survival", "skill:athletics"], catalog),
    difficulty: () => ({ kind: "dn", initial: 4, complexity: 1 }),
    value: (actor, entry) => (entry.kind === "skill" ? actor.system.skills?.[entry.key]?.training : actor.system.attributes?.[entry.key]?.value),

    async run(actor, entry, options) {
      const target = entry.kind === "skill" ? { skill: entry.key } : { attribute: entry.key };
      return { test: await actor.setupCommonTest(target, testContext(options, { difficulty: options.difficulty, complexity: options.complexity })) };
    },

    read(test) {
      const r = test.result ?? {};
      const successes = Number(r.successes) || 0;
      return { success: Boolean(r.success), detail: "", score: successes, scoreText: String(successes) };
    }
  }
};
