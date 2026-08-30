import { useMemo, useRef, useState } from "react";
import { compareObjects, objectHistory } from "../data";
import type { CompareObject, EnvId, EnvVersion } from "../data";
import { StatusDot, SectionLabel, SeverityBadge } from "./primitives";

const originId: EnvId = "DEV";

/* Estado de un objeto respecto al destino */
function statusVsDest(o: CompareObject, dest: EnvId): "sync" | "diff" | "missing" {
  const d = o.versions[dest];
  if (!d.present) return "missing";
  return d.rev === o.versions[originId].rev ? "sync" : "diff";
}

/* Orden recomendado: dependencias primero, *FILE antes de *PGM */
function compileOrder(objs: CompareObject[]): CompareObject[] {
  const byName = new Map(objs.map((o) => [o.name, o]));
  const visited = new Set<string>();
  const out: CompareObject[] = [];
  const visit = (o: CompareObject) => {
    if (visited.has(o.name)) return;
    visited.add(o.name);
    o.deps
      .map((d) => byName.get(d))
      .filter((d): d is CompareObject => !!d)
      .forEach(visit);
    out.push(o);
  };
  // *FILE primero como semilla estable
  [...objs].sort((a, b) => Number(b.type.includes("FILE")) - Number(a.type.includes("FILE"))).forEach(visit);
  return out;
}

const DEFAULT_LIST = ["ORDVAL01", "ORDHDR", "CUSTMAST", "INVRPT02"];

export default function Comparator({
  selectedName,
  setSelectedName,
  onOpenHistory,
}: {
  selectedName: string;
  setSelectedName: (n: string) => void;
  onOpenHistory: (n: string) => void;
}) {
  const [dest, setDest] = useState<EnvId>("PROD");
  const [passList, setPassList] = useState<string[]>(DEFAULT_LIST);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pkgId, setPkgId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const objs = useMemo(
    () => passList.map((n) => compareObjects.find((o) => o.name === n)).filter((o): o is CompareObject => !!o),
    [passList],
  );
  const selected = objs.find((o) => o.name === selectedName) ?? objs[0] ?? compareObjects[0];

  const addToPass = (name: string) => {
    if (!passList.includes(name)) setPassList((l) => [...l, name]);
  };
  const removeFromPass = (name: string) => setPassList((l) => l.filter((n) => n !== name));

  const applyNames = (names: string[]) => {
    const normalized = [...new Set(names.map((n) => n.trim().toUpperCase()).filter(Boolean))];
    const valid = normalized.filter((n) => compareObjects.some((o) => o.name === n));
    const unknown = normalized.filter((n) => !compareObjects.some((o) => o.name === n));
    if (valid.length) setPassList(valid);
    if (unknown.length) {
      setApiError(`La maqueta actual no tiene metadatos demo para: ${unknown.join(", ")}. Laravel sí recibió la lista y quedará lista para IBM i real.`);
    } else {
      setApiError(null);
    }
  };

  const parseWithLaravel = async (body: FormData) => {
    const res = await fetch("/api/passes/parse-list", { method: "POST", body });
    if (!res.ok) throw new Error("No se pudo procesar la lista en Laravel.");
    const json = await res.json();
    return (json.objects ?? []).map((o: { name: string }) => o.name);
  };

  const applyPaste = async () => {
    setBusy(true);
    try {
      const body = new FormData();
      body.append("text", pasteText);
      const names = await parseWithLaravel(body);
      applyNames(names);
    } catch {
      applyNames(pasteText.split(/[\s,;\n]+/));
    } finally {
      setBusy(false);
      setPasteOpen(false);
      setPasteText("");
    }
  };

  const loadFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setApiError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const names = await parseWithLaravel(body);
      applyNames(names);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "No se pudo cargar la lista.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generate = async () => {
    setBusy(true);
    setApiError(null);
    try {
      const res = await fetch("/api/passes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ origin: originId, destination: dest, operator: "R.MARTÍNEZ", objects: passList }),
      });
      if (!res.ok) throw new Error("Laravel no pudo registrar el paquete de pase.");
      const json = await res.json();
      setPkgId(json.package?.code ?? null);
    } catch {
      const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
      setPkgId(`PASS-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${seq}`);
      setApiError("Se generó en modo local; ejecuta las migraciones de Laravel para guardar trazabilidad en base de datos.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-8">
      {/* Toolbar de pase */}
      <PassToolbar
        dest={dest}
        setDest={setDest}
        count={objs.length}
        onLoad={() => fileInputRef.current?.click()}
        onPaste={() => setPasteOpen(true)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.xls,.xlsx"
        className="hidden"
        onChange={(e) => loadFile(e.target.files?.[0])}
      />
      {apiError && (
        <div className="mt-3 border border-amber-dim bg-amber-warn/10 px-4 py-2 font-mono text-[11px] text-amber-warn">
          {apiError}
        </div>
      )}
      {busy && (
        <div className="mt-2 font-mono text-[11px] tracking-wider text-phosphor">Procesando con Laravel…</div>
      )}

      <div className="mt-6 grid grid-cols-[1.15fr_1fr] gap-6 max-[1100px]:grid-cols-1">
        {/* Tabla del pase */}
        <div>
          <SectionLabel>Objetos del pase · {originId} → {dest}</SectionLabel>
          <PassTable objs={objs} dest={dest} selected={selected} onSelect={(o) => setSelectedName(o.name)} onRemove={removeFromPass} />
        </div>

        {/* Panel de detalle con pestañas */}
        <div>
          <SectionLabel>Detalle · comparación tri-ambiente</SectionLabel>
          {selected ? (
            <DetailPanel obj={selected} dest={dest} inPass={passList} onAddDep={addToPass} onOpenHistory={onOpenHistory} />
          ) : (
            <div className="border border-carbon-700 bg-carbon-900 px-5 py-10 text-center font-mono text-sm text-slate-dim">
              El pase está vacío. Carga o pega una lista de objetos.
            </div>
          )}
        </div>
      </div>

      {/* Orden de compilación + resumen */}
      {objs.length > 0 && (
        <BottomSummary objs={objs} dest={dest} onGenerate={generate} />
      )}

      {pasteOpen && (
        <PasteDialog
          text={pasteText}
          setText={setPasteText}
          onApply={applyPaste}
          onClose={() => setPasteOpen(false)}
        />
      )}
      {pkgId && <PackageResult id={pkgId} objs={objs} dest={dest} onClose={() => setPkgId(null)} />}
    </div>
  );
}

/* ─────────────── Toolbar ─────────────── */
function PassToolbar({
  dest,
  setDest,
  count,
  onLoad,
  onPaste,
}: {
  dest: EnvId;
  setDest: (e: EnvId) => void;
  count: number;
  onLoad: () => void;
  onPaste: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border border-carbon-700 bg-carbon-900 px-5 py-4">
      <Field label="Origen">
        <div className="flex items-center gap-2 border border-phosphor-dim bg-phosphor-glow px-3 py-1.5">
          <span className="h-2 w-2 bg-phosphor" style={{ boxShadow: "0 0 6px var(--color-phosphor)" }} />
          <span className="font-mono text-sm font-600 text-phosphor">DEV</span>
        </div>
      </Field>

      <span className="pb-2 font-mono text-lg text-slate-faint">→</span>

      <Field label="Destino">
        <div className="flex">
          {(["QA", "PROD"] as EnvId[]).map((e) => (
            <button
              key={e}
              onClick={() => setDest(e)}
              className={`border px-4 py-1.5 font-mono text-sm font-600 transition-colors ${
                dest === e
                  ? e === "PROD"
                    ? "border-alarm bg-alarm/15 text-alarm"
                    : "border-amber-dim bg-amber-warn/10 text-amber-warn"
                  : "border-carbon-700 text-slate-dim hover:border-carbon-600"
              } ${e === "QA" ? "border-r-0" : ""}`}
            >
              {e}
            </button>
          ))}
        </div>
      </Field>

      <div className="ml-auto flex items-end gap-3">
        <button
          onClick={onLoad}
          className="border border-carbon-600 px-4 py-2 font-mono text-[13px] text-slate-txt transition-colors hover:border-phosphor-dim hover:text-phosphor"
        >
          Cargar lista de objetos
        </button>
        <button
          onClick={onPaste}
          className="border border-carbon-600 px-4 py-2 font-mono text-[13px] text-slate-txt transition-colors hover:border-phosphor-dim hover:text-phosphor"
        >
          Pegar lista
        </button>
        <Field label="Cargados">
          <div className="flex items-center gap-2 border border-carbon-700 bg-carbon-950 px-3 py-1.5">
            <span className="font-mono text-lg font-700 text-phosphor">{count}</span>
            <span className="font-mono text-[11px] text-slate-faint uppercase">objetos</span>
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-slate-faint uppercase">{label}</div>
      {children}
    </div>
  );
}

/* ─────────────── Tabla ─────────────── */
const cellTone: Record<"sync" | "diff" | "missing", { color: string; label: string }> = {
  sync: { color: "var(--color-phosphor)", label: "IGUAL" },
  diff: { color: "var(--color-amber-warn)", label: "DIFERENTE" },
  missing: { color: "var(--color-alarm)", label: "NO EXISTE" },
};

function EnvCell({ v, tone }: { v: EnvVersion; tone?: "sync" | "diff" | "missing" }) {
  if (!v.present)
    return (
      <span className="flex h-full items-center justify-center font-mono text-[11px] text-alarm">— no existe</span>
    );
  const color = tone ? cellTone[tone].color : "var(--color-slate-txt)";
  return (
    <span className="flex h-full flex-col items-center justify-center leading-tight">
      <span className="font-mono text-[12px]" style={{ color }}>
        {v.rev}
      </span>
      <span className="font-mono text-[9px] text-slate-faint">{v.changed.slice(5, 10)}</span>
    </span>
  );
}

function PassTable({
  objs,
  dest,
  selected,
  onSelect,
  onRemove,
}: {
  objs: CompareObject[];
  dest: EnvId;
  selected: CompareObject | undefined;
  onSelect: (o: CompareObject) => void;
  onRemove: (name: string) => void;
}) {
  const cols = "grid-cols-[1.3fr_0.8fr_0.8fr_52px_52px_52px_92px_22px]";
  return (
    <div className="border border-carbon-700 bg-carbon-900">
      <div className={`grid ${cols} items-center gap-1.5 border-b border-carbon-700 bg-carbon-850 px-3 py-2`}>
        {["OBJETO", "TIPO", "BIBLIOTECA", "DEV", "QA", "PROD", "ESTADO", ""].map((h) => (
          <span key={h} className="text-center font-mono text-[10px] tracking-wider text-slate-faint uppercase first:text-left">
            {h}
          </span>
        ))}
      </div>
      {objs.length === 0 && (
        <div className="px-4 py-8 text-center font-mono text-sm text-slate-dim">Sin objetos en el pase.</div>
      )}
      {objs.map((o) => {
        const st = statusVsDest(o, dest);
        const active = selected?.name === o.name;
        return (
          <div
            key={o.name}
            className={`grid ${cols} items-stretch gap-1.5 border-l-2 border-b border-carbon-800 px-3 py-2 transition-colors last:border-b-0 ${
              active ? "border-l-phosphor bg-carbon-850" : "border-l-transparent hover:bg-carbon-850"
            }`}
          >
            <button onClick={() => onSelect(o)} className="min-w-0 text-left">
              <span className="block truncate font-mono text-[13px] text-slate-txt">{o.name}</span>
            </button>
            <span className="flex items-center justify-center font-mono text-[11px] text-slate-dim">{o.type.replace(/ .*/, "")}</span>
            <span className="flex items-center justify-center font-mono text-[11px] text-slate-dim">{o.library}</span>
            <EnvCell v={o.versions.DEV} tone="sync" />
            <EnvCell v={o.versions.QA} tone={dest === "QA" ? st : o.versions.QA.rev === o.versions.DEV.rev ? "sync" : "diff"} />
            <EnvCell v={o.versions.PROD} tone={dest === "PROD" ? st : o.versions.PROD.present ? (o.versions.PROD.rev === o.versions.DEV.rev ? "sync" : "diff") : "missing"} />
            <span className="flex items-center justify-center">
              <span
                className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] font-600 ${st === "missing" ? "pulse-alarm" : ""}`}
                style={{ color: cellTone[st].color, borderColor: cellTone[st].color }}
              >
                {cellTone[st].label}
              </span>
            </span>
            <button
              onClick={() => onRemove(o.name)}
              title="Quitar del pase"
              className="flex items-center justify-center font-mono text-[13px] text-slate-faint transition-colors hover:text-alarm"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────── Panel de detalle con pestañas ─────────────── */
type Tab = "RESUMEN" | "METADATOS" | "DEPENDENCIAS" | "HISTORIAL";
const TABS: Tab[] = ["RESUMEN", "METADATOS", "DEPENDENCIAS", "HISTORIAL"];
const envIds: EnvId[] = ["DEV", "QA", "PROD"];

function DetailPanel({
  obj,
  dest,
  inPass,
  onAddDep,
  onOpenHistory,
}: {
  obj: CompareObject;
  dest: EnvId;
  inPass: string[];
  onAddDep: (name: string) => void;
  onOpenHistory: (name: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("RESUMEN");
  const st = statusVsDest(obj, dest);

  return (
    <div className="border border-carbon-700 bg-carbon-900">
      <div className="flex items-center justify-between gap-3 border-b border-carbon-700 px-5 py-3">
        <div>
          <h2 className="font-mono text-lg font-700 text-slate-txt">
            {obj.library}/{obj.name}
          </h2>
          <div className="mt-0.5 font-mono text-[11px] text-slate-faint">{obj.type}</div>
        </div>
        <StatusDot status={st} withLabel />
      </div>

      {/* Pestañas */}
      <div className="flex border-b border-carbon-700">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 font-mono text-[11px] tracking-wider transition-colors ${
              tab === t ? "border-phosphor text-phosphor" : "border-transparent text-slate-faint hover:text-slate-dim"
            }`}
          >
            {t}
            {t === "DEPENDENCIAS" && obj.deps.some((d) => !compareObjects.find((o) => o.name === d)?.versions[dest].present) && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 bg-alarm align-middle" />
            )}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "RESUMEN" && <ResumenTab obj={obj} dest={dest} />}
        {tab === "METADATOS" && <MetadatosTab obj={obj} />}
        {tab === "DEPENDENCIAS" && <DependenciasTab obj={obj} dest={dest} inPass={inPass} onAddDep={onAddDep} />}
        {tab === "HISTORIAL" && <HistorialTab obj={obj} onOpenHistory={onOpenHistory} />}
      </div>
    </div>
  );
}

/* Compara fechas de compilación y marca la más antigua */
function olderFlags(obj: CompareObject) {
  const dates = envIds
    .filter((e) => obj.versions[e].present)
    .map((e) => ({ e, t: new Date(obj.versions[e].compiled ?? obj.versions[e].changed).getTime() }));
  const newest = Math.max(...dates.map((d) => d.t));
  const flags: Record<string, boolean> = {};
  dates.forEach((d) => (flags[d.e] = d.t < newest));
  return flags;
}

function ResumenTab({ obj, dest }: { obj: CompareObject; dest: EnvId }) {
  const older = olderFlags(obj);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-slate-txt">{obj.description}</p>

      {obj.status === "missing" && (
        <div className="flex items-start gap-3 border border-alarm-dim bg-alarm/10 px-4 py-2.5">
          <span className="pulse-alarm font-mono text-alarm">!</span>
          <span className="text-[13px] text-slate-txt">{obj.missingDep}</span>
        </div>
      )}

      <div>
        <Label>Fecha de compilación por ambiente</Label>
        <div className="mt-2 flex flex-col gap-1.5">
          {envIds.map((e) => {
            const v = obj.versions[e];
            const isDest = e === dest;
            return (
              <div
                key={e}
                className="flex items-center gap-3 border px-3 py-2"
                style={{ borderColor: older[e] ? "var(--color-amber-dim)" : "var(--color-carbon-800)", backgroundColor: isDest ? "var(--color-carbon-850)" : "var(--color-carbon-950)" }}
              >
                <span className="w-12 font-mono text-[12px] font-600 text-slate-dim">{e}:</span>
                <span className="font-mono text-[13px] text-slate-txt">
                  {v.present ? (v.compiled ?? v.changed) : "— no existe"}
                </span>
                {older[e] && (
                  <span className="ml-auto pulse-alarm font-mono text-[11px] font-700 tracking-wider text-amber-warn">
                    ⚠ MÁS ANTIGUO
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {obj.diff.length > 0 && (
        <div>
          <Label>Diferencias de código</Label>
          <pre className="scanlines mt-2 overflow-x-auto border border-carbon-700 bg-carbon-950 px-3 py-2.5 font-mono text-[12px] leading-relaxed">
            {obj.diff.map((d, i) => (
              <div key={i} className="whitespace-pre" style={{ color: d.sign === "+" ? "var(--color-phosphor)" : d.sign === "-" ? "var(--color-alarm)" : "var(--color-amber-warn)" }}>
                <span className="mr-2 select-none text-slate-faint">[{d.env}]</span>
                {d.sign} {d.text}
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function MetadatosTab({ obj }: { obj: CompareObject }) {
  const older = olderFlags(obj);
  const rows: { k: string; get: (v: EnvVersion) => string }[] = [
    { k: "Nombre", get: () => obj.name },
    { k: "Tipo", get: () => obj.type },
    { k: "Biblioteca", get: () => obj.library },
    { k: "Atributo", get: (v) => v.attribute ?? "—" },
    { k: "Tamaño", get: (v) => v.size },
    { k: "Creación", get: (v) => v.created ?? "—" },
    { k: "Compilación", get: (v) => v.compiled ?? "—" },
    { k: "Propietario", get: (v) => v.owner ?? "—" },
  ];
  return (
    <div>
      <div className="grid grid-cols-[110px_repeat(3,1fr)] border border-carbon-800">
        <div className="border-b border-carbon-800 bg-carbon-850 px-3 py-2 font-mono text-[10px] tracking-wider text-slate-faint uppercase">
          Campo
        </div>
        {envIds.map((e) => (
          <div key={e} className="border-b border-l border-carbon-800 bg-carbon-850 px-3 py-2 text-center font-mono text-[11px] font-600 text-slate-dim">
            {e}
            {older[e] && <span className="ml-1 text-amber-warn">⚠</span>}
          </div>
        ))}
        {rows.map((r) => (
          <Row key={r.k} label={r.k}>
            {envIds.map((e) => {
              const v = obj.versions[e];
              const val = v.present ? r.get(v) : "—";
              const isDateOld = (r.k === "Compilación" || r.k === "Creación") && older[e] && v.present;
              return (
                <div
                  key={e}
                  className="border-l border-carbon-800 px-3 py-2 text-center font-mono text-[12px]"
                  style={{ color: !v.present ? "var(--color-alarm)" : isDateOld ? "var(--color-amber-warn)" : "var(--color-slate-txt)" }}
                >
                  {v.present ? val : "no existe"}
                </div>
              );
            })}
          </Row>
        ))}
      </div>
      <div className="mt-3 border border-carbon-800 bg-carbon-950 px-3 py-2.5">
        <Label>Descripción</Label>
        <p className="mt-1 text-[13px] text-slate-txt">{obj.description}</p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-carbon-800 px-3 py-2 font-mono text-[11px] text-slate-dim">{label}</div>
      <div className="col-span-3 grid grid-cols-3 border-b border-carbon-800">{children}</div>
    </>
  );
}

function DependenciasTab({
  obj,
  dest,
  inPass,
  onAddDep,
}: {
  obj: CompareObject;
  dest: EnvId;
  inPass: string[];
  onAddDep: (name: string) => void;
}) {
  if (obj.deps.length === 0)
    return <div className="py-6 text-center font-mono text-[13px] text-slate-dim">Este objeto no declara dependencias.</div>;

  return (
    <div className="flex flex-col gap-2">
      {obj.deps.map((name) => {
        const dep = compareObjects.find((o) => o.name === name);
        const present = dep?.versions[dest].present ?? false;
        const included = inPass.includes(name);
        return (
          <div
            key={name}
            className="flex items-center gap-3 border px-3 py-2.5"
            style={{ borderColor: present ? "var(--color-carbon-800)" : "var(--color-alarm-dim)", backgroundColor: present ? "var(--color-carbon-950)" : "rgba(255,77,77,0.08)" }}
          >
            <StatusDot status={present ? "sync" : "missing"} />
            <div className="flex-1">
              <span className="font-mono text-[13px] text-slate-txt">{dep?.library}/{name}</span>
              <span className="ml-2 font-mono text-[10px] text-slate-faint">{dep?.type}</span>
            </div>
            {present ? (
              <span className="font-mono text-[11px] text-phosphor">presente en {dest}</span>
            ) : included ? (
              <span className="font-mono text-[11px] text-amber-warn">agregada al pase</span>
            ) : (
              <button
                onClick={() => onAddDep(name)}
                className="pulse-alarm border border-amber-dim bg-amber-warn/10 px-2.5 py-1 font-mono text-[11px] font-600 text-amber-warn transition-colors hover:bg-amber-warn/20"
              >
                + Agregar dependencia al pase
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HistorialTab({ obj, onOpenHistory }: { obj: CompareObject; onOpenHistory: (n: string) => void }) {
  const history = objectHistory[obj.name] ?? [];
  return (
    <div>
      <div className="flex flex-col">
        {history.map((h, i) => (
          <div key={i} className="relative border-l border-carbon-700 pb-4 pl-4 last:pb-0">
            <span className="absolute -left-[4px] top-1 h-2 w-2 bg-phosphor" />
            <div className="font-mono text-[11px] text-slate-faint">{h.date} · {h.env} · {h.rev}</div>
            <div className="text-[13px] text-slate-txt">{h.event}</div>
            <div className="font-mono text-[10px] text-slate-faint">por {h.who}</div>
          </div>
        ))}
        {history.length === 0 && <div className="py-4 font-mono text-[13px] text-slate-dim">Sin historial registrado.</div>}
      </div>
      <button
        onClick={() => onOpenHistory(obj.name)}
        className="mt-4 border border-carbon-600 px-3 py-1.5 font-mono text-[12px] text-phosphor transition-colors hover:border-phosphor-dim"
      >
        Ver historia completa →
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[10px] tracking-[0.18em] text-slate-faint uppercase">{children}</div>;
}

/* ─────────────── Resumen inferior + orden de compilación ─────────────── */
function computeMetrics(objs: CompareObject[], dest: EnvId) {
  const solicitados = objs.length;
  const actualizar = objs.filter((o) => statusVsDest(o, dest) === "diff").length;
  const inexistentes = objs.filter((o) => statusVsDest(o, dest) === "missing").length;
  const faltantes = new Set<string>();
  objs.forEach((o) =>
    o.deps.forEach((d) => {
      const dep = compareObjects.find((x) => x.name === d);
      if (dep && !dep.versions[dest].present && !objs.some((x) => x.name === d)) faltantes.add(d);
    }),
  );
  const risk: "bajo" | "medio" | "alto" =
    faltantes.size > 0 || inexistentes > 0 ? "alto" : actualizar > 0 && dest === "PROD" ? "medio" : actualizar > 0 ? "medio" : "bajo";
  return { solicitados, actualizar, inexistentes, faltantes: [...faltantes], risk };
}

function BottomSummary({ objs, dest, onGenerate }: { objs: CompareObject[]; dest: EnvId; onGenerate: () => void }) {
  const m = computeMetrics(objs, dest);
  // incluir dependencias faltantes en el orden para reflejar el paquete real
  const withDeps = [...objs];
  m.faltantes.forEach((d) => {
    const dep = compareObjects.find((o) => o.name === d);
    if (dep) withDeps.push(dep);
  });
  const order = compileOrder(withDeps);

  return (
    <div className="mt-8 grid grid-cols-[1.1fr_1fr] gap-6 max-[1100px]:grid-cols-1">
      <div>
        <SectionLabel>Orden recomendado de compilación</SectionLabel>
        <div className="border border-carbon-700 bg-carbon-900">
          {order.map((o, i) => {
            const isFaltante = m.faltantes.includes(o.name);
            return (
              <div key={o.name} className="flex items-center gap-3 border-b border-carbon-800 px-4 py-2 last:border-b-0">
                <span className="font-mono text-[13px] text-slate-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="w-4 text-center font-mono text-[11px]" style={{ color: o.type.includes("FILE") ? "var(--color-phosphor)" : "var(--color-amber-warn)" }}>
                  {o.type.includes("FILE") ? "▤" : "▸"}
                </span>
                <span className="flex-1 font-mono text-[13px] text-slate-txt">{o.name}</span>
                <span className="font-mono text-[11px] text-slate-faint">{o.type.replace(/ .*/, "")}</span>
                {isFaltante && <span className="font-mono text-[10px] text-amber-warn">dependencia</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Resumen del pase</SectionLabel>
        <div className="border border-carbon-700 bg-carbon-900 p-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Objetos solicitados" value={m.solicitados} />
            <Stat label="Objetos a actualizar" value={m.actualizar} tone="var(--color-amber-warn)" />
            <Stat label="Objetos inexistentes" value={m.inexistentes} tone={m.inexistentes ? "var(--color-alarm)" : undefined} />
            <Stat label="Dependencias faltantes" value={m.faltantes.length} tone={m.faltantes.length ? "var(--color-alarm)" : undefined} />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-carbon-700 pt-4">
            <span className="font-mono text-[11px] tracking-wider text-slate-faint uppercase">Nivel de riesgo</span>
            <SeverityBadge level={m.risk} />
          </div>

          {m.faltantes.length > 0 && (
            <div className="mt-3 flex items-start gap-2 border border-amber-dim bg-amber-warn/10 px-3 py-2">
              <span className="font-mono text-amber-warn">!</span>
              <span className="text-[12px] text-slate-txt">
                Faltan dependencias en {dest}: <span className="font-mono text-amber-warn">{m.faltantes.join(", ")}</span>. Se
                incluirán en el orden de compilación.
              </span>
            </div>
          )}

          <button
            onClick={onGenerate}
            className="mt-5 w-full border border-phosphor-dim bg-phosphor-glow px-4 py-3 font-mono text-sm font-700 tracking-wide text-phosphor transition-colors hover:bg-phosphor/15"
          >
            VALIDAR Y GENERAR PAQUETE DE PASE →
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border border-carbon-800 bg-carbon-950 px-3 py-2.5">
      <div className="font-mono text-2xl font-700" style={{ color: tone ?? "var(--color-slate-txt)" }}>
        {value}
      </div>
      <div className="mt-0.5 font-mono text-[10px] tracking-wider text-slate-faint uppercase">{label}</div>
    </div>
  );
}

/* ─────────────── Diálogos ─────────────── */
function PasteDialog({
  text,
  setText,
  onApply,
  onClose,
}: {
  text: string;
  setText: (s: string) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-950/80 px-6" onClick={onClose}>
      <div className="w-full max-w-[520px] border border-carbon-600 bg-carbon-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-carbon-700 px-5 py-3">
          <span className="font-mono text-sm font-700 text-slate-txt">PEGAR LISTA DE OBJETOS</span>
          <button onClick={onClose} className="font-mono text-slate-faint hover:text-slate-txt">✕</button>
        </div>
        <div className="px-5 py-4">
          <p className="mb-2 font-mono text-[11px] text-slate-faint">
            Un objeto por línea (o separados por coma / espacio). Ej: ORDVAL01, PCTLOOKUP, ORDHDR
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            autoFocus
            placeholder={"ORDVAL01\nPCTLOOKUP\nORDHDR\nCUSTMAST"}
            className="scanlines w-full resize-none border border-carbon-700 bg-carbon-950 px-3 py-2.5 font-mono text-[13px] text-phosphor placeholder:text-slate-faint focus:border-phosphor-dim focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-carbon-700 px-5 py-3">
          <button onClick={onClose} className="border border-carbon-600 px-4 py-2 font-mono text-sm text-slate-dim hover:text-slate-txt">
            Cancelar
          </button>
          <button onClick={onApply} className="border border-phosphor-dim bg-phosphor-glow px-4 py-2 font-mono text-sm font-600 text-phosphor hover:bg-phosphor/15">
            Cargar objetos
          </button>
        </div>
      </div>
    </div>
  );
}

function PackageResult({ id, objs, dest, onClose }: { id: string; objs: CompareObject[]; dest: EnvId; onClose: () => void }) {
  const m = computeMetrics(objs, dest);
  const withDeps = [...objs];
  m.faltantes.forEach((d) => {
    const dep = compareObjects.find((o) => o.name === d);
    if (dep) withDeps.push(dep);
  });
  const order = compileOrder(withDeps);
  const [authorized, setAuthorized] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-carbon-950/85 px-6 py-10" onClick={onClose}>
      <div className="w-full max-w-[680px] border border-carbon-600 bg-carbon-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-carbon-700 px-5 py-3">
          <div>
            <div className="font-mono text-[11px] tracking-wider text-slate-faint uppercase">Paquete de pase generado</div>
            <div className="mt-0.5 font-mono text-lg font-700 text-phosphor phosphor-text">{id}</div>
          </div>
          <button onClick={onClose} className="font-mono text-slate-faint hover:text-slate-txt">✕</button>
        </div>

        <div className="flex items-center gap-3 border-b border-carbon-700 px-5 py-2.5 font-mono text-[12px] text-slate-dim">
          <span>DEV → {dest}</span>
          <span className="ml-auto">Riesgo:</span>
          <SeverityBadge level={m.risk} />
        </div>

        <div className="px-5 py-4">
          <Label>Orden de compilación · {order.length} objetos</Label>
          <div className="mt-2 border border-carbon-700">
            {order.map((o, i) => (
              <div key={o.name} className="flex items-center gap-3 border-b border-carbon-800 px-4 py-2 last:border-b-0">
                <span className="font-mono text-[12px] text-slate-faint">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-mono text-[13px] text-slate-txt">{o.library}/{o.name}</span>
                <span className="font-mono text-[11px] text-slate-faint">{o.type.replace(/ .*/, "")}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Label>Script generado</Label>
            <pre className="scanlines mt-2 overflow-x-auto border border-carbon-700 bg-carbon-950 px-3 py-3 font-mono text-[12px] leading-relaxed text-phosphor phosphor-text">
{`/* ${id} · generado por Catracho MayaTech Ops Console */
/* DEV -> ${dest} */
STRCMTCTL LCKLVL(*ALL)
${order.map((o) => `RSTOBJ OBJ(${o.name}) SAVLIB(${o.library}) DEV(*SAVF) OBJTYPE(*ALL)`).join("\n")}
ENDCMTCTL`}
            </pre>
          </div>
        </div>

        <div className="border-t border-carbon-700 px-5 py-3">
          {authorized ? (
            <div className="border border-phosphor-dim bg-phosphor-glow px-4 py-3">
              <div className="flex items-center gap-2 font-mono text-sm text-phosphor">
                <span>✓</span> {id} autorizado y registrado en la línea de pases
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-dim">
                Firma: R.MARTÍNEZ (*SECADM) · trazabilidad activa para vincular incidentes futuros.
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="border border-carbon-600 px-4 py-2 font-mono text-sm text-slate-dim hover:text-slate-txt">
                Cerrar
              </button>
              <button className="border border-carbon-600 px-4 py-2 font-mono text-sm text-slate-txt hover:border-phosphor-dim hover:text-phosphor">
                Descargar script (.CLLE)
              </button>
              <button
                onClick={() => setAuthorized(true)}
                className="border border-phosphor-dim px-4 py-2 font-mono text-sm font-700 tracking-wide"
                style={{ backgroundColor: "var(--color-phosphor)", color: "var(--color-carbon-950)" }}
              >
                Autorizar pase
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
