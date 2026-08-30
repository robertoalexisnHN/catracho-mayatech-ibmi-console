import { environments, incidents, compareObjects, passes } from "../data";
import { EnvIndicator, SeverityBadge, SectionLabel, StatusDot, PassStatusBadge } from "./primitives";
import type { View } from "./Sidebar";

export default function Dashboard({ setView }: { setView: (v: View) => void }) {
  const active = incidents.filter((i) => i.status !== "resuelto");
  const totalDiffs = environments.reduce((a, e) => a + e.pendingDiffs, 0);
  const pendingObjs = compareObjects.filter((o) => o.status !== "sync");

  return (
    <div className="mx-auto max-w-[1400px] px-8 py-8">
      {/* Environment status row */}
      <SectionLabel>Estado general de ambientes</SectionLabel>
      <div className="grid grid-cols-3 gap-4 max-[1000px]:grid-cols-1">
        {environments.map((e) => {
          const tone =
            e.health === "ok" ? "var(--color-phosphor)" : e.health === "warn" ? "var(--color-amber-warn)" : "var(--color-alarm)";
          return (
            <div key={e.id} className="relative border border-carbon-700 bg-carbon-900 p-5" style={{ borderTopColor: tone, borderTopWidth: 2 }}>
              <EnvIndicator env={e.id} health={e.health} host={e.host} />
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-carbon-700 pt-4">
                <Metric label="Objetos" value={e.objects.toLocaleString("es")} />
                <Metric label="Diffs" value={e.pendingDiffs} tone={e.pendingDiffs ? "var(--color-amber-warn)" : undefined} />
                <Metric label="Últ. sync" value={e.lastSync} mono />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-[1.4fr_1fr] gap-6 max-[1000px]:grid-cols-1">
        {/* Active incidents */}
        <div>
          <SectionLabel>Incidentes activos · {active.length}</SectionLabel>
          <div className="flex flex-col gap-2">
            {active.map((i) => (
              <button
                key={i.id}
                onClick={() => setView("incidentes")}
                className="group flex items-center gap-4 border border-carbon-700 bg-carbon-900 px-4 py-3 text-left transition-colors hover:border-carbon-600 hover:bg-carbon-850"
              >
                <span className="font-mono text-[12px] text-slate-faint">{i.id}</span>
                <SeverityBadge level={i.severity} />
                <span className="flex-1 truncate text-sm text-slate-txt">{i.title}</span>
                <span className="font-mono text-[11px] text-slate-faint">{i.env}</span>
                <span className="font-mono text-[11px] text-slate-dim">{i.timestamp.slice(11)}</span>
              </button>
            ))}
            {active.length === 0 && (
              <div className="border border-carbon-700 bg-carbon-900 px-4 py-8 text-center font-mono text-sm text-slate-dim">
                Sin incidentes activos — todos los ambientes sincronizados.
              </div>
            )}
          </div>
        </div>

        {/* Pending diffs summary */}
        <div>
          <SectionLabel>Diferencias por sincronizar · {totalDiffs}</SectionLabel>
          <div className="border border-carbon-700 bg-carbon-900">
            {pendingObjs.map((o) => (
              <div key={o.name} className="flex items-center gap-3 border-b border-carbon-800 px-4 py-2.5 last:border-b-0">
                <StatusDot status={o.status} />
                <span className="flex-1 font-mono text-[13px] text-slate-txt">{o.name}</span>
                <span className="font-mono text-[11px] text-slate-faint">{o.library}</span>
              </div>
            ))}
            <button
              onClick={() => setView("comparador")}
              className="w-full border-t border-carbon-700 bg-carbon-850 px-4 py-2.5 text-center font-mono text-[12px] tracking-wide text-phosphor transition-colors hover:bg-carbon-800"
            >
              Abrir comparador de objetos →
            </button>
          </div>
        </div>
      </div>

      {/* Recent passes — shared traceability */}
      <div className="mt-8">
        <SectionLabel>Últimos pases</SectionLabel>
        <div className="border border-carbon-700 bg-carbon-900">
          {passes.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => setView("timeline")}
              className="flex w-full items-center gap-4 border-b border-carbon-800 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-carbon-850"
            >
              <span className="font-mono text-[12px] text-slate-faint">{p.id}</span>
              <span className="font-mono text-[12px] text-slate-dim">
                {p.from}→{p.to}
              </span>
              <span className="flex-1 truncate font-mono text-[11px] text-slate-faint">{p.objects.join(", ")}</span>
              {p.linkedIncident && <span className="font-mono text-[11px] text-alarm">{p.linkedIncident}</span>}
              <PassStatusBadge status={p.status} />
              <span className="font-mono text-[11px] text-slate-faint">{p.date.slice(0, 10)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module shortcuts */}
      <div className="mt-8 grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
        <ModuleCard
          glyph="⇄"
          title="Comparador de objetos"
          desc="Compara DEV, QA y PROD lado a lado. Detecta diferencias y dependencias rotas antes de un pase a producción."
          action="Entrar al comparador"
          onClick={() => setView("comparador")}
        />
        <ModuleCard
          glyph="◈"
          title="Centro de incidentes"
          desc="Joblogs crudos traducidos a lenguaje de negocio, origen probable vinculado a pases recientes y acciones de remediación con doble verificación."
          action="Entrar al centro de incidentes"
          onClick={() => setView("incidentes")}
        />
      </div>
    </div>
  );
}

function Metric({ label, value, tone, mono }: { label: string; value: string | number; tone?: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-wider text-slate-faint uppercase">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono text-[12px]" : "font-mono text-lg font-600"}`} style={{ color: tone ?? "var(--color-slate-txt)" }}>
        {value}
      </div>
    </div>
  );
}

function ModuleCard({
  glyph,
  title,
  desc,
  action,
  onClick,
}: {
  glyph: string;
  title: string;
  desc: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start border border-carbon-700 bg-carbon-900 p-6 text-left transition-colors hover:border-phosphor-dim hover:bg-carbon-850"
    >
      <span className="font-mono text-2xl text-phosphor phosphor-text">{glyph}</span>
      <h3 className="mt-3 text-lg font-600 text-slate-txt">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-dim">{desc}</p>
      <span className="mt-4 font-mono text-[12px] tracking-wide text-phosphor group-hover:underline">{action} →</span>
    </button>
  );
}
