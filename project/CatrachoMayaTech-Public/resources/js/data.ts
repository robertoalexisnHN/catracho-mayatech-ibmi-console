export type EnvId = "DEV" | "QA" | "PROD";
export type Health = "ok" | "warn" | "crit";
export type ObjStatus = "sync" | "diff" | "missing";
export type Severity = "baja" | "media" | "alta" | "critica";
export type Risk = "bajo" | "medio" | "alto";

export const environments: {
  id: EnvId;
  host: string;
  health: Health;
  objects: number;
  pendingDiffs: number;
  lastSync: string;
}[] = [
  { id: "DEV", host: "IBMIDEV.LPAR01", health: "ok", objects: 1284, pendingDiffs: 0, lastSync: "hoy 08:12" },
  { id: "QA", host: "IBMIQA.LPAR02", health: "warn", objects: 1276, pendingDiffs: 7, lastSync: "hoy 07:40" },
  { id: "PROD", host: "IBMIPRD.LPAR00", health: "crit", objects: 1269, pendingDiffs: 3, lastSync: "ayer 22:15" },
];

export type EnvVersion = {
  rev: string;
  size: string;
  changed: string; // última modificación
  present: boolean;
  attribute?: string;
  created?: string; // fecha de creación
  compiled?: string; // fecha de compilación
  owner?: string;
};

export type CompareObject = {
  name: string;
  type: string;
  library: string;
  size: string;
  changed: string;
  status: ObjStatus;
  missingDep?: string;
  description: string;
  deps: string[]; // objetos requeridos (por nombre)
  versions: Record<EnvId, EnvVersion>;
  diff: { env: EnvId; sign: "+" | "-" | "~"; text: string }[];
};

export const compareObjects: CompareObject[] = [
  {
    name: "ORDVAL01",
    type: "*PGM (RPGLE)",
    library: "APPLIB",
    size: "184.2 KB",
    changed: "2026-08-27 16:44",
    status: "diff",
    description: "Validación y cálculo de descuento de órdenes de venta",
    deps: ["PCTLOOKUP", "ORDHDR", "CUSTMAST"],
    versions: {
      DEV: { rev: "r418", size: "184.2 KB", changed: "2026-08-27 16:44", present: true, attribute: "RPGLE", created: "2024-03-11 10:02", compiled: "2026-08-27 16:44", owner: "R.MARTÍNEZ" },
      QA: { rev: "r418", size: "184.2 KB", changed: "2026-08-27 16:44", present: true, attribute: "RPGLE", created: "2024-03-11 10:02", compiled: "2026-08-27 16:44", owner: "R.MARTÍNEZ" },
      PROD: { rev: "r402", size: "179.8 KB", changed: "2026-08-14 09:10", present: true, attribute: "RPGLE", created: "2024-03-11 10:02", compiled: "2026-08-14 09:10", owner: "A.CÁCERES" },
    },
    diff: [
      { env: "PROD", sign: "-", text: "C   EVAL  DISCOUNT = QTY * 0.05" },
      { env: "DEV", sign: "+", text: "C   EVAL  DISCOUNT = QTY * PCTFROMTABLE" },
      { env: "DEV", sign: "+", text: "C   CALL  'PCTLOOKUP'  PLIST_PCT" },
    ],
  },
  {
    name: "PCTLOOKUP",
    type: "*PGM (RPGLE)",
    library: "APPLIB",
    size: "42.1 KB",
    changed: "2026-08-27 16:40",
    status: "missing",
    missingDep: "Requerido por ORDVAL01 — no existe en PROD",
    description: "Lookup de porcentaje de descuento desde tabla PCT",
    deps: [],
    versions: {
      DEV: { rev: "r51", size: "42.1 KB", changed: "2026-08-27 16:40", present: true, attribute: "RPGLE", created: "2026-08-27 16:40", compiled: "2026-08-27 16:40", owner: "R.MARTÍNEZ" },
      QA: { rev: "r51", size: "42.1 KB", changed: "2026-08-27 16:40", present: true, attribute: "RPGLE", created: "2026-08-27 16:40", compiled: "2026-08-27 16:40", owner: "R.MARTÍNEZ" },
      PROD: { rev: "—", size: "—", changed: "—", present: false },
    },
    diff: [
      { env: "PROD", sign: "-", text: "Objeto ausente — dependencia rota" },
      { env: "DEV", sign: "+", text: "H   DFTACTGRP(*NO)  ACTGRP('APPGRP')" },
    ],
  },
  {
    name: "ORDHDR",
    type: "*FILE (PF)",
    library: "APPLIB",
    size: "3.4 MB",
    changed: "2026-08-20 11:02",
    status: "diff",
    description: "Cabecera de órdenes de venta (physical file)",
    deps: [],
    versions: {
      DEV: { rev: "r12", size: "3.4 MB", changed: "2026-08-20 11:02", present: true, attribute: "PF", created: "2023-01-08 08:00", compiled: "2026-08-20 11:02", owner: "R.MARTÍNEZ" },
      QA: { rev: "r12", size: "3.4 MB", changed: "2026-08-20 11:02", present: true, attribute: "PF", created: "2023-01-08 08:00", compiled: "2026-08-20 11:02", owner: "R.MARTÍNEZ" },
      PROD: { rev: "r11", size: "3.3 MB", changed: "2026-07-30 08:00", present: true, attribute: "PF", created: "2023-01-08 08:00", compiled: "2026-07-30 08:00", owner: "A.CÁCERES" },
    },
    diff: [{ env: "DEV", sign: "+", text: "A   PCTTBL  R  3S 2  COLHDG('PCT')" }],
  },
  {
    name: "CUSTMAST",
    type: "*FILE (PF)",
    library: "APPLIB",
    size: "12.8 MB",
    changed: "2026-06-02 09:31",
    status: "sync",
    description: "Maestro de clientes (physical file)",
    deps: [],
    versions: {
      DEV: { rev: "r7", size: "12.8 MB", changed: "2026-06-02 09:31", present: true, attribute: "PF", created: "2022-05-19 07:45", compiled: "2026-06-02 09:31", owner: "A.CÁCERES" },
      QA: { rev: "r7", size: "12.8 MB", changed: "2026-06-02 09:31", present: true, attribute: "PF", created: "2022-05-19 07:45", compiled: "2026-06-02 09:31", owner: "A.CÁCERES" },
      PROD: { rev: "r7", size: "12.8 MB", changed: "2026-06-02 09:31", present: true, attribute: "PF", created: "2022-05-19 07:45", compiled: "2026-06-02 09:31", owner: "A.CÁCERES" },
    },
    diff: [],
  },
  {
    name: "INVRPT02",
    type: "*PGM (CLLE)",
    library: "RPTLIB",
    size: "28.7 KB",
    changed: "2026-05-18 14:20",
    status: "sync",
    description: "Reporte de inventario (programa CL)",
    deps: ["CUSTMAST"],
    versions: {
      DEV: { rev: "r33", size: "28.7 KB", changed: "2026-05-18 14:20", present: true, attribute: "CLLE", created: "2023-09-02 12:00", compiled: "2026-05-18 14:20", owner: "A.CÁCERES" },
      QA: { rev: "r33", size: "28.7 KB", changed: "2026-05-18 14:20", present: true, attribute: "CLLE", created: "2023-09-02 12:00", compiled: "2026-05-18 14:20", owner: "A.CÁCERES" },
      PROD: { rev: "r33", size: "28.7 KB", changed: "2026-05-18 14:20", present: true, attribute: "CLLE", created: "2023-09-02 12:00", compiled: "2026-05-18 14:20", owner: "A.CÁCERES" },
    },
    diff: [],
  },
];

export type Incident = {
  id: string;
  title: string;
  severity: Severity;
  env: EnvId;
  timestamp: string;
  msgId: string;
  status: "activo" | "en revisión" | "resuelto";
  raw: string[];
  translation: string;
  linkedPass?: { date: string; object: string };
  actions: {
    title: string;
    risk: Risk;
    desc: string;
    cmd: string;
  }[];
};

/* ── Línea de tiempo de pases (memoria compartida entre módulos) ── */
export type PassStatus = "exitoso" | "fallido" | "revertido" | "pendiente";
export type Pass = {
  id: string;
  date: string;
  from: EnvId;
  to: EnvId;
  operator: string;
  authorizedBy: string;
  status: PassStatus;
  objects: string[];
  linkedIncident?: string;
  note: string;
};

export const passes: Pass[] = [
  {
    id: "PASE-0912",
    date: "2026-08-28 22:05",
    from: "QA",
    to: "PROD",
    operator: "R.MARTÍNEZ",
    authorizedBy: "L.FONSECA (*SECOFR)",
    status: "fallido",
    objects: ["ORDVAL01", "ORDHDR"],
    linkedIncident: "INC-4471",
    note: "ORDVAL01 desplegado sin su dependencia PCTLOOKUP. Falla en producción a las 03:14.",
  },
  {
    id: "PASE-0911",
    date: "2026-08-27 17:10",
    from: "DEV",
    to: "QA",
    operator: "R.MARTÍNEZ",
    authorizedBy: "R.MARTÍNEZ (*SECADM)",
    status: "exitoso",
    objects: ["ORDVAL01", "PCTLOOKUP", "ORDHDR"],
    note: "Nueva lógica de descuento por tabla. Validado en QA sin observaciones.",
  },
  {
    id: "PASE-0908",
    date: "2026-08-20 11:30",
    from: "QA",
    to: "PROD",
    operator: "A.CÁCERES",
    authorizedBy: "L.FONSECA (*SECOFR)",
    status: "exitoso",
    objects: ["INVRPT02"],
    note: "Ajuste de formato en reporte de inventario. Sin incidencias.",
  },
  {
    id: "PASE-0905",
    date: "2026-08-14 09:15",
    from: "QA",
    to: "PROD",
    operator: "R.MARTÍNEZ",
    authorizedBy: "L.FONSECA (*SECOFR)",
    status: "revertido",
    objects: ["ORDVAL01"],
    note: "Revertido por diferencia de comportamiento en cálculo. Restaurado a r402.",
  },
  {
    id: "PASE-0901",
    date: "2026-06-02 09:40",
    from: "QA",
    to: "PROD",
    operator: "A.CÁCERES",
    authorizedBy: "L.FONSECA (*SECOFR)",
    status: "exitoso",
    objects: ["CUSTMAST"],
    note: "Carga inicial de maestro de clientes. Estable desde entonces.",
  },
];

/* Historia de cambios por objeto */
export const objectHistory: Record<string, { date: string; env: EnvId; rev: string; who: string; event: string }[]> = {
  ORDVAL01: [
    { date: "2026-08-28 22:05", env: "PROD", rev: "r418", who: "R.MARTÍNEZ", event: "Pase PASE-0912 (fallido)" },
    { date: "2026-08-27 16:44", env: "DEV", rev: "r418", who: "R.MARTÍNEZ", event: "Cambio: descuento por tabla PCT" },
    { date: "2026-08-14 09:10", env: "PROD", rev: "r402", who: "R.MARTÍNEZ", event: "Restaurado (rollback PASE-0905)" },
  ],
  PCTLOOKUP: [
    { date: "2026-08-27 16:40", env: "DEV", rev: "r51", who: "R.MARTÍNEZ", event: "Creado — lookup de porcentaje" },
    { date: "2026-08-27 17:10", env: "QA", rev: "r51", who: "R.MARTÍNEZ", event: "Pase a QA (exitoso)" },
  ],
  ORDHDR: [
    { date: "2026-08-20 11:02", env: "DEV", rev: "r12", who: "R.MARTÍNEZ", event: "Nuevo campo PCTTBL" },
    { date: "2026-07-30 08:00", env: "PROD", rev: "r11", who: "A.CÁCERES", event: "Versión productiva vigente" },
  ],
  CUSTMAST: [{ date: "2026-06-02 09:31", env: "PROD", rev: "r7", who: "A.CÁCERES", event: "Carga inicial" }],
  INVRPT02: [{ date: "2026-05-18 14:20", env: "PROD", rev: "r33", who: "A.CÁCERES", event: "Ajuste de formato" }],
};

/* Salud del sistema (QSYS2) para el widget del sidebar */
export const systemHealth = {
  subsystems: { active: 6, total: 7 },
  jobsQueued: 12,
  aspUsed: 68, // %
  cpuAvg: 41, // %
};

export const incidents: Incident[] = [
  {
    id: "INC-4471",
    title: "ORDVAL01 termina con excepción no controlada al calcular descuento",
    severity: "critica",
    env: "PROD",
    timestamp: "2026-08-29 03:14:07",
    msgId: "MCH3401",
    status: "activo",
    raw: [
      "Job 418992/APPUSR/ORDVAL01 started 2026-08-29-03.14.02",
      "MCH3401  Escape  40   03.14.07  ORDVAL01  APPLIB",
      "  Cannot resolve to object PCTLOOKUP. Type and",
      "  subtype X'0201' authority X'0000'.",
      "RNX0202  Escape  50   03.14.07  QRNXIE    QSYS",
      "  Call to program or procedure PCTLOOKUP failed.",
      "  Halt indicator was on.",
    ],
    translation:
      "El programa de validación de órdenes se detuvo porque intentó llamar al programa PCTLOOKUP, que no está instalado en PROD. Toda orden nueva con descuento queda sin procesar hasta que el objeto exista o se revierta el cambio.",
    linkedPass: { date: "2026-08-28", object: "ORDVAL01" },
    actions: [
      {
        title: "Revertir ORDVAL01 a revisión r402",
        risk: "medio",
        desc: "Restaura la versión estable previa al pase. Detiene el fallo inmediatamente. Los descuentos se calcularán con la tabla anterior.",
        cmd: "RSTOBJ OBJ(ORDVAL01) SAVLIB(APPLIB) DEV(*SAVF) OBJTYPE(*PGM)",
      },
      {
        title: "Instalar dependencia faltante PCTLOOKUP en PROD",
        risk: "alto",
        desc: "Compila y despliega PCTLOOKUP r51 en producción. Completa el pase original. Requiere que la tabla PCT esté cargada primero.",
        cmd: "CRTBNDRPG PGM(APPLIB/PCTLOOKUP) SRCSTMF('/qsys.lib/applib.lib/pctlookup.mbr')",
      },
      {
        title: "Suspender cálculo de descuento (bandera *OFF)",
        risk: "bajo",
        desc: "Desactiva temporalmente la rama de descuento vía data area. Las órdenes procesan sin descuento hasta resolver la causa raíz.",
        cmd: "CHGDTAARA DTAARA(APPLIB/DISCFLAG) VALUE('0')",
      },
    ],
  },
  {
    id: "INC-4468",
    title: "Cola de salida QPRINT con crecimiento anómalo en PROD",
    severity: "media",
    env: "PROD",
    timestamp: "2026-08-29 01:52:40",
    msgId: "CPF3309",
    status: "en revisión",
    raw: [
      "CPF3309  Info    00   01.52.40  QSPGETF   QSYS",
      "  No files named QPRINT are active for output queue.",
      "  1.842 spooled files pending in QGPL/QPRINT.",
    ],
    translation:
      "Se acumulan casi 1.900 reportes en espera de impresión sin un dispositivo activo. No detiene la operación, pero consume almacenamiento y puede saturar la biblioteca temporal.",
    actions: [
      {
        title: "Reasignar cola a impresora PRT02",
        risk: "bajo",
        desc: "Redirige la cola de salida a un dispositivo activo. Los reportes comienzan a drenar de inmediato.",
        cmd: "CHGOUTQ OUTQ(QGPL/QPRINT) RMTPRTQ(PRT02)",
      },
      {
        title: "Purgar spooled files mayores a 30 días",
        risk: "medio",
        desc: "Elimina reportes antiguos ya no requeridos. Libera almacenamiento. La acción no es reversible.",
        cmd: "DLTSPLF FILE(*SELECT) JOB(*ALL) ...",
      },
    ],
  },
  {
    id: "INC-4455",
    title: "Tiempo de respuesta elevado en subsistema QINTER",
    severity: "baja",
    env: "QA",
    timestamp: "2026-08-28 18:07:11",
    msgId: "CPF1124",
    status: "resuelto",
    raw: [
      "CPF1124  Info    00   18.07.11  QWTPITPP  QSYS",
      "  Job 411203/QSECOFR/QPADEV0009 started.",
      "  Interactive response avg 2.8s over threshold 1.5s.",
    ],
    translation:
      "Las sesiones 5250 interactivas en QA respondieron más lento de lo normal por un pico de carga batch simultáneo. Se normalizó al terminar el batch nocturno.",
    actions: [
      {
        title: "Ajustar prioridad de ejecución del pool interactivo",
        risk: "bajo",
        desc: "Aumenta la prioridad relativa de QINTER frente al batch. Mejora tiempos de respuesta en horario pico.",
        cmd: "CHGSHRPOOL POOL(*INTERACT) ACTLVL(120)",
      },
    ],
  },
];
