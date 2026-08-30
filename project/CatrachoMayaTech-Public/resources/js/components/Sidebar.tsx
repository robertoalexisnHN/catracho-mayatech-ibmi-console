import { useEffect, useState } from "react";
import { environments } from "../data";
import { EnvIndicator } from "./primitives";

export type View = "dashboard" | "comparador" | "incidentes" | "timeline";

type SystemHealth = {
  source?: string;
  connected?: boolean;
  system?: string;

  subsystems?: {
    active?: number;
    total?: number;
  };

  jobsQueued?: number;

  aspUsed?: number | null;
  cpuAvg?: number | null;
  cpuAvailable?: boolean;

  operator?: {
    user?: string;
    userClass?: string;
  };

  timestamp?: string | null;
};

const nav: { id: View; label: string; sub: string; glyph: string }[] = [
  {
    id: "dashboard",
    label: "Dashboard general",
    sub: "Estado de ambientes",
    glyph: "▤",
  },
  {
    id: "comparador",
    label: "Comparador de objetos",
    sub: "DEV · QA · PROD",
    glyph: "⇄",
  },
  {
    id: "incidentes",
    label: "Centro de incidentes",
    sub: "Producción",
    glyph: "◈",
  },
  {
    id: "timeline",
    label: "Línea de pases",
    sub: "Trazabilidad",
    glyph: "≡",
  },
];

function HealthBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: string;
}) {
  const safeValue =
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
      ? null
      : Math.max(0, Math.min(100, Number(value)));

  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] text-slate-faint">
        <span className="tracking-wider uppercase">{label}</span>

        <span style={{ color: tone }}>
          {safeValue === null ? "N/D" : `${Math.round(safeValue)}%`}
        </span>
      </div>

      <div className="mt-1 h-1 bg-carbon-800">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${safeValue ?? 0}%`,
            backgroundColor: tone,
          }}
        />
      </div>
    </div>
  );
}

export default function Sidebar({
  view,
  setView,
  activeIncidents,
}: {
  view: View;
  setView: (v: View) => void;
  activeIncidents: number;
}) {
  const [systemHealth, setSystemHealth] =
    useState<SystemHealth | null>(null);

  const [systemOnline, setSystemOnline] = useState(false);

  const [loadingSystem, setLoadingSystem] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSystemHealth = async () => {
      try {
        const response = await fetch("/api/system-health", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as SystemHealth;

        if (!mounted) {
          return;
        }

        setSystemHealth(payload);

        setSystemOnline(
          payload.source === "bridge" &&
          payload.connected === true
        );

        setLoadingSystem(false);
      } catch (error) {
        if (!mounted) {
          return;
        }

        console.error(
          "No se pudo actualizar la salud del IBM i:",
          error
        );

        setSystemOnline(false);

        // Evita mostrar valores viejos como si siguieran siendo actuales.
        setSystemHealth(null);

        setLoadingSystem(false);
      }
    };

    // Primera consulta inmediatamente.
    loadSystemHealth();

    // Después vuelve a consultar IBM i cada 5 segundos.
    const interval = window.setInterval(
      loadSystemHealth,
      5000
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const activeSubsystems =
    systemHealth?.subsystems?.active;

  const totalSubsystems =
    systemHealth?.subsystems?.total;

  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col overflow-y-auto border-r border-carbon-700 bg-carbon-900">
      {/* Logo */}
      <div className="border-b border-carbon-700 px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-700 tracking-tight text-phosphor phosphor-text">
            catracho
          </span>

          <span
            className="inline-block h-4 w-2 bg-phosphor pulse-alarm"
            aria-hidden
          />
        </div>

        <div className="mt-0.5 font-mono text-lg font-700 tracking-tight text-slate-txt">
          MayaTech
        </div>

        <div className="mt-2 font-mono text-[10px] leading-relaxed tracking-[0.18em] text-slate-faint uppercase">
          Consola de Continuidad
          <br />
          Operativa · IBM i
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 py-4">
        {nav.map((n) => {
          const active = view === n.id;

          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`group flex items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors ${
                active
                  ? "border-phosphor bg-carbon-800 text-slate-txt"
                  : "border-transparent text-slate-dim hover:border-carbon-600 hover:bg-carbon-850 hover:text-slate-txt"
              }`}
            >
              <span
                className={`font-mono text-base ${
                  active
                    ? "text-phosphor"
                    : "text-slate-faint group-hover:text-slate-dim"
                }`}
              >
                {n.glyph}
              </span>

              <span className="flex-1 leading-tight">
                <span className="block text-sm font-500">
                  {n.label}
                </span>

                <span className="block font-mono text-[10px] tracking-wide text-slate-faint uppercase">
                  {n.sub}
                </span>
              </span>

              {n.id === "incidentes" &&
                activeIncidents > 0 && (
                  <span className="pulse-alarm border border-alarm bg-alarm/15 px-1.5 font-mono text-[11px] font-700 text-alarm">
                    {activeIncidents}
                  </span>
                )}
            </button>
          );
        })}
      </nav>

      {/* Environment rail */}
      <div className="mt-2 px-3">
        <div className="mb-2 px-3 font-mono text-[10px] tracking-[0.2em] text-slate-faint uppercase">
          Ambientes
        </div>

        <div className="flex flex-col gap-2.5 border-t border-carbon-700 px-3 pt-3">
          {environments.map((e) => (
            <EnvIndicator
              key={e.id}
              env={e.id}
              health={e.health}
              host={e.host}
            />
          ))}
        </div>
      </div>

      {/* System health widget */}
      <div className="mt-5 px-3">
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="font-mono text-[10px] tracking-[0.2em] text-slate-faint uppercase">
            Salud del sistema · PROD
          </span>

          <span
            className={`h-1.5 w-1.5 ${
              systemOnline ? "bg-phosphor" : "bg-alarm"
            }`}
            style={{
              boxShadow: systemOnline
                ? "0 0 6px var(--color-phosphor)"
                : "0 0 6px var(--color-alarm)",
            }}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-carbon-700 px-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-slate-dim">
              Subsistemas activos
            </span>

            <span className="font-mono text-[12px] text-phosphor">
              {loadingSystem
                ? "..."
                : activeSubsystems === undefined ||
                    totalSubsystems === undefined
                  ? "—/—"
                  : `${activeSubsystems}/${totalSubsystems}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-slate-dim">
              Jobs en cola
            </span>

            <span className="font-mono text-[12px] text-slate-txt">
              {loadingSystem
                ? "..."
                : systemHealth?.jobsQueued ?? "—"}
            </span>
          </div>

          <HealthBar
            label="Uso ASP"
            value={systemHealth?.aspUsed ?? null}
            tone="var(--color-amber-warn)"
          />

          <HealthBar
            label="CPU prom."
            value={systemHealth?.cpuAvg ?? null}
            tone="var(--color-phosphor)"
          />

          {systemHealth?.timestamp && (
            <div className="font-mono text-[9px] tracking-wide text-slate-faint">
              ACT. {systemHealth.timestamp}
            </div>
          )}
        </div>
      </div>

      {/* Operator footer */}
      <div className="mt-auto border-t border-carbon-700 px-5 py-4">
        <div className="font-mono text-[11px] text-slate-dim">
          OPERADOR:{" "}
          {systemOnline
            ? systemHealth?.operator?.user || "—"
            : "—"}
        </div>

        <div className="font-mono text-[11px] text-slate-faint">
          {systemOnline &&
          systemHealth?.operator?.userClass
            ? `Clase ${systemHealth.operator.userClass}`
            : "Perfil IBM i"}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 ${
              systemOnline ? "bg-phosphor" : "bg-alarm"
            }`}
            style={{
              boxShadow: systemOnline
                ? "0 0 6px var(--color-phosphor)"
                : "0 0 6px var(--color-alarm)",
            }}
          />

          <span
            className={`font-mono text-[10px] tracking-widest uppercase ${
              systemOnline
                ? "text-phosphor"
                : "text-alarm"
            }`}
          >
            {loadingSystem
              ? "Conectando..."
              : systemOnline
                ? "Sesión IBM i activa"
                : "Sin conexión IBM i"}
          </span>
        </div>
      </div>
    </aside>
  );
}