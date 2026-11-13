import { afterEach, expect, it, vi } from "vitest";
import { loadCurrencies } from "./loadCurrencies";
import { currencySourceUrl } from "./currencies";
const raw = {
  USDBRL: {
    code: "USD",
    codein: "BRL",
    bid: "5.6",
    ask: "5.7",
    high: "5.8",
    low: "5.5",
    pctChange: "1",
    timestamp: "1794523294",
  },
};
afterEach(() => vi.unstubAllGlobals());
it("recupera cotações diretamente quando a Cloudflare retorna 502", async () => {
  const f = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ error: "falha" }, { status: 502 }))
    .mockResolvedValueOnce(Response.json(raw));
  vi.stubGlobal("fetch", f);
  const result = await loadCurrencies(new AbortController().signal);
  expect(result.quotes[0].bid).toBe(5.6);
  expect(f.mock.calls[1][0]).toBe(currencySourceUrl);
  expect(f.mock.calls[1][1].credentials).toBe("omit");
});
it("mantém cache antigo identificado quando ambas as rotas falham", async () => {
  const old = {
    quotes: [],
    fetchedAt: "2026-11-12",
    stale: true,
    warning: "Dados anteriores",
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json(old))
      .mockRejectedValueOnce(new Error("offline")),
  );
  expect(await loadCurrencies(new AbortController().signal)).toEqual(old);
});
it("não inicia alternativa depois de sair da página", async () => {
  const controller = new AbortController();
  const f = vi.fn(async () => {
    controller.abort();
    throw new Error("cancelado");
  });
  vi.stubGlobal("fetch", f);
  await expect(loadCurrencies(controller.signal)).rejects.toThrow();
  expect(f).toHaveBeenCalledTimes(1);
});
