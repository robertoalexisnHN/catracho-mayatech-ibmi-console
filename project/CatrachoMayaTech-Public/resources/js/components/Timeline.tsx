import { passes } from "../data";
import type { Pass } from "../data";
import { PassStatusBadge, SectionLabel } from "./primitives";
import type { View as NavView } from "./Sidebar";

export default function Timeline({
  onOpenObject,
  setView,
}: {
  onOpenObject: (name: string) => void;
  setView: (v: NavView) => void;
}) {
  return (
    <div className="mx-auto max-w-[1100px] px-8 py-8">
      <SectionLabel>Línea de tiempo de pases · memoria compartida</SectionLabel>
      <p className="mb-6 max-w-[640px] text-sm leading-relaxed text-slate-dim">
        Registro cronológico de cada movimiento de objetos entre ambientes. Conecta el comparador con el centro de
        incidentes: cada pase deja rastro de quién lo autorizó, qué objetos movió y si derivó en un incidente.
      </p>

      <div className="relative pl-8">
        {/* Spine */}
        <span className="absolute left-[7px] top-2 bottom-2 w-px bg-carbon-700" />
        <div className="flex flex-col gap-4">
          {passes.map((p) => (
            <PassNode key={p.id} pass={p} onOpenObject={onOpenObject} setView={setView} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PassNode({
  pass,
  onOpenObject,
  setView,
}: {
  pass: Pass;
  onOpenObject: (name: string) => void;
  setView: (v: NavView) => void;
}) {
  const dot =
    pass.status === "exitoso"
      ? "var(--color-phosphor)"
      : pass.status === "fallido"
        ? "var(--color-alarm)"
        : pass.status === "revertido"
          ? "var(--color-amber-warn)"
          : "var(--color-slate-dim)";

  return (
    <div className="relative">
      <span
        className={`absolute -left-[27px] top-4 h-3.5 w-3.5 rounded-full border-2 border-carbon-900 ${
          pass.status === "fallido" ? "pulse-alarm" : ""
        }`}
        style={{ backgroundColor: dot, boxShadow: `0 0 8px ${dot}` }}
      />
      <div className="border border-carbon-700 bg-carbon-900 p-4" style={{ borderLeftColor: dot, borderLeftWidth: 2 }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-700 text-slate-txt">{pass.id}</span>
          <span className="flex items-center gap-1.5 font-mono text-[12px] text-slate-dim">
            {pass.from} <span className="text-phosphor">→</span> {pass.to}
          </span>
          <PassStatusBadge status={pass.status} />
          <span className="ml-auto font-mono text-[11px] text-slate-faint">{pass.date}</span>
        </div>

        <p className="mt-2.5 text-[13px] leading-relaxed text-slate-dim">{pass.note}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pass.objects.map((o) => (
            <button
              key={o}
              onClick={() => onOpenObject(o)}
              className="border border-carbon-700 bg-carbon-950 px-2 py-0.5 font-mono text-[11px] text-slate-txt transition-colors hover:border-phosphor-dim hover:text-phosphor"
            >
              {o}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-carbon-800 pt-3 font-mono text-[11px] text-slate-faint">
          <span>OPERADOR: {pass.operator}</span>
          <span>AUTORIZÓ: {pass.authorizedBy}</span>
          {pass.linkedIncident && (
            <button
              onClick={() => setView("incidentes")}
              className="ml-auto flex items-center gap-1.5 text-alarm transition-colors hover:underline"
            >
              <span className="pulse-alarm h-1.5 w-1.5 bg-alarm" />
              Derivó en {pass.linkedIncident} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
