/**
 * Testy postaci w każdym systemie: katalog, szybkie testy i rzut.
 */
import wfrp4e from "./wfrp4e.mjs";
import whtow from "./whtow.mjs";
import impmal from "./impmal.mjs";
import wrathAndGlory from "./wrath-and-glory.mjs";
import soulbound from "./soulbound.mjs";

const TESTS = { wfrp4e, whtow, impmal, "wrath-and-glory": wrathAndGlory, "age-of-sigmar-soulbound": soulbound };

export const testsFor = (systemId) => TESTS[systemId]?.tests ?? null;

/** Bez rzutu zastępczego: zaawansowana umiejętność bez wyszkolenia po prostu nie ma testu. */
const RUN_SETTINGS = { advancedFallback: false, fallbackSteps: 1 };

/**
 * Test z oknem rzutu, żeby gracz mógł ustawić modyfikatory.
 * @returns {Promise<{test?: object, skipped?: string}>}
 */
export function rollTest(tests, actor, entry) {
  const difficulty = tests.difficulty(game);
  return tests.run(actor, entry, { skipDialog: false, difficulty: difficulty?.initial, complexity: difficulty?.complexity }, game, RUN_SETTINGS);
}
