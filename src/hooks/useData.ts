import { useEffect, useRef, useState } from "react";
import type { DataResponse } from "../types";
type Source = "cdi" | "extras" | "market";
const recent = new Map<string, { data: DataResponse; until: number }>();
const pending = new Map<string, Promise<DataResponse>>();
export function clearDataCache() {
  recent.clear();
  pending.clear();
}
function query(
  start: string,
  end: string,
  scope: Source,
  force: boolean,
): Promise<DataResponse> {
  const key = new URLSearchParams({ start, end, scope }).toString();
  if (force) recent.delete(key);
  const hit = recent.get(key);
  if (hit && hit.until > Date.now()) return Promise.resolve(hit.data);
  const running = pending.get(key);
  if (running) return running;
  const job = fetch(`/api/data?${key}`, { cache: "no-store" })
    .then(async (r) => {
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "Falha na consulta");
      const data = body as DataResponse;
      // Mesmo uma resposta parcial é reutilizada brevemente; atualizar força nova consulta.
      const partial =
        scope === "cdi"
          ? !!data.cdi.error
          : scope === "extras"
            ? !!(data.selic?.error || data.savings?.error)
            : data.assets.some((a) => a.error);
      if (recent.size >= 36) recent.delete(recent.keys().next().value!);
      recent.set(key, { data, until: Date.now() + (partial ? 30000 : 300000) });
      return data;
    })
    .finally(() => pending.delete(key));
  pending.set(key, job);
  return job;
}
export function useData(
  start: string,
  end: string,
  refresh: number,
  scope: "all" | "fixed" = "all",
  enabled = true,
) {
  const lastRefresh = useRef(refresh);
  const [state, setState] = useState<{
    data?: DataResponse;
    loading: boolean;
    error?: string;
  }>({ loading: true });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const force = lastRefresh.current !== refresh;
    lastRefresh.current = refresh;
    const sources: Source[] =
      scope === "fixed" ? ["cdi", "extras"] : ["cdi", "extras", "market"];
    let remaining = sources.length;
    let data: DataResponse | undefined;
    const errors: string[] = [];
    setState({ loading: true });
    for (const source of sources) {
      query(start, end, source, force)
        .then((part) => {
          if (!active) return;
          data ??= {
            fetchedAt: part.fetchedAt,
            tokenConfigured: part.tokenConfigured,
            cdi: { annual: null, date: null, daily: [] },
            assets: [],
          };
          data = {
            ...data,
            fetchedAt: part.fetchedAt,
            ...(source === "cdi"
              ? { cdi: part.cdi }
              : source === "extras"
                ? { selic: part.selic, savings: part.savings }
                : { assets: part.assets }),
          };
        })
        .catch((e) => {
          if (active)
            errors.push(
              `Não foi possível consultar ${source === "cdi" ? "o CDI" : source === "extras" ? "Selic e poupança" : "a bolsa"}: ${e.message}`,
            );
        })
        .finally(() => {
          if (!active) return;
          remaining--;
          setState({
            data,
            loading: remaining > 0,
            error: errors.length ? errors.join(" ") : undefined,
          });
        });
    }
    // A consulta continua no cache ao trocar de aba; respostas de períodos antigos não alteram a tela.
    return () => {
      active = false;
    };
  }, [start, end, refresh, scope, enabled]);
  return state;
}
