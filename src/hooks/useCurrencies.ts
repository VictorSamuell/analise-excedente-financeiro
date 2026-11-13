import { loadCurrencies } from "../lib/loadCurrencies";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CurrencyData } from "../lib/currencies";
export function useCurrencies() {
  const [data, setData] = useState<CurrencyData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | undefined>(undefined);
  const update = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const body = await loadCurrencies(controller.signal);
      if (!controller.signal.aborted) {
        setData(body);
        setError("");
        setNow(Date.now());
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Falha ao atualizar.");
    } finally {
      if (request.current === controller) {
        request.current = undefined;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    void update();
    const timer = setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === "visible") void update();
    }, 60000);
    const visible = () => {
      if (document.visibilityState === "visible") void update();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      request.current?.abort();
      request.current = undefined;
    };
  }, [update]);
  return { data, loading, error, now, update };
}
