/**
 * Rejestr adapterów. Nowy system to jeden plik w tym katalogu i jedna linia poniżej.
 */
import wfrp4e from "./wfrp4e.mjs";
import impmal from "./impmal.mjs";
import wrathAndGlory from "./wrath-and-glory.mjs";

export const ADAPTERS = { wfrp4e, impmal, "wrath-and-glory": wrathAndGlory };

export const adapterFor = (systemId) => ADAPTERS[systemId] ?? null;
