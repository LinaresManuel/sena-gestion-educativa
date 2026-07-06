# AGENTS.md

Referencia compacta para agentes de IA que trabajen en este proyecto. Cada línea responde a: ¿un agente pasaría esto por alto sin ayuda?

## Proyecto en una frase

SPA React 19 + API Express en el mismo proceso Node, SQLite vía Drizzle ORM. Auth con JWT en cookie `httpOnly`. **No es monorepo**, **no hay tests**.

## Dos copias del repo en esta máquina

| Ruta | Propósito |
|---|---|
| `C:\Users\Sena Empresa\Desktop\SENA Software\sena-gestion-educativa` | Workspace de desarrollo (donde trabaja este agente) |
| `C:\sena-gestion-educativa` | Deploy: el que corre el servicio NSSM, con `.env.local` real |

Ambas son repos git. La copia deploy tiene el workspace como remote `workspace` (añadido localmente, no en `origin`). Sincronizar así:

```bash
# En el deploy, traer cambios del workspace
cd C:\sena-gestion-educativa
git pull workspace main
```

**No commitear `.env.local`** (está en `.gitignore`). El deploy tiene los secretos reales, el workspace no.

## Arquitectura

`server.ts` (612 líneas) levanta una app Express que sirve **API + frontend** en el mismo puerto:
- `dist/` (build) o Vite middleware (dev) sirven la SPA
- Todo el CRUD está inline en `server.ts`, **no en archivos de rutas** (excepto `/api/auth/*` en `src/routes/auth.ts`)
- Middlewares en `src/middleware/`: `auth`, `request-logger`, `audit`, `error-handler`
- Logger en `src/lib/logger.ts` (pino; a stdout con `pino-pretty` en dev, a `C:\sena-data\logs\app.log` en prod)

## Comandos

| Script | Qué hace | Gotcha |
|---|---|---|
| `npm run dev` | Vite middleware + Express en :3000 | **Mismo puerto que el servicio NSSM** — no correr ambos a la vez |
| `npm run build` | Vite → `dist/` + esbuild → `dist/server.cjs` | No reinicia el servicio. Ver sección "build → restart" abajo. |
| `npm start` | Ejecuta `dist/server.cjs` (producción) | El servicio NSSM ya lo hace |
| `npm run db:push` | Aplica schema a SQLite en `DATABASE_URL` | Requiere `drizzle-kit` (devDep) |
| `npm run seed` | Puebla datos de ejemplo | Idempotente (`onConflictDoNothing`) |
| `npm run lint` | **Solo `tsc --noEmit`**. No hay eslint ni formatter | Hay errores pre-existentes en `src/components/*` (`React.FormEvent` namespace) — **no son tuyos**, no los toques |
| `npm run clean` | `rimraf dist server.js` | `rm -rf` no funciona en Windows; ya está arreglado |

## Servicio de Windows (NSSM)

El servicio se llama `SenaSchedule`:
- `AppDirectory` = raíz del deploy
- `AppParameters` = `dist\server.cjs`
- `AppEnvironmentExtra` = `NODE_ENV=production`
- Logs: `C:\sena-data\logs\service.out.log` y `service.err.log` (rotación 10 MB)
- Auto-start, auto-restart ante caída

Control con `scripts\service-control.ps1`:
```bash
powershell -ExecutionPolicy Bypass -File scripts\service-control.ps1 -Action status
powershell -ExecutionPolicy Bypass -File scripts\service-control.ps1 -Action restart
```

**Requiere PowerShell como Administrador** para start/stop/restart. El usuario normal solo puede consultar estado.

## Variables de entorno (en `.env.local`)

| Var | Default | Regla de producción |
|---|---|---|
| `JWT_SECRET` | placeholder de dev | **Obligatorio, >=32 chars aleatorios**. Si no, el proceso sale con código 1. |
| `DATABASE_URL` | `data.db` (relativo a cwd) | Usar ruta absoluta: `C:\sena-data\db\data.db` |
| `COOKIE_SECURE` | `false` | `true` **solo** si se sirve por HTTPS. En LAN HTTP dejar `false` o el navegador no enviará la cookie. |
| `PORT` | `3000` | — |
| `APP_URL`, `CORS_ORIGIN`, `SESSION_TTL_HOURS` | ver `src/config.ts` | — |

**Quirk:** `dotenv` está en `dependencies` pero **NO se usa**. La carga de `.env.local` está hecha a mano en `src/config.ts` y `drizzle.config.ts` (ambas tienen su propio `loadDotEnv()`). Si el usuario reporta "no lee mi .env", probablemente instaló `dotenv` pensando que ayudaría — no es así.

## Build → restart (crítico)

El servicio corre `dist\server.cjs` en memoria. Un `npm run build` solo **no** aplica cambios. Después de cada build:

```bash
powershell -ExecutionPolicy Bypass -File scripts\service-control.ps1 -Action restart
```

Verificar con `GET /api/health`: el campo `uptime` debe estar cerca de 0 segundos.

## Auth

- Cookie: `sena_session`, `httpOnly`, `sameSite: 'lax'`, `secure: config.COOKIE_SECURE`
- Login: `POST /api/auth/login` (rate-limited a 10 req/min por IP)
- `requireAuth` en `server.ts` bloquea todo `/api/*` excepto `/health` y `/auth/*`
- **Sistema de permisos granular** (Tarea Y implementada):
  - 5 roles por defecto: `admin`, `editor`, `instructor`, `lector`, `aprendiz` (roles dinámicos desde BD, se pueden crear/editar/eliminar desde AdminPanel)
  - 39 permisos en 10 módulos (inicio, regionales, centros, ambientes, tipos_ambiente, programas, instructores, fichas, programacion, admin)
  - Tablas: `permisos`, `roles_permisos`, `usuarios_roles`
  - JWT incluye array `permisos` con códigos como `programacion.editar`
  - **Permission Inheritance**: `resolveEffectivePermissions()` en `auth-context.ts` agrega automáticamente `module.ver` si el usuario tiene cualquier acción CRUD en ese módulo
  - Middlewares: `requirePermission(...)`, `requireAnyPermission(...)`, `requireAllPermissions(...)`
  - Hooks React: `useHasPermission(...)`, `useHasAnyPermission(...)`, `useIsAdmin()`
  - `ConfirmDialog` compartido en `src/components/ConfirmDialog.tsx` — usado en todos los módulos para confirmar eliminaciones
  - Admin endpoints: `/api/admin/roles`, `/api/admin/permisos`, `/api/admin/usuarios`
- **Patrón de permisos por vista**: Cada vista CRUD usa:
  - `mayCrear = useHasPermission('modulo.crear')` — controla formulario de creación
  - `mayEditar = useHasPermission('modulo.editar')` — controla botón editar
  - `mayEliminar = useHasPermission('modulo.eliminar')` — controla botón eliminar
  - `hayAcciones = mayCrear || mayEditar || mayEliminar` — controla columna de acciones en tabla
  - Formulario se muestra con `(mayCrear || mayEditar)`, NO con `hayAcciones`
  - Cada eliminación pasa por `ConfirmDialog` antes de ejecutar `handleDelete`
- **Cada módulo del proyecto (sidebar) debe tener su propio archivo `permissions.ts` en `src/modules/<modulo>/` con permisos CRUD (`ver`, `crear`, `editar`, `eliminar`).** Si se crea un nuevo módulo UI, hay que crear su carpeta de permisos, registrarlo en `src/modules/index.ts`, insertar los permisos en BD, y asignarlos a los roles existentes. También verificar que el backend tenga un endpoint `requirePermission` para las operaciones CRUD de ese módulo.

## Frontend: wrapper global de fetch

`src/main.tsx` parchea `window.fetch` para inyectar `credentials: 'include'`. **Todos los `fetch()` reciben la cookie automáticamente.** No añadir `credentials` por llamada a menos que haya razón específica. Los componentes en `src/components/*` usan `fetch` sin opciones de credentials y dependen de este wrapper.

## Base de datos

- `better-sqlite3` + Drizzle. `journal_mode = WAL`, `foreign_keys = ON`, `synchronous = NORMAL`
- 15 tablas, esquema en `src/db/schema.ts` (incluye `usuarios` para auth + 3 tablas de permisos)
- Tablas de permisos: `permisos`, `roles_permisos`, `usuarios_roles`
- Path: `config.DATABASE_URL`, **relativo a `process.cwd()`** — esto importa para `npm run seed` (correr desde la raíz del proyecto) y para el servicio (su `AppDirectory` es la raíz, OK)
- Backup: `scripts\backup.ps1` usa `sqlite3 .backup` (necesita `sqlite3.exe` en PATH)

## PowerShell scripts (todos en `scripts\`)

| Script | Propósito | ¿Requiere admin? |
|---|---|---|
| `install-service.ps1` | Instalar/registrar el servicio NSSM | Sí |
| `uninstall-service.ps1` | Desinstalar el servicio | Sí |
| `service-control.ps1` | start/stop/restart/status | Sí (solo status sin admin) |
| `init-sena-data.ps1` | Crear layout `C:\sena-data\` | No |
| `open-firewall.ps1` | Abrir puerto 3000 en Firewall de Windows | Sí |
| `install-backup-task.ps1` | Tarea programada diaria 02:00 para backup | Sí |
| `backup.ps1` | Backup manual bajo demanda | No |
| `show-network.ps1` | Mostrar IPs LAN y URL de acceso | No |
| `_nssm-helper.ps1` | Auto-detección de ruta de `nssm.exe` | N/A (helper) |
| `deploy.ps1` | Build + restart del servicio (requiere admin) | Sí |
| `migrate-to-permissions.ts` | Migrar datos al sistema de permisos | No |
| `verify-permissions.ts` | Verificar permisos en BD | No |
| `test-permissions.ts` | Probar endpoints de permisos | No |

Los scripts usan `$PSScriptRoot` (no `Get-Location`) para detectar el proyecto, así que funcionan desde cualquier cwd.

## Documentación existente (leer antes de adivinar)

- `README.md` — setup rápido
- `docs/analisis-proyecto.md` — análisis inicial del proyecto
- `docs/DEPLOYMENT.md` — guía paso a paso de despliegue
- `docs/OPERATIONS.md` — operación diaria, logs, respaldos, gestión de usuarios
- `docs/ARQUITECTURA-DATOS.md` — esquema de BD, módulos, permisos, flujo de datos
- `docs/PENDIENTES-PERMISOS-MODULOS.md` — referencia de permisos por módulo (completado)

## Gotchas frecuentes

1. **Conflicto de puerto 3000:** `npm run dev` y el servicio NSSM usan el mismo puerto. Detener el servicio antes de `npm run dev` (`Stop-Service -Name SenaSchedule` como admin).
2. **El servicio no se puede parar desde una shell no-admin.** `service-control.ps1` necesita elevación.
3. **El rate limit de `/api/auth/*` es 10 req/min.** En tests, dormir entre intentos o usar IPs diferentes.
4. **Errores TS pre-existentes en `src/components/*`:** son del template original, no regresiones. No intentes arreglarlos en una tarea no relacionada.
5. **Cookies cross-origin:** si un cliente entra por `10.0.0.5:3000` y la cookie se seteo en `localhost:3000`, el navegador no la envía. El cliente debe usar **un único hostname** durante la sesión.
6. **No hay tests** — si el usuario pide "corre los tests", no busques framework; no existen.
7. **El `lint` solo es typecheck** — no esperes que encuentre code smells, solo errores de tipos.
8. **NSSM no se reinicia solo desde una shell sin admin.** Si el build cambió y el servicio sigue con código viejo, el usuario debe ejecutar `Restart-Service -Name SenaSchedule` como admin (o desde un PowerShell elevado).
9. **Permisos CRUD heredan `ver`**: Si un usuario tiene `regionales.crear`, automáticamente puede ver el módulo regionales (sidebar, dashboard). Esto es intencional — `resolveEffectivePermissions()` lo resuelve en el frontend.
