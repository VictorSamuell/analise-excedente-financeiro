import {
  currencySourceUrl,
  parseCurrencyQuotes,
  type CurrencyData,
} from "../src/lib/currencies";
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
    const response = await fetch(currencySourceUrl, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        "Fonte de câmbio indisponível. Tente novamente em instantes.",
      );
    const body = (await response.json()) as Record<string, unknown>;
    const data = parseCurrencyQuotes(body);
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
