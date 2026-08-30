import { compareObjects, objectHistory, passes, incidents } from "../data";
import type { EnvId } from "../data";
import { StatusDot, PassStatusBadge, SeverityBadge } from "./primitives";

const envIds: EnvId[] = ["DEV", "QA", "PROD"];

export default function ObjectHistoryModal({ name, onClose }: { name: string; onClose: () => void }) {
  const obj = compareObjects.find((o) => o.name === name);
  if (!obj) return null;

  const history = objectHistory[name] ?? [];
  const relatedPasses = passes.filter((p) => p.objects.includes(name));
  const relatedIncidents = incidents.filter(
    (i) => i.linkedPass?.object === name || i.title.includes(name) || i.raw.some((l) => l.includes(name)),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-carbon-950/85 px-6 py-10" onClick={onClose}>
      <div
        className="w-full max-w-[860px] border border-carbon-600 bg-carbon-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-carbon-700 px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <StatusDot status={obj.status} withLabel />
            </div>
            <h2 className="mt-2 font-mono text-2xl font-700 text-slate-txt">
              {obj.library}/{obj.name}
            </h2>
            <div className="mt-1 font-mono text-[12px] text-slate-faint">
              {obj.type} · {obj.size} · últ. cambio {obj.changed}
            </div>
          </div>
          <button onClick={onClose} className="font-mono text-slate-faint hover:text-slate-txt">
            ✕
          </button>
        </div>

        {obj.missingDep && (
          <div className="flex items-start gap-3 border-b border-alarm-dim bg-alarm/10 px-6 py-3">
            <span className="pulse-alarm mt-0.5 font-mono text-alarm">!</span>
            <div className="text-sm text-slate-txt">{obj.missingDep}</div>
          </div>
        )}

        <div className="grid grid-cols-[1fr_1fr] gap-px bg-carbon-700 max-[900px]:grid-cols-1">
          {/* Versions per env */}
          <div className="bg-carbon-900 p-6">
            <Label>Versiones por ambiente</Label>
            <div className="mt-3 flex flex-col gap-2">
              {envIds.map((e) => {
                const v = obj.versions[e];
                return (
                  <div key={e} className="flex items-center justify-between border border-carbon-800 bg-carbon-950 px-3 py-2">
                    <span className="font-mono text-[12px] font-600 text-slate-dim">{e}</span>
                    <span className={`font-mono text-[13px] ${v.present ? "text-slate-txt" : "text-alarm"}`}>{v.rev}</span>
                    <span className="font-mono text-[10px] text-slate-faint">{v.present ? v.changed : "ausente"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Change history */}
          <div className="bg-carbon-900 p-6">
            <Label>Historia de cambios</Label>
            <div className="mt-3 flex flex-col">
              {history.map((h, i) => (
                <div key={i} className="relative border-l border-carbon-700 pb-4 pl-4 last:pb-0">
                  <span className="absolute -left-[4px] top-1 h-2 w-2 bg-phosphor" />
                  <div className="font-mono text-[11px] text-slate-faint">
                    {h.date} · {h.env} · {h.rev}
                  </div>
                  <div className="text-[13px] text-slate-txt">{h.event}</div>
                  <div className="font-mono text-[10px] text-slate-faint">por {h.who}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related passes */}
        <div className="border-t border-carbon-700 px-6 py-5">
          <Label>Pases relacionados · {relatedPasses.length}</Label>
          <div className="mt-3 flex flex-col gap-2">
            {relatedPasses.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border border-carbon-800 bg-carbon-950 px-3 py-2">
                <span className="font-mono text-[12px] text-slate-faint">{p.id}</span>
                <span className="font-mono text-[11px] text-slate-dim">
                  {p.from}→{p.to}
                </span>
                <span className="flex-1 font-mono text-[11px] text-slate-faint">{p.date}</span>
                <PassStatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Related incidents */}
        {relatedIncidents.length > 0 && (
          <div className="border-t border-carbon-700 px-6 py-5">
            <Label>Incidentes relacionados · {relatedIncidents.length}</Label>
            <div className="mt-3 flex flex-col gap-2">
              {relatedIncidents.map((i) => (
                <div key={i.id} className="flex items-center gap-3 border border-carbon-800 bg-carbon-950 px-3 py-2">
                  <span className="font-mono text-[12px] text-slate-faint">{i.id}</span>
                  <SeverityBadge level={i.severity} />
                  <span className="flex-1 truncate text-[13px] text-slate-txt">{i.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[11px] tracking-[0.2em] text-slate-faint uppercase">{children}</div>;
}
