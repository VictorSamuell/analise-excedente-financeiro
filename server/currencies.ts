import { z } from "zod";
import {
  currencies,
  type CurrencyData,
  type CurrencyQuote,
} from "../src/lib/currencies";
const numeric = z.coerce.number().finite();
const schema = z.object({
  code: z.string(),
  codein: z.literal("BRL"),
  bid: numeric.positive(),
  ask: numeric.positive(),
  high: numeric.positive(),
  low: numeric.positive(),
  pctChange: numeric,
  timestamp: numeric.positive().max(8640000000000),
});
let cached: { data: CurrencyData; until: number } | undefined;
let pending: Promise<CurrencyData> | undefined;
export function clearCurrencyCache() {
  cached = undefined;
  pending = undefined;
}
export async function getCurrencies(): Promise<CurrencyData> {
  if (cached && cached.until > Date.now()) return cached.data;
  if (pending) return pending;
  pending = (async () => {
    const pairs = currencies.map(([code]) => `${code}-BRL`).join(",");
    const response = await fetch(
      `https://economia.awesomeapi.com.br/json/last/${pairs}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!response.ok)
      throw new Error(
        "Fonte de câmbio indisponível. Tente novamente em instantes.",
      );
    const body = (await response.json()) as Record<string, unknown>;
    const quotes: CurrencyQuote[] = [];
    for (const [code] of currencies) {
      const result = schema.safeParse(body?.[`${code}BRL`]);
      if (!result.success || result.data.code !== code) continue;
      const p = result.data;
      quotes.push({
        code,
        bid: p.bid,
        ask: p.ask,
        high: p.high,
        low: p.low,
        change: p.pctChange,
        updatedAt: new Date(p.timestamp * 1000).toISOString(),
      });
    }
    if (!quotes.length)
      throw new Error("A fonte não retornou cotações válidas.");
    const data: CurrencyData = { quotes, fetchedAt: new Date().toISOString() };
    cached = { data, until: Date.now() + 60000 };
    return data;
  })().finally(() => {
    pending = undefined;
  });
  return pending;
}
export async function handleCurrencies() {
  try {
    return Response.json(await getCurrencies(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    if (cached)
      return Response.json(
        {
          ...cached.data,
          stale: true,
          warning:
            "Não foi possível atualizar. Exibindo a última consulta recebida; confira os horários.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    return Response.json(
      {
        error:
          "Não foi possível consultar o câmbio. Tente novamente em instantes.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
