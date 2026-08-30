import { useState } from "react";
import { incidents } from "../data";
import type { Incident } from "../data";
import { SeverityBadge, TerminalBlock, SectionLabel } from "./primitives";
import type { View } from "./Sidebar";

export default function Incidents({
  setView,
  selectedId,
  setSelectedId,
}: {
  setView: (v: View) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
}) {
  const selected = incidents.find((i) => i.id === selectedId) ?? incidents[0];
  const setSelected = (i: Incident) => setSelectedId(i.id);

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[320px_1fr] gap-6 px-8 py-8 max-[1000px]:grid-cols-1">
      {/* Incident list */}
      <div>
        <SectionLabel>Incidentes</SectionLabel>
        <div className="flex flex-col gap-2">
          {incidents.map((i) => {
            const active = i.id === selected.id;
            return (
              <button
                key={i.id}
                onClick={() => setSelected(i)}
                className={`border-l-2 border border-carbon-700 bg-carbon-900 px-4 py-3 text-left transition-colors ${
                  active ? "border-l-phosphor bg-carbon-850" : "border-l-transparent hover:bg-carbon-850"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-slate-faint">{i.id}</span>
                  <SeverityBadge level={i.severity} />
                </div>
                <div className="mt-2 text-sm leading-snug text-slate-txt">{i.title}</div>
                <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-slate-faint">
                  <span>{i.env}</span>
                  <span>·</span>
                  <span>{i.timestamp}</span>
                  <span className="ml-auto tracking-wider uppercase">{i.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <IncidentDetail incident={selected} setView={setView} />
    </div>
  );
}

function IncidentDetail({ incident, setView }: { incident: Incident; setView: (v: View) => void }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 border border-carbon-700 bg-carbon-900 p-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-slate-faint">{incident.id}</span>
            <SeverityBadge level={incident.severity} />
            <span className="border border-carbon-600 px-2 py-0.5 font-mono text-[11px] text-slate-dim">
              {incident.env} · {incident.msgId}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-600 text-slate-txt">{incident.title}</h2>
          <div className="mt-1 font-mono text-[12px] text-slate-faint">{incident.timestamp}</div>
        </div>
      </div>

      {/* Raw joblog vs business translation */}
      <div className="mt-6">
        <SectionLabel>Joblog crudo · traducción a negocio</SectionLabel>
        <div className="grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
          <TerminalBlock title={`${incident.msgId} · JOBLOG`} lines={incident.raw} />
          <div className="border border-carbon-700 bg-carbon-900 p-4">
            <div className="mb-2 font-mono text-[11px] tracking-wider text-phosphor uppercase">Qué significa</div>
            <p className="text-sm leading-relaxed text-slate-txt">{incident.translation}</p>
          </div>
        </div>
      </div>

      {/* Probable origin */}
      {incident.linkedPass && (
        <div className="mt-6">
          <SectionLabel>Origen probable</SectionLabel>
          <div className="flex items-center gap-4 border border-amber-dim bg-amber-warn/10 px-5 py-4">
            <span className="font-mono text-2xl text-amber-warn">⇄</span>
            <div className="flex-1">
              <div className="text-sm text-slate-txt">
                Vinculado al pase del{" "}
                <span className="font-mono font-600 text-amber-warn">{incident.linkedPass.date}</span>, objeto{" "}
                <span className="font-mono font-600 text-amber-warn">{incident.linkedPass.object}</span>.
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-dim">
                Correlación detectada entre el cambio desplegado y la excepción registrada.
              </div>
            </div>
            <button
              onClick={() => setView("comparador")}
              className="border border-amber-dim px-3 py-1.5 font-mono text-[12px] text-amber-warn transition-colors hover:bg-amber-warn/10"
            >
              Ver en comparador →
            </button>
          </div>
        </div>
      )}

      {/* Recommended actions */}
      <div className="mt-6">
        <SectionLabel>Acciones recomendadas</SectionLabel>
        <div className="grid grid-cols-3 gap-4 max-[1000px]:grid-cols-1">
          {incident.actions.map((a, i) => (
            <ActionCard key={i} action={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: Incident["actions"][number] }) {
  const [armed, setArmed] = useState(false);
  const [done, setDone] = useState(false);
  const tone =
    action.risk === "bajo" ? "var(--color-phosphor)" : action.risk === "medio" ? "var(--color-amber-warn)" : "var(--color-alarm)";

  return (
    <div className="flex flex-col border border-carbon-700 bg-carbon-900" style={{ borderTopColor: tone, borderTopWidth: 2 }}>
      <div className="flex flex-1 flex-col p-4">
        <SeverityBadge level={action.risk} />
        <h4 className="mt-3 text-sm font-600 leading-snug text-slate-txt">{action.title}</h4>
        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-dim">{action.desc}</p>
        <code className="mt-3 block overflow-x-auto border border-carbon-800 bg-carbon-950 px-2 py-1.5 font-mono text-[11px] text-phosphor phosphor-text">
          {action.cmd}
        </code>
      </div>

      {/* Double-verification confirm */}
      <div className="border-t border-carbon-700 p-3">
        {done ? (
          <div className="flex items-center justify-center gap-2 py-1 font-mono text-[12px] text-phosphor">
            <span>✓</span> Enviado a ejecución
          </div>
        ) : !armed ? (
          <button
            onClick={() => setArmed(true)}
            className="w-full border px-3 py-2 font-mono text-[12px] font-600 tracking-wide transition-colors"
            style={{ borderColor: tone, color: tone }}
          >
            Confirmar acción
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-center font-mono text-[10px] tracking-wider text-slate-faint uppercase">
              Afecta PROD — verificar dos veces
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setArmed(false)}
                className="flex-1 border border-carbon-600 px-2 py-2 font-mono text-[12px] text-slate-dim hover:text-slate-txt"
              >
                Cancelar
              </button>
              <button
                onClick={() => setDone(true)}
                className="flex-1 border px-2 py-2 font-mono text-[12px] font-700 tracking-wide transition-colors"
                style={{ borderColor: tone, color: "var(--color-carbon-950)", backgroundColor: tone }}
              >
                Ejecutar en PROD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
