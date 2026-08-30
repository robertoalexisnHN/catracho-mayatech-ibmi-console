Diseña una plataforma web B2B llamada "Catracho MayaTech Ops Console" — una consola de continuidad operativa para administradores de sistemas IBM i. El público objetivo son administradores de sistemas experimentados (40-55 años), que trabajan con terminales verdes y pantallas 5250 desde hace décadas, y que NO son programadores. Necesitan sentirse en control, no intimidados. Esto es una herramienta operativa seria de sala de máquinas, no una app de consumo ni un dashboard de startup genérico — piensa "torre de control" o "centro de mando", no "SaaS con gradientes pastel".

Identidad visual: Evita los defaults genéricos de IA: nada de fondo crema con acento terracota, nada de negro con un solo acento verde-ácido tipo dashboard de trading, nada de layout tipo periódico con reglas finas. En su lugar, construye la identidad desde el mundo real de IBM i: terminales de sala de control, verde fósforo de las pantallas 5250 clásicas, la sensación de un centro de operaciones de red eléctrica o torre de control aérea — serio, de alto contraste, orientado a decisiones bajo presión.

Paleta sugerida (ajústala si encuentras algo mejor, pero mantén el espíritu):

Fondo base: gris-carbón muy oscuro, casi azulado (no negro puro)
Acento primario: verde fósforo/terminal (referencia a las pantallas 5250), usado con moderación para estados "todo OK" y elementos de datos activos
Acento de alerta: ámbar/naranja de advertencia industrial (no rojo de error genérico) para diferencias detectadas
Acento crítico: rojo de alarma real, reservado solo para incidentes activos en producción
Texto y estructura: grises fríos de alto contraste

Tipografía: Una fuente monoespaciada de carácter (tipo terminal/consola) para datos, códigos de objeto, IDs de mensaje y logs — esto es central a la identidad, no decorativo. Una sans-serif técnica y neutra para texto de interfaz, etiquetas y navegación. Deja que la monoespaciada sea la "voz" distintiva de la plataforma.

Estructura de la plataforma — 2 módulos principales conectados por un panel de trazabilidad compartida:

Pantalla de inicio / Dashboard general
Vista de estado general de los 3 ambientes (DEV / QA / PROD) con indicador de salud de cada uno
Resumen de incidentes activos y su severidad
Resumen de diferencias pendientes de sincronizar entre ambientes
Acceso directo a los dos módulos
Módulo Comparador de Objetos
Selector de los tres ambientes (DEV, QA, PROD) representados como columnas o carriles
Tabla/lista de objetos con estado por color: verde (sincronizado), ámbar (diferencia detectada), rojo (falta o dependencia rota)
Vista de detalle de un objeto seleccionado: metadatos (nombre, tipo, biblioteca, tamaño, fecha de cambio) y diff de las tres versiones
Alerta visual clara cuando se detecta una dependencia faltante
Botón de acción principal: "Generar paquete de pase" que muestra un resumen del paquete generado (lista de objetos + orden de compilación) con opción de descargar el script
Módulo Centro de Incidentes
Lista de incidentes activos/recientes en producción, con severidad y timestamp
Vista de detalle de un incidente: el mensaje de error crudo del joblog (con estética de terminal/log real) junto a su traducción en lenguaje de negocio, lado a lado
Sección "Origen probable": si el sistema detecta que el incidente se vincula a un pase reciente del Módulo Comparador, mostrarlo como una conexión visual clara (ej. una línea o badge que diga "vinculado al pase del [fecha], objeto [nombre]")
Panel de "Acciones recomendadas": 2-3 tarjetas de acción, cada una con un nivel de riesgo visual (bajo/medio/alto) claramente codificado por color, descripción de qué hace la acción, y un botón de confirmación con un patrón de "doble verificación" (ya que estas acciones afectan producción real)

Componentes reutilizables a diseñar:

Badge de severidad/riesgo (bajo, medio, alto, crítico)
Indicador de estado de ambiente (DEV/QA/PROD) con color de salud
Tarjeta de objeto comparado
Tarjeta de acción de remediación
Bloque de log/terminal (para mostrar joblogs reales con estética monoespaciada auténtica)
Navegación lateral fija con los módulos y el logo del equipo

Tono de la escritura en la interfaz: Directo, sin jerga de marketing. Los botones dicen exactamente lo que hacen ("Generar paquete de pase", no "Optimizar ahora"). Los mensajes de error no se disculpan, describen el hecho y la causa probable. Los estados vacíos son instructivos, no decorativos (ej: "Sin incidentes activos — todos los ambientes sincronizados" en vez de un ícono genérico de celebración).

Detalle de marca: Incluye el nombre del equipo "Catracho MayaTech" en el header/navegación, con un logo simple basado en texto (no generes un logo elaborado, solo un tratamiento tipográfico limpio del nombre) que combine la identidad centroamericana del nombre con la estética técnica/terminal de la plataforma.

Genera pantallas de escritorio primero (esta es una herramienta de trabajo, se usa en monitores grandes de sala de operaciones), con un breakpoint responsive básico para tablet como segunda prioridad.