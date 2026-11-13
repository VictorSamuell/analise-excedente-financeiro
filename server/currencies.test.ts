import { afterEach, expect, it, vi } from "vitest";
import {
  clearCurrencyCache,
  getCurrencies,
  handleCurrencies,
} from "./currencies";
import { convertCurrency } from "../src/lib/currencies";
const quote = {
  code: "JPY",
  codein: "BRL",
  bid: "0.03528367",
  ask: "0.03530243",
  high: "0.036",
  low: "0.034",
  pctChange: "-0.4",
  timestamp: "1794529841",
};
afterEach(() => {
  clearCurrencyCache();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("preserva a precisão do iene, normaliza horário e compartilha consultas", async () => {
  const f = vi.fn(async () => Response.json({ JPYBRL: quote }));
  vi.stubGlobal("fetch", f);
  const [a, b] = await Promise.all([getCurrencies(), getCurrencies()]);
  expect(a).toEqual(b);
  expect(f).toHaveBeenCalledTimes(1);
  expect(a.quotes[0].bid).toBe(0.03528367);
  expect(Date.parse(a.quotes[0].updatedAt)).toBe(1794529841000);
  expect(convertCurrency(1000, a.quotes[0], true)).toBeCloseTo(35.28367);
  expect(convertCurrency(100, a.quotes[0], false)).toBeCloseTo(
    100 / 0.03530243,
  );
  await getCurrencies();
  expect(f).toHaveBeenCalledTimes(1);
});
it("mantém dados anteriores identificados como antigos após falha", async () => {
  vi.useFakeTimers();
  const f = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ JPYBRL: quote }))
    .mockRejectedValue(new Error("offline"));
  vi.stubGlobal("fetch", f);
  await getCurrencies();
  vi.advanceTimersByTime(61000);
  const r = await handleCurrencies();
  const d = await r.json();
  expect(r.status).toBe(200);
  expect(d.stale).toBe(true);
  expect(d.quotes[0].bid).toBe(0.03528367);
});
it("rejeita valores inválidos sem inventar cotação", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ JPYBRL: { ...quote, bid: "NaN" } })),
  );
  const r = await handleCurrencies();
  expect(r.status).toBe(502);
});
