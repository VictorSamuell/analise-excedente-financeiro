import {
  currencySourceUrl,
  parseCurrencyQuotes,
  type CurrencyData,
} from "./currencies";
export async function loadCurrencies(
  signal: AbortSignal,
): Promise<CurrencyData> {
  let previous: CurrencyData | undefined;
  try {
    const response = await fetch("/api/currencies", {
      signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Falha na rota de câmbio.");
    const body = (await response.json()) as CurrencyData;
    if (!body.stale) return body;
    previous = body;
  } catch (error) {
    if (signal.aborted) throw error;
  }
  // A API pública permite CORS. Nenhuma credencial é enviada ao navegador.
  try {
    const response = await fetch(currencySourceUrl, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
      credentials: "omit",
    });
    if (!response.ok) throw new Error("Fonte de câmbio indisponível.");
    return parseCurrencyQuotes(await response.json());
  } catch (error) {
    if (signal.aborted) throw error;
    if (previous) return previous;
    throw new Error(
      "Não foi possível consultar o câmbio. Tente novamente em instantes.",
    );
  }
}
