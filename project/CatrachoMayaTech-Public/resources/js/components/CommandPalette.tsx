import { useEffect, useMemo, useRef, useState } from "react";
import { compareObjects, incidents, passes } from "../data";
import type { View } from "./Sidebar";

type Result =
  | { kind: "objeto"; id: string; label: string; meta: string }
  | { kind: "incidente"; id: string; label: string; meta: string }
  | { kind: "pase"; id: string; label: string; meta: string };

export default function CommandPalette({
  open,
  onClose,
  setView,
  onOpenObject,
  selectIncident,
}: {
  open: boolean;
  onClose: () => void;
  setView: (v: View) => void;
  onOpenObject: (name: string) => void;
  selectIncident: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    const out: Result[] = [];
    for (const o of compareObjects) {
      if (!term || o.name.toLowerCase().includes(term) || o.library.toLowerCase().includes(term))
        out.push({ kind: "objeto", id: o.name, label: `${o.library}/${o.name}`, meta: o.type });
    }
    for (const i of incidents) {
      if (!term || i.id.toLowerCase().includes(term) || i.title.toLowerCase().includes(term) || i.linkedPass?.object.toLowerCase().includes(term))
        out.push({ kind: "incidente", id: i.id, label: i.title, meta: `${i.id} · ${i.env}` });
    }
    for (const p of passes) {
      if (!term || p.id.toLowerCase().includes(term) || p.objects.some((o) => o.toLowerCase().includes(term)))
        out.push({ kind: "pase", id: p.id, label: `${p.id} · ${p.from}→${p.to}`, meta: p.objects.join(", ") });
    }
    return out.slice(0, 12);
  }, [q]);

  const run = (r: Result) => {
    if (r.kind === "objeto") {
      setView("comparador");
      onOpenObject(r.id);
    } else if (r.kind === "incidente") {
      selectIncident(r.id);
      setView("incidentes");
    } else {
      setView("timeline");
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter" && results[active]) {
        e.preventDefault();
        run(results[active]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active]);

  if (!open) return null;

  const kindTone: Record<Result["kind"], string> = {
    objeto: "var(--color-phosphor)",
    incidente: "var(--color-alarm)",
    pase: "var(--color-amber-warn)",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-carbon-950/80 px-6 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-[620px] border border-carbon-600 bg-carbon-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-carbon-700 px-4 py-3">
          <span className="font-mono text-sm text-phosphor">›</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Buscar objetos, incidentes o pases…"
            className="flex-1 bg-transparent font-mono text-sm text-slate-txt placeholder:text-slate-faint focus:outline-none"
          />
          <kbd className="border border-carbon-600 px-1.5 py-0.5 font-mono text-[10px] text-slate-faint">ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <div className="px-4 py-6 text-center font-mono text-[13px] text-slate-faint">
              Sin coincidencias para "{q}".
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.id}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(r)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                i === active ? "bg-carbon-800" : ""
              }`}
            >
              <span
                className="w-[74px] shrink-0 font-mono text-[10px] tracking-wider uppercase"
                style={{ color: kindTone[r.kind] }}
              >
                {r.kind}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-slate-txt">{r.label}</span>
                <span className="block truncate font-mono text-[10px] text-slate-faint">{r.meta}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-carbon-700 px-4 py-2 font-mono text-[10px] text-slate-faint">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span className="ml-auto">aparece en los 3 módulos</span>
        </div>
      </div>
    </div>
  );
}
