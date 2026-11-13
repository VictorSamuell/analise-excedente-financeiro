import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ArrowLeftRight,
  Globe2,
} from "lucide-react";
import { currencies, convertCurrency } from "../lib/currencies";
import { useCurrencies } from "../hooks/useCurrencies";
const brl = (value: number, digits = 4) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
const stamp = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
export default function Currencies() {
  const { data, loading, error, now, update } = useCurrencies();
  const [code, setCode] = useState("USD");
  const [amount, setAmount] = useState("100");
  const [toBRL, setToBRL] = useState(true);
  const quote = data?.quotes.find((q) => q.code === code);
  const parsed = Number(amount.replace(",", "."));
  const valid =
    amount.trim() !== "" &&
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    parsed <= 1e12;
  const converted =
    quote && valid ? convertCurrency(parsed, quote, toBRL) : null;
  return (
    <div className="currency-page">
      <section className="currency-intro panel">
        <div>
          <span className="eyebrow">O MUNDO EM REAIS</span>
          <h2>Moedas em movimento</h2>
          <p>
            Acompanhe o câmbio e veja quanto vale o seu dinheiro em outras
            moedas.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={loading}
          onClick={() => void update()}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          {loading ? "Atualizando…" : "Atualizar cotações"}
        </button>
      </section>
      <div className="data-status" role="status">
        <span>
          <span
            className={`status-dot ${loading ? "pending" : error || data?.stale ? "failed" : ""}`}
          />
          {loading
            ? "Consultando cotações…"
            : data
              ? `Última consulta: ${stamp(data.fetchedAt)} · horário de Brasília`
              : "Consulta indisponível"}
        </span>
        <span>Atualização automática a cada 60 s</span>
      </div>
      {(error || data?.warning) && (
        <div className="notice error" role="alert">
          {error || data?.warning}
          {data && error ? " Mantivemos os últimos valores recebidos." : ""}
        </div>
      )}
      <section
        className="currency-converter panel"
        aria-label="Conversor de moedas"
      >
        <div>
          <h3>
            <ArrowLeftRight size={18} /> Conversão rápida
          </h3>
          <p className="form-note">
            Estimativa pela cotação comercial, sem tarifas, impostos ou spread
            da instituição.
          </p>
        </div>
        <div className="currency-converter-fields">
          <label>
            Valor em {toBRL ? code : "BRL"}
            <input
              aria-label="Valor para converter"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Moeda
            <select value={code} onChange={(e) => setCode(e.target.value)}>
              {currencies.map(([id, name]) => (
                <option key={id} value={id}>
                  {id} · {name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button secondary"
            onClick={() => setToBRL((v) => !v)}
            aria-label="Inverter sentido da conversão"
          >
            <ArrowLeftRight size={16} />
            {toBRL ? `${code} → BRL` : `BRL → ${code}`}
          </button>
          <output aria-live="polite">
            <small>Você teria aproximadamente</small>
            <strong>
              {converted !== null
                ? converted.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: toBRL ? "BRL" : code,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "—"}
            </strong>
            <small>
              {quote
                ? `Base: ${toBRL ? "compra" : "venda"} · ${stamp(quote.updatedAt)}`
                : "Aguardando cotação"}
            </small>
          </output>
        </div>
        {!valid && amount !== "" && (
          <p role="alert" className="negative">
            Informe um valor entre 0 e 1 trilhão, sem separador de milhares.
          </p>
        )}
      </section>
      <div className="section-heading">
        <div>
          <div className="eyebrow">COTAÇÕES COMERCIAIS</div>
          <h2>Quanto vale 1 unidade em reais</h2>
        </div>
        <span className="form-note">
          Compra · variação informada pela fonte
        </span>
      </div>
      <div className="currency-grid">
        {currencies.map(([id, name, symbol]) => {
          const q = data?.quotes.find((item) => item.code === id);
          const old = q && now - Date.parse(q.updatedAt) > 10 * 60000;
          return (
            <article className="panel currency-card" key={id}>
              <div className="currency-card-heading">
                <span className="currency-symbol" aria-hidden="true">
                  {symbol}
                </span>
                <div>
                  <h3>{name}</h3>
                  <span>{id} / BRL</span>
                </div>
                <Globe2 size={18} />
              </div>
              <div className="currency-price">
                {q ? brl(q.bid, q.bid < 0.1 ? 6 : 4) : "—"}
              </div>
              {q ? (
                <>
                  <div className={q.change >= 0 ? "positive" : "negative"}>
                    {q.change >= 0 ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownLeft size={16} />
                    )}
                    {q.change.toLocaleString("pt-BR", {
                      signDisplay: "exceptZero",
                      maximumFractionDigits: 2,
                    })}
                    % <span>na sessão da fonte</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Mínima</dt>
                      <dd>{brl(q.low)}</dd>
                    </div>
                    <div>
                      <dt>Máxima</dt>
                      <dd>{brl(q.high)}</dd>
                    </div>
                    <div>
                      <dt>Venda</dt>
                      <dd>{brl(q.ask, q.ask < 0.1 ? 6 : 4)}</dd>
                    </div>
                  </dl>
                  <p className="currency-timestamp">
                    Cotação: {stamp(q.updatedAt)} (Brasília)
                    {old && (
                      <span className="currency-delayed">
                        Sem atualização há mais de 10 min
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="form-note">
                  {loading
                    ? "Buscando cotação…"
                    : "Cotação indisponível nesta consulta."}
                </p>
              )}
            </article>
          );
        })}
      </div>
      <p className="form-note">
        Fonte:{" "}
        <a
          href="https://docs.awesomeapi.com.br/api-de-moedas"
          target="_blank"
          rel="noreferrer"
        >
          AwesomeAPI
        </a>
        . A consulta automática não garante negociação em tempo real: o acesso
        público tem cache de 1 minuto e os horários variam por moeda e
        funcionamento do mercado. Valores de referência; a conversão efetiva
        depende da instituição.
      </p>
    </div>
  );
}
