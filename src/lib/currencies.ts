import { z } from "zod";
export const currencies = [
  ["USD", "Dólar americano", "$"],
  ["EUR", "Euro", "€"],
  ["JPY", "Iene japonês", "¥"],
  ["GBP", "Libra esterlina", "£"],
  ["CHF", "Franco suíço", "Fr"],
  ["CAD", "Dólar canadense", "C$"],
  ["AUD", "Dólar australiano", "A$"],
  ["CNY", "Yuan chinês", "元"],
] as const;
export interface CurrencyQuote {
  code: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  change: number;
  updatedAt: string;
}
export interface CurrencyData {
  quotes: CurrencyQuote[];
  fetchedAt: string;
  stale?: boolean;
  warning?: string;
}
export function convertCurrency(
  amount: number,
  quote: CurrencyQuote,
  toBRL: boolean,
) {
  return toBRL ? amount * quote.bid : amount / quote.ask;
}

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

export const currencySourceUrl = `https://economia.awesomeapi.com.br/json/last/${currencies.map(([code]) => `${code}-BRL`).join(",")}`;
export function parseCurrencyQuotes(body: unknown): CurrencyData {
  const entries = z.record(z.unknown()).parse(body);
  const quotes: CurrencyQuote[] = [];
  for (const [code] of currencies) {
    const result = schema.safeParse(entries[`${code}BRL`]);
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
  if (!quotes.length) throw new Error("A fonte não retornou cotações válidas.");
  const data: CurrencyData = { quotes, fetchedAt: new Date().toISOString() };
  return data;
}
