import { CapitalInput } from "./components/CapitalInput";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Info,
  Landmark,
  LayoutDashboard,
  Menu,
  Moon,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useData } from "./hooks/useData";
import { useCapitalAnalisado } from "./contexts/CapitalContext";
import {
  analyze,
  dateLabel,
  monthsAgo,
  rank,
  shiftDays,
  today,
} from "./lib/finance";
import Compare from "./pages/Compare";
import Dashboard from "./pages/Dashboard";
import Fixed from "./pages/Fixed";
import History from "./pages/History";
import Market from "./pages/Market";
import SettingsPage from "./pages/Settings";
import type { ComparisonRow, Settings } from "./types";
const tabs: {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    id: "dashboard",
    name: "Visão geral",
    icon: LayoutDashboard,
    description: "Uma visão clara das possibilidades para o seu excedente.",
  },
  {
    id: "compare",
    name: "Comparador",
    icon: ArrowLeftRight,
    description: "O mesmo capital. O mesmo período. Diferentes possibilidades.",
  },
  {
    id: "fixed",
    name: "Renda fixa",
    icon: Landmark,
    description:
      "Compare CDBs, RDB, LCI, LCA, Tesouro Selic estimado e poupança.",
  },
  {
    id: "market",
    name: "Renda variável",
    icon: TrendingUp,
    description: "Acompanhe ações, ETFs e fundos imobiliários da B3.",
  },
  {
    id: "history",
    name: "Histórico",
    icon: ChartNoAxesCombined,
    description: "Veja como o desempenho se desenvolveu ao longo do período.",
  },
  {
    id: "settings",
    name: "Configurações",
    icon: SlidersHorizontal,
    description:
      "Ajuste as condições para uma comparação que faça sentido para você.",
  },
];
const defaultSettings: Settings = {
  rates: [100, 110, 120, 105, 90, 90],
  reference: 1,
  method: "historical",
};
export default function App() {
  const [tab, setTab] = useState("dashboard"),
    [mobile, setMobile] = useState(false),
    [navVisible, setNavVisible] = useState(true),
    [settings, setSettings] = useState(defaultSettings),
    [period, setPeriod] = useState("1m"),
    [end, setEnd] = useState(shiftDays(today(), -1)),
    [start, setStart] = useState(monthsAgo(shiftDays(today(), -1), 1)),
    [refresh, setRefresh] = useState(0),
    [category, setCategory] = useState("Todas"),
    [sort, setSort] = useState("desc"),
    [selected, setSelected] = useState(["PETR4", "ITUB4"]),
    [help, setHelp] = useState(false),
    [theme, setTheme] = useState<"light" | "dark">(() => {
      try {
        return localStorage.getItem("analise-excedente-theme") === "dark"
          ? "dark"
          : "light";
      } catch {
        return "light";
      }
    });
  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 800px)");
    let previousY = window.scrollY;

    const updateNavigation = () => {
      const currentY = window.scrollY;
      if (!mobileViewport.matches || mobile || currentY <= 24) {
        setNavVisible(true);
      } else if (currentY < previousY - 4) {
        setNavVisible(true);
      } else if (currentY > previousY + 4) {
        setNavVisible(false);
      }
      previousY = currentY;
    };

    window.addEventListener("scroll", updateNavigation, { passive: true });
    window.addEventListener("resize", updateNavigation);
    return () => {
      window.removeEventListener("scroll", updateNavigation);
      window.removeEventListener("resize", updateNavigation);
    };
  }, [mobile]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#13241f" : "#173e35");
    try {
      localStorage.setItem("analise-excedente-theme", theme);
    } catch {
      // The selected theme still applies for this session when storage is unavailable.
    }
  }, [theme]);
  const { capitalAnalisado, setCapitalAnalisado } = useCapitalAnalisado();
  const { data, loading, error } = useData(
    start,
    end,
    refresh,
    tab === "fixed" ? "fixed" : "all",
  );
  const analysis = useMemo(
    () =>
      analyze(
        tab === "fixed" && data ? { ...data, assets: [] } : data,
        settings,
        capitalAnalisado,
        start,
        end,
      ),
    [data, settings, capitalAnalisado, start, end, tab],
  );
  const { fixed, market, reference } = analysis;
  const current = tabs.find((t) => t.id === tab)!;
  const validMarket = market.filter(
      (r) => r.rate !== null && r.category !== "Índice",
    ),
    best = rank(market, 4),
    worst = rank(market, 3, true),
    benchmark = market.find((r) => r.category === "Índice");
  const all = [...fixed, ...market.filter((r) => r.category !== "Índice")];
  const filtered = (rows: ComparisonRow[]) =>
    rows
      .filter((r) => category === "Todas" || r.category === category)
      .sort((a, b) =>
        a.rate === null
          ? 1
          : b.rate === null
            ? -1
            : (sort === "desc" ? -1 : 1) * (a.rate - b.rate),
      );
  function preset(key: string) {
    setPeriod(key);
    const to = [
        shiftDays(today(), -1),
        ...(data?.cdi.date ? [data.cdi.date] : []),
      ].sort()[0],
      from = key.endsWith("m")
        ? monthsAgo(to, Number(key.slice(0, -1)))
        : shiftDays(to, -Number(key));
    setStart(from);
    setEnd(to);
  }
  const navigate = (id: string) => {
    setTab(id);
    setMobile(false);
    setCategory("Todas");
  };
  const topCount = best.filter(
    (r) => reference.rate !== null && r.rate! > reference.rate,
  ).length;
  const filterBar = (
    <div className="table-toolbar">
      <div className="segmented" aria-label="Filtrar por categoria">
        {["Todas", "Ação", "ETF", "FII"].map((c) => (
          <button
            key={c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c === "Ação"
              ? "Ações"
              : c === "ETF"
                ? "ETFs"
                : c === "FII"
                  ? "FIIs"
                  : c}
          </button>
        ))}
      </div>
      <label className="sort-label">
        Ordenar{" "}
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="desc">Maior retorno</option>
          <option value="asc">Menor retorno</option>
        </select>
      </label>
    </div>
  );
  const pageProps = {
    onShorterPeriod: () => preset("3m"),
    settings,
    setSettings,
    analysis,
    reference,
    data,
    best,
    validMarket,
    topCount,
    worst,
    filtered,
    navigate,
    benchmark,
    filterBar,
    all,
    fixed,
    market,
    selected,
    setSelected,
  };
  return (
    <div className="app">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-icon">
            <ChartNoAxesCombined size={25} />
          </span>
          <span>
            Hub Financeiro<small>INTELIGÊNCIA PARA EMPREENDER</small>
          </span>
        </a>
        <div className="workspace-label">SUAS FERRAMENTAS</div>
        <div className="tool-label">
          <span>10</span>
          <div>
            Excedente financeiro<small>Análise e comparação</small>
          </div>
        </div>
        <nav id="primary-navigation" aria-label="Seções da ferramenta">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(t.id)}
              className={tab === t.id ? "active" : ""}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <t.icon size={19} />
              {t.name}
              {tab === t.id && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="learning-card">
            <div className="circle-icon">
              <CircleHelp size={21} />
            </div>
            <strong>Decisões com mais contexto</strong>
            <p>Entenda os números antes de escolher onde investir.</p>
            <button onClick={() => setHelp(true)}>
              Como utilizar <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="university">
            <span className="university-mark">U</span>
            <div>
              UNICAMP<small>Projeto acadêmico de extensão</small>
            </div>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          aria-label="Fechar navegação"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className={`topbar ${navVisible ? "" : "topbar-hidden"}`}>
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label={mobile ? "Fechar navegação" : "Abrir navegação"}
              aria-expanded={mobile}
              aria-controls="primary-navigation"
              onClick={() => setMobile((open) => !open)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Ferramentas <ChevronRight size={13} />{" "}
              <b>Análise de excedente financeiro</b>
            </span>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              aria-label="Alternar tema claro e escuro"
              aria-pressed={theme === "dark"}
              onClick={() =>
                setTheme((currentTheme) =>
                  currentTheme === "dark" ? "light" : "dark",
                )
              }
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
            </button>
            <span className="project-badge">
              <span /> PROJETO DE EXTENSÃO
            </span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                FERRAMENTA 10 <span>/</span> INTELIGÊNCIA FINANCEIRA
              </div>
              <h1>{current.name}</h1>
              <p>{current.description}</p>
            </div>
            <button
              className="button secondary"
              disabled={loading}
              onClick={() => setRefresh((x) => x + 1)}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />
              {loading
                ? "Consultando…"
                : error
                  ? "Tentar novamente"
                  : "Atualizar dados"}
            </button>
          </div>
          {tab === "dashboard" && (
            <section className="intro-banner">
              <div>
                <span className="eyebrow">SEU DINHEIRO, EM PERSPECTIVA</span>
                <h2>
                  O que seu excedente
                  <br />
                  poderia ter rendido?
                </h2>
                <p>
                  Compare alternativas e transforme dados
                  <br className="desktop-only" /> em decisões mais informadas
                  para o seu negócio.
                </p>
              </div>
              <div className="banner-art" aria-hidden="true">
                <span className="art-orbit one" />
                <span className="art-orbit two" />
                <div className="art-card">
                  <span className="art-mini-line" />
                  <span className="art-mini-line short" />
                  <div className="art-bars">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="art-coin">
                  <TrendingUp size={28} />
                </div>
              </div>
              <span className="banner-caption">Compare. Entenda. Planeje.</span>
            </section>
          )}
          <section className="filters" aria-label="Filtros da análise">
            <div className="filter-title">
              <SlidersHorizontal size={17} />
              <strong>Seu cenário</strong>
            </div>
            <label className="capital-label">
              Capital excedente
              <div className="money-input">
                <span>R$</span>
                <CapitalInput
                  value={capitalAnalisado}
                  onChange={setCapitalAnalisado}
                />
              </div>
            </label>
            <div className="period-filter">
              <span className="field-label">Período de análise</span>
              <div className="period-buttons">
                {[
                  ["7", "7 dias"],
                  ["15", "15 dias"],
                  ["1m", "1 mês"],
                  ["3m", "3 meses"],
                  ["6m", "6 meses"],
                  ["12m", "12 meses"],
                  ["24m", "2 anos"],
                  ["60m", "5 anos"],
                  ["120m", "10 anos"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={period === key ? "active" : ""}
                    aria-pressed={period === key}
                    onClick={() => preset(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="ref-filter">
              Comparar com
              <select
                value={settings.reference}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    reference: Number(e.target.value),
                  }))
                }
              >
                {fixed.map((row, i) => (
                  <option key={row.id} value={i}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <div className="data-status" aria-live="polite">
            <span>
              <span
                className={`status-dot ${loading ? "pending" : data ? "" : "failed"}`}
              />
              {loading
                ? "Buscando dados nas fontes…"
                : error
                  ? "Consulta não concluída"
                  : `Dados consultados às ${new Date(data?.fetchedAt ?? Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
            </span>
            <span>
              {dateLabel(start)} — {dateLabel(end)} · BCB / brapi
            </span>
          </div>
          {error && (
            <div className="notice error" role="alert">
              <Info size={18} />
              <span>{error}</span>
            </div>
          )}
          {data && !data.tokenConfigured && (
            <div className="notice">
              <Info size={18} />
              <span>
                <b>Acesso inicial ao mercado.</b> PETR4, ITUB4 e VALE3 são
                consultados sem chave. Os demais ativos precisam de uma chave
                brapi com histórico habilitado.{" "}
                <button
                  className="text-button"
                  onClick={() => navigate("settings")}
                >
                  Ver integração <ArrowUpRight size={13} />
                </button>
              </span>
            </div>
          )}
          {data?.cdi.error && (
            <div className="notice error">
              <Info size={18} />
              <span>Banco Central: {data.cdi.error}</span>
            </div>
          )}
          {Number(period.replace("m", "")) > 12 && (
            <p className="form-note">
              Histórico longo para renda fixa. A cobertura da renda variável
              depende do provedor.
            </p>
          )}
          {data && (
            <p className="analysis-scope">
              <CalendarDays size={14} /> Intervalo efetivo:{" "}
              <b>
                {dateLabel(analysis.start)} a {dateLabel(analysis.end)}
              </b>{" "}
              ·{" "}
              {settings.method === "historical"
                ? "CDI histórico"
                : "Estimativa com CDI atual"}{" "}
              · Preços ajustados quando disponíveis. O dia em curso é excluído.
            </p>
          )}
          {loading && tab !== "settings" && (
            <div className="notice" role="status">
              <RefreshCw size={18} className="spin" />
              <span>
                {data
                  ? "Os dados disponíveis já estão na tela. Carregando as demais fontes…"
                  : "Consultando o histórico do período…"}
              </span>
            </div>
          )}
          {data && tab === "dashboard" && <Dashboard {...pageProps} />}
          {data && tab === "compare" && <Compare {...pageProps} />}
          {data && tab === "fixed" && <Fixed {...pageProps} />}
          {data && tab === "market" && <Market {...pageProps} />}
          {data && tab === "history" && <History {...pageProps} />}
          {tab === "settings" && <SettingsPage {...pageProps} />}
          <footer>
            <div>
              <Info size={17} />
              <p>
                Ferramenta educacional. Valores brutos, antes de tributos e
                custos. Avalie risco, liquidez, prazo e condições de garantia de
                cada produto. Rentabilidade passada não garante resultados
                futuros. Não constitui recomendação individual de investimento.
              </p>
            </div>
            <span>
              Hub de Inteligência Financeira para Empreendedores · Unicamp
            </span>
          </footer>
        </main>
      </div>
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="icon-button modal-close"
              aria-label="Fechar ajuda"
              onClick={() => setHelp(false)}
            >
              <X />
            </button>
            <span className="eyebrow">COMECE POR AQUI</span>
            <h2 id="help-title">Do excedente à comparação</h2>
            <ol>
              <li>Informe o capital disponível para análise.</li>
              <li>Escolha o período que deseja consultar.</li>
              <li>
                Na aba Renda fixa, preencha os percentuais das ofertas
                bancárias.
              </li>
              <li>
                Escolha uma renda fixa como referência e compare os retornos.
              </li>
              <li>
                Explore o Dashboard e o Histórico, observando as fontes e as
                datas.
              </li>
            </ol>
            <button
              className="button"
              onClick={() => {
                setHelp(false);
                navigate("fixed");
              }}
            >
              Ajustar minhas taxas <ArrowUpRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
