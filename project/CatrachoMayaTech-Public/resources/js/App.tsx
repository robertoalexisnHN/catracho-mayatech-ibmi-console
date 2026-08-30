import { useState, useEffect } from "react";
import Sidebar, { type View } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Comparator from "./components/Comparator";
import Incidents from "./components/Incidents";
import Timeline from "./components/Timeline";
import CommandPalette from "./components/CommandPalette";
import ObjectHistoryModal from "./components/ObjectHistoryModal";
import { incidents } from "./data";

const titles: Record<View, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard general", sub: "Continuidad operativa · DEV / QA / PROD" },
  comparador: { title: "Comparador de objetos", sub: "Diferencias y dependencias entre ambientes" },
  incidentes: { title: "Centro de incidentes", sub: "Producción · joblogs y remediación" },
  timeline: { title: "Línea de pases", sub: "Trazabilidad cronológica entre ambientes" },
};

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [selectedObj, setSelectedObj] = useState("ORDVAL01");
  const [selectedInc, setSelectedInc] = useState(incidents[0].id);
  const [historyObj, setHistoryObj] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const activeIncidents = incidents.filter((i) => i.status !== "resuelto").length;
  const t = titles[view];

  // Global search — Ctrl/Cmd + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openObject = (name: string) => {
    setSelectedObj(name);
    setHistoryObj(name);
  };

  return (
    <div className="flex h-full w-full">
      <Sidebar view={view} setView={setView} activeIncidents={activeIncidents} />

      <main className="ops-ground flex h-full flex-1 flex-col overflow-hidden">
        {/* Top command bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-carbon-700 bg-carbon-900/80 px-8 py-4 backdrop-blur">
          <div>
            <h1 className="text-xl font-700 tracking-tight text-slate-txt">{t.title}</h1>
            <p className="mt-0.5 font-mono text-[12px] tracking-wide text-slate-faint">{t.sub}</p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 border border-carbon-700 bg-carbon-950 px-3 py-2 font-mono text-[12px] text-slate-faint transition-colors hover:border-carbon-600 hover:text-slate-dim"
            >
              <span className="text-phosphor">›</span>
              Buscar…
              <kbd className="border border-carbon-600 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
            </button>
            <div className="text-right">
              <div className="font-mono text-[11px] tracking-wider text-slate-faint uppercase">Hora del sistema</div>
              <div className="font-mono text-sm text-slate-txt">2026-08-29 · 03:22 UTC-6</div>
            </div>
            <div className="flex items-center gap-2 border border-carbon-700 bg-carbon-950 px-3 py-2">
              <span
                className={`h-2 w-2 ${activeIncidents ? "pulse-alarm" : ""}`}
                style={{
                  backgroundColor: activeIncidents ? "var(--color-alarm)" : "var(--color-phosphor)",
                  boxShadow: `0 0 8px ${activeIncidents ? "var(--color-alarm)" : "var(--color-phosphor)"}`,
                }}
              />
              <span className="font-mono text-[12px] tracking-wide text-slate-txt">
                {activeIncidents ? `${activeIncidents} incidentes activos` : "Todo operativo"}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {view === "dashboard" && <Dashboard setView={setView} />}
          {view === "comparador" && (
            <Comparator selectedName={selectedObj} setSelectedName={setSelectedObj} onOpenHistory={openObject} />
          )}
          {view === "incidentes" && <Incidents setView={setView} selectedId={selectedInc} setSelectedId={setSelectedInc} />}
          {view === "timeline" && <Timeline onOpenObject={openObject} setView={setView} />}
        </div>
      </main>

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        setView={setView}
        onOpenObject={openObject}
        selectIncident={setSelectedInc}
      />

      {historyObj && <ObjectHistoryModal name={historyObj} onClose={() => setHistoryObj(null)} />}
    </div>
  );
}
