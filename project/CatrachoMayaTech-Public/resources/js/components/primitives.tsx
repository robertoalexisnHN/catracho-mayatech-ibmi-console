import type { EnvId, Health, ObjStatus, Severity, Risk, PassStatus } from "../data";

const passMap: Record<PassStatus, { label: string; color: string }> = {
  exitoso: { label: "EXITOSO", color: "var(--color-phosphor)" },
  fallido: { label: "FALLIDO", color: "var(--color-alarm)" },
  revertido: { label: "REVERTIDO", color: "var(--color-amber-warn)" },
  pendiente: { label: "PENDIENTE", color: "var(--color-slate-dim)" },
};

export function PassStatusBadge({ status }: { status: PassStatus }) {
  const m = passMap[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] font-600 tracking-wider uppercase"
      style={{ color: m.color, border: `1px solid ${m.color}` }}
    >
      <span className={`h-1.5 w-1.5 ${status === "fallido" ? "pulse-alarm" : ""}`} style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}

/* Severity / risk badge — bajo · medio · alto · crítico */
const sevMap: Record<Severity | Risk | "critico", { label: string; fg: string; bg: string; bd: string }> = {
  bajo: { label: "RIESGO BAJO", fg: "text-phosphor", bg: "bg-phosphor-glow", bd: "border-phosphor-dim" },
  baja: { label: "SEV BAJA", fg: "text-phosphor", bg: "bg-phosphor-glow", bd: "border-phosphor-dim" },
  medio: { label: "RIESGO MEDIO", fg: "text-amber-warn", bg: "bg-amber-warn/10", bd: "border-amber-dim" },
  media: { label: "SEV MEDIA", fg: "text-amber-warn", bg: "bg-amber-warn/10", bd: "border-amber-dim" },
  alto: { label: "RIESGO ALTO", fg: "text-alarm", bg: "bg-alarm/10", bd: "border-alarm-dim" },
  alta: { label: "SEV ALTA", fg: "text-alarm", bg: "bg-alarm/10", bd: "border-alarm-dim" },
  critico: { label: "CRÍTICO", fg: "text-alarm", bg: "bg-alarm/15", bd: "border-alarm" },
  critica: { label: "CRÍTICA", fg: "text-alarm", bg: "bg-alarm/15", bd: "border-alarm" },
};

export function SeverityBadge({ level, override }: { level: Severity | Risk; override?: string }) {
  const m = sevMap[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${m.bd} ${m.bg} ${m.fg} px-2 py-0.5 font-mono text-[11px] font-600 tracking-wider uppercase`}
    >
      <span className={`h-1.5 w-1.5 ${level === "critica" ? "pulse-alarm" : ""}`} style={{ backgroundColor: "currentColor" }} />
      {override ?? m.label}
    </span>
  );
}

const healthMap: Record<Health, { color: string; label: string }> = {
  ok: { color: "var(--color-phosphor)", label: "OPERATIVO" },
  warn: { color: "var(--color-amber-warn)", label: "DIVERGENTE" },
  crit: { color: "var(--color-alarm)", label: "INCIDENTE" },
};

/* Environment health indicator */
export function EnvIndicator({
  env,
  health,
  host,
  compact,
}: {
  env: EnvId;
  health: Health;
  host?: string;
  compact?: boolean;
}) {
  const h = healthMap[health];
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`h-2.5 w-2.5 shrink-0 ${health === "crit" ? "pulse-alarm" : ""}`}
        style={{ backgroundColor: h.color, boxShadow: `0 0 8px ${h.color}` }}
      />
      <div className="leading-tight">
        <span className="font-mono text-sm font-700 tracking-wide text-slate-txt">{env}</span>
        {!compact && (
          <span className="ml-2 font-mono text-[11px] tracking-wider uppercase" style={{ color: h.color }}>
            {h.label}
          </span>
        )}
        {host && <div className="font-mono text-[11px] text-slate-faint">{host}</div>}
      </div>
    </div>
  );
}

const statusMap: Record<ObjStatus, { color: string; label: string; sym: string }> = {
  sync: { color: "var(--color-phosphor)", label: "Sincronizado", sym: "=" },
  diff: { color: "var(--color-amber-warn)", label: "Diferencia", sym: "≠" },
  missing: { color: "var(--color-alarm)", label: "Falta / dep. rota", sym: "!" },
};

export function StatusDot({ status, withLabel }: { status: ObjStatus; withLabel?: boolean }) {
  const s = statusMap[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center font-mono text-[11px] font-700 ${
          status === "missing" ? "pulse-alarm" : ""
        }`}
        style={{ color: s.color, border: `1px solid ${s.color}` }}
      >
        {s.sym}
      </span>
      {withLabel && (
        <span className="font-mono text-[11px] tracking-wide" style={{ color: s.color }}>
          {s.label}
        </span>
      )}
    </span>
  );
}

/* Terminal / joblog block */
export function TerminalBlock({ lines, title }: { lines: string[]; title?: string }) {
  return (
    <div className="border border-carbon-700 bg-carbon-950">
      <div className="flex items-center justify-between border-b border-carbon-700 bg-carbon-900 px-3 py-1.5">
        <span className="font-mono text-[11px] tracking-widest text-slate-faint uppercase">
          {title ?? "QSYSOPR · JOBLOG"}
        </span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 bg-carbon-600" />
          <span className="h-1.5 w-1.5 bg-carbon-600" />
          <span className="h-1.5 w-1.5 bg-phosphor-dim" />
        </span>
      </div>
      <pre className="scanlines overflow-x-auto px-3 py-3 font-mono text-[12.5px] leading-relaxed text-phosphor phosphor-text">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre">
            <span className="mr-3 select-none text-slate-faint">{String(i + 1).padStart(2, "0")}</span>
            {l}
          </div>
        ))}
      </pre>
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-[11px] font-600 tracking-[0.2em] text-slate-dim uppercase">{children}</span>
      <span className="h-px flex-1 bg-carbon-700" />
    </div>
  );
}
