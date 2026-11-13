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
