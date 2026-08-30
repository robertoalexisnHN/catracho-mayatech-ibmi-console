# Catracho MayaTech · Consola de Continuidad Operativa IBM i

Versión Laravel del proyecto generado en Figma para el Hackathon IBM TechXchange 2026. Se preservó el frontend completo (Dashboard, Comparador de objetos, Centro de incidentes, Línea de pases, búsqueda global, historial de objetos y toda la identidad visual) y se integró dentro de una aplicación Laravel preparada para consumir el puente Java/JDBC hacia IBM i.

## Stack

- Laravel 12 / PHP 8.2+
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- SQLite por defecto para trazabilidad de paquetes de pase
- PhpSpreadsheet para listas CSV/TXT/XLS/XLSX
- Java 8 + JTOpen `jt400-jdk8` como puente opcional hacia IBM i

## 1. Instalación Laravel

```bash
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
npm install
npm run build
php artisan serve
```

Para desarrollo del frontend:

```bash
npm run dev
```

## 2. Modo demo

El proyecto inicia preparado para datos de demostración:

```env
IBMI_DEMO_MODE=true
```

Así se puede presentar toda la interfaz aunque la laptop con VPN/LPAR no esté disponible.

## 3. Conectar con IBM i real

Ejecuta `bridge-java/Bridge.java` en la laptop que tiene VPN a IBM i y cambia en `.env`:

```env
IBMI_BRIDGE_URL=http://IP_LOCAL_LAPTOP_TRABAJO:8080
IBMI_DEMO_MODE=false
IBMI_LIBRARY_DEV=MIAPPDEV
IBMI_LIBRARY_QA=MIAPPQA
IBMI_LIBRARY_PROD=MIAPPPRD
```

Nunca guardes usuario/contraseña de IBM i o IBM Cloud en este repositorio.

## 4. API Laravel incluida

- `GET /api/health`
- `GET /api/objects?environment=DEV`
- `GET /api/incidents`
- `GET /api/changes?environment=PROD`
- `POST /api/passes/parse-list`
- `POST /api/passes/validate`
- `POST /api/passes/generate`
- `GET /api/passes/{id}`

`parse-list` acepta TXT, CSV, XLS y XLSX. `generate` registra el pase y sus objetos en SQLite para mantener trazabilidad.

## 5. Estructura importante

```text
app/Services/IbmiBridgeService.php   Conexión Laravel -> puente Java
app/Support/DemoData.php             Fallback de demostración
app/Http/Controllers/Api             API del comparador y paquetes
app/Models                            Persistencia de pases
resources/js                         Frontend original completo de Figma
resources/views/app.blade.php        Shell Laravel de la SPA
bridge-java/Bridge.java              JDBC IBM i sin ODBC ni admin
.bobignore                           Evita credenciales/archivos sensibles
```

## 6. Consultas IBM i usadas por el puente

El puente consulta `QSYS2.OBJECT_STATISTICS` para objetos/cambios y `QSYS2.JOBLOG_INFO` para mensajes de joblog. Las consultas están encapsuladas en `bridge-java/Bridge.java`.

## Seguridad

El repositorio no contiene credenciales. `.env`, base SQLite local, certificados, claves y archivos de secretos están excluidos en `.gitignore` y `.bobignore`.

## Fuente visual original

El prompt original y las notas importadas desde Figma se conservaron en `docs/figma-source/`.
