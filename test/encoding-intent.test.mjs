import { describe, expect, it } from "vitest";
import { decodeAction, encodeAction } from "../scripts/actions/encoding.mjs";
import { resolveIntent } from "../scripts/actions/intent.mjs";

describe("encoding", () => {
  it("koduje i dekoduje", () => {
    expect(encodeAction("skill", "abc")).toBe("skill|abc");
    expect(encodeAction("advantage")).toBe("advantage");
    expect(encodeAction("effect", "Actor.x.Item.y.ActiveEffect.z", 0)).toBe("effect|Actor.x.Item.y.ActiveEffect.z|0");
    expect(decodeAction("effect|Actor.x.ActiveEffect.z|1")).toEqual({ type: "effect", id: "Actor.x.ActiveEffect.z", extra: "1" });
    expect(decodeAction("advantage")).toEqual({ type: "advantage", id: "", extra: "" });
  });

  it("odrzuca nieznane i puste wartości", () => {
    expect(decodeAction("macro|x")).toBeNull();
    expect(decodeAction("")).toBeNull();
    expect(decodeAction(null)).toBeNull();
  });
});

describe("resolveIntent", () => {
  it("lewy klik na teście – rzut z dialogiem", () => {
    expect(resolveIntent("skill", {})).toEqual({ intent: "roll", skipDialog: false });
  });

  it("Alt pomija dialog, a przy ustawieniu odwrotnie", () => {
    expect(resolveIntent("weapon", { alt: true })).toEqual({ intent: "roll", skipDialog: true });
    expect(resolveIntent("weapon", {}, { skipDialogByDefault: true })).toEqual({ intent: "roll", skipDialog: true });
    expect(resolveIntent("weapon", { alt: true }, { skipDialogByDefault: true })).toEqual({ intent: "roll", skipDialog: false });
  });

  it("Shift – Blind GM, chyba że wyłączone", () => {
    expect(resolveIntent("characteristic", { shift: true })).toMatchObject({ intent: "roll", rollMode: "blindroll" });
    expect(resolveIntent("characteristic", { shift: true }, { blindOnShift: false }).rollMode).toBeUndefined();
  });

  it("prawy klik – arkusz dla przedmiotów, nic dla cech", () => {
    expect(resolveIntent("spell", { right: true })).toEqual({ intent: "sheet" });
    expect(resolveIntent("characteristic", { right: true })).toEqual({ intent: "none" });
  });

  it("Ctrl na broni i pancerzu – naprawa / uszkodzenie", () => {
    expect(resolveIntent("weapon", { ctrl: true })).toEqual({ intent: "repair" });
    expect(resolveIntent("armour", { ctrl: true, right: true })).toEqual({ intent: "damage" });
    expect(resolveIntent("skill", { ctrl: true })).toMatchObject({ intent: "roll" });
  });

  it("stany i Przewaga: lewy +, prawy −", () => {
    expect(resolveIntent("condition", {})).toEqual({ intent: "increase" });
    expect(resolveIntent("advantage", { right: true })).toEqual({ intent: "decrease" });
  });

  it("talenty na czat, pancerz – arkusz, efekty – uruchomienie", () => {
    expect(resolveIntent("talent", {})).toEqual({ intent: "post" });
    expect(resolveIntent("armour", {})).toEqual({ intent: "sheet" });
    expect(resolveIntent("effect", {})).toEqual({ intent: "run" });
    expect(resolveIntent("effect", { right: true })).toEqual({ intent: "sheet" });
  });
});
