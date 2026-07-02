# Tareas Pendientes — SENA Gestión Educativa

Lista de implementaciones identificadas como necesarias o recomendables para completar el proyecto, organizada por prioridad. Generada tras el análisis del estado actual.

---

## Estado actual

**Implementado y funcional:**
- Auth JWT con cookie `httpOnly` y roles (`admin`/`editor`/`lector`)
- CRUD completo de todas las entidades (regionales, centros, ambientes, instructores, programas, fichas, programación)
- Persistencia en SQLite con WAL mode en `C:\sena-data\db\`
- Servicio de Windows (NSSM) con auto-arranque y auto-restart
- Backups automáticos vía tarea programada (si está instalada)
- Logger estructurado (pino) con auditoría de mutaciones
- Health check, helmet, rate limit en `/api/auth`
- Documentación de despliegue y operaciones

**Último commit:** `e78a442 docs: AGENTS.md con handover para futuras sesiones`

---

## 🔴 Prioridad ALTA — Seguridad y bloqueantes operacionales

### A. Mitigación temporal de la brecha de guards (cubierto por Y)
**✅ Implementado como mitigación temporal.**

Cualquier usuario logueado (incluso `lector`) puede acceder a `/regionales`, `/programacion`, etc., y ver/editar datos.

**Mitigación implementada:**
- Se creó `src/lib/auth-context.ts` con `AuthContext` y hook `useCanEdit()` que retorna `true` solo para roles `admin` y `editor`.
- Se envolvió `PrivateLayout` con `AuthContext.Provider` para exponer el usuario a todos los componentes hijos.
- Se añadió componente `RequireRole` en `App.tsx` para proteger rutas específicas (actualmente `/programacion` solo permite `admin` y `editor`).
- Se ocultó el enlace "Programación" en el sidebar y Dashboard para usuarios `lector`.
- Se ocultaron formularios de creación/edición y botones de acción (editar/eliminar) en todos los componentes principales:
  - `RegionalesView.tsx`
  - `CentrosView.tsx`
  - `AmbientesView.tsx`
  - `TiposAmbienteView.tsx`
  - `ProgramasView.tsx`
  - `InstructoresView.tsx`
  - `FichasView.tsx`
  - `ElementosAmbienteGrid.tsx`

**Limitaciones:**
- `CurriculoModal.tsx` aún no tiene guards (pendiente).
- La solución definitiva es el sistema granular de permisos (tarea Y).

**Estimación:** 1–2 h (mitigación) → **Completado**

---

### B. CSRF en operaciones de escritura
JWT en cookie es vulnerable a CSRF. `helmet` no añade tokens CSRF. Cualquier página externa puede hacer `fetch` cross-site hacia `/api/*` mientras la cookie esté presente (modulado por `SameSite=Lax`).

**Tarea:** Implementar doble-submit cookie o token CSRF en headers para POST/PUT/DELETE.

**Estimación:** 2–3 h

---

### C. Validación de entrada insuficiente
Los handlers de `server.ts` solo verifican con `typeof` o nada. Un body malformado puede llegar a Drizzle.

**Tarea:** Integrar `zod` o `valibot`. Crear schemas en `src/lib/schemas.ts` y validar antes de los handlers.

**Estimación:** 3–4 h

---

### D. Vulnerabilidades de dependencias detectadas
`npm install` reporta: 3 low, 5 moderate, 1 high.

**Tarea:** `npm audit fix` (sin `--force`). Si persisten, documentar en `SECURITY.md` y evaluar更新时间 manual.

**Estimación:** 30 min

---

### E. Tareas programadas y firewall sin instalar
Tras la instalación, los siguientes scripts no se han ejecutado en el deploy real:
- `scripts\install-backup-task.ps1` (como Admin)
- `scripts\open-firewall.ps1` (como Admin)

**Tarea:** Ejecutarlos en el PC servidor. Sin el firewall abierto, otros dispositivos en la LAN no accederán.

**Estimación:** 5 min

---

### F. Contraseña por defecto `Admin123!` activa
El usuario admin inicial sigue con la contraseña temporal. Es un riesgo de seguridad si el equipo es accesible en la LAN.

**Tarea:** Forzar cambio en primer login (ya implementado en el código). Verificar que el flujo funciona. Si el deploy ya está activo, cambiar manualmente vía `scripts\OPERATIONS.md` § Gestión de usuarios.

**Estimación:** 10 min

---

## 🟠 Prioridad MEDIA — Producción y mantenibilidad

### G. `tsconfig.json` sin `strict: true`
Permite `any` implícito, no chequea nullability. Ya hay errores de tipos en `src/components/*` por esto.

**Tarea:** Habilitar `strict: true` y resolver los errores que aparezcan (puede ser bastante trabajo por los componentes existentes).

**Estimación:** 4–6 h

---

### H. Sin tests
Confirmado en AGENTS.md: no hay framework de tests. Cualquier refactor es a ciegas.

**Tarea:** Instalar `vitest` + `@testing-library/react`. Empezar con tests de:
- `src/middleware/auth.ts` (verifyToken, requireAuth)
- `src/config.ts` (validación de envs)
- Un happy path de cada endpoint crítico (`/api/regionales` GET, `/api/fichas` POST con validación de horarios)

**Estimación:** 6–8 h

---

### I. Sin ESLint ni Prettier
Solo hay `tsc --noEmit`. No hay enforcement de estilo ni de patrones.

**Tarea:** Añadir `eslint` con config estándar de TypeScript + React. Añadir `prettier` con config de 2 espacios, comillas simples, sin punto y coma final. Configurar `lint:fix` y `format` en `package.json`.

**Estimación:** 2 h (sin contar fixes resultantes)

---

### J. Migraciones de Drizzle no versionadas
`drizzle.config.ts` apunta a `src/db/migrations` (vacío) pero solo se usa `db:push` (que aplica cambios directamente sin generar migration). Esto bloquea deploys reproducibles y rollback.

**Tarea:** Cambiar el workflow a `drizzle-kit generate` + `drizzle-kit migrate`. Documentar en `OPERATIONS.md` cómo aplicar migraciones al actualizar el schema.

**Estimación:** 1 h + disciplina a futuro

---

### K. Health check superficial
`/api/health` solo devuelve uptime. No valida que la BD sea alcanzable, ni espacio en disco.

**Tarea:** Ampliar a `{ status, uptime, db: { ok, latencyMs }, version, env }`. Útil para monitoreo real.

**Estimación:** 30 min

---

### L. CSP deshabilitado
`helmet` tiene `contentSecurityPolicy: false` y `crossOriginEmbedderPolicy: false`. Sin CSP, un XSS ejecutaría sin restricciones.

**Tarea:** Definir una CSP razonable (self, sin inline scripts salvo los del propio bundle). Probar en desarrollo.

**Estimación:** 1–2 h (más pruebas que código)

---

### M. CORS middleware no implementado
La variable `CORS_ORIGIN` existe en `config.ts` pero no se usa en `server.ts`. Si en el futuro se separa el frontend del backend, no funcionará.

**Tarea:** Añadir middleware CORS que use `config.CORS_ORIGIN`. Documentar en `DEPLOYMENT.md` cuándo activarlo.

**Estimación:** 30 min

---

### N. Sin manejo de shutdown graceful
Si el servicio se detiene abruptamente, las conexiones abiertas y las transacciones en curso pueden dejar la BD en estado inconsistente (aunque WAL mitiga esto).

**Tarea:** Añadir handler de `SIGTERM`/`SIGINT` en `server.ts` que cierre el servidor HTTP y la conexión SQLite ordenadamente.

**Estimación:** 30 min

---

## 🟡 Prioridad BAJA — Mejoras de UX y robustez

### O. Endpoints sin paginación ni filtrado
`GET /api/regionales` devuelve TODOS los registros. Con miles de instructores, la respuesta se vuelve lenta y grande.

**Tarea:** Añadir `?limit`, `?offset`, `?search`, `?sort` a endpoints de listado. Documentar contrato.

**Estimación:** 4 h

---

### P. React sin Error Boundary
Si un componente lanza una excepción no capturada, la app entera se cae a una pantalla blanca.

**Tarea:** Crear `<ErrorBoundary>` y envolver `App`. Mostrar UI de fallback amigable.

**Estimación:** 1 h

---

### Q. Sin HTTPS
Tráfico en plano por HTTP. Las credenciales y la sesión JWT circulan sin cifrar en la LAN.

**Tarea:** Configurar un reverse proxy (Caddy, nginx, o NSSM con un servicio adicional) que termine TLS. Generar cert autofirmado o usar Let's Encrypt si hay dominio.

**Estimación:** 4–8 h (incluye pruebas con dispositivos móviles)

---

### R. File uploads sin endpoint
`uploads/` existe como carpeta. El campo `programas.pdfDocument` se persiste pero no hay ruta para subir archivos.

**Tarea:** Crear `POST /api/upload` con `multer` o `busboy`. Validar tipo MIME, tamaño. Servir estáticamente desde `/uploads/`.

**Estimación:** 2–3 h

---

### S. Backup sin encriptación
Los `.db` de respaldo en `C:\sena-data\backups\` son SQLite planos. Contienen datos sensibles (nombres, documentos).

**Tarea:** Comprimir y encriptar con `gpg` o `openssl` después del `sqlite3 .backup`. Rotar clave anualmente.

**Estimación:** 2 h

---

### T. Logs sin rotación externa
`app.log` y los de NSSM rotan a 10 MB localmente, pero no hay envío centralizado ni alertas.

**Tarea:** Opcionalmente integrar con un agregador (Loki, ELK, Seq). Mínimo: alerta por email si `error` aparece en log.

**Estimación:** 4–8 h (depende de la infraestructura destino)

---

### U. CI/CD ausente
Cambios al main se aplican manualmente en el deploy. No hay tests automáticos ni builds de verificación en push/PR.

**Tarea:** Añadir `.github/workflows/ci.yml` con: install, lint, build. No requiere deploy automático (puede ser solo check).

**Estimación:** 1 h

---

### V. UI de gestión de usuarios y roles (sub-tarea de Y)
Solo se puede crear/editar usuarios con `sqlite3` directo (documentado en `OPERATIONS.md`). El simple CRUD de usuarios no aporta valor real sin un sistema de roles/asignación; por eso se aborda como parte del sistema granular (Y).

**Tarea (sub-tarea de Y):** Como parte del sistema granular, crear:
- Vista `/usuarios` (admin only) con asignación de roles
- Vista `/roles` con matriz de permisos

**Estimación:** incluida en Y

---

### Y. Sistema de permisos granulares con auto-registro de módulos

Sustituye los 3 roles fijos (`admin`, `editor`, `lector`) por un modelo donde cada módulo declara sus permisos (`read`, `create`, `update`, `delete`, etc.) y la UI los muestra/oculta según los permisos asignados al usuario. Al crear un módulo nuevo, este aparece automáticamente en la configuración de permisos sin tocar código del sistema.

**Componentes:**

1. **Esquema (sustituye `usuarios.rol` por una relación N:M):**
   - `roles` (id, nombre, descripción, es_sistema, created_at)
   - `permisos` (key PRIMARY KEY, modulo, accion, label) — poblado por auto-descubrimiento
   - `role_permisos` (role_id, permission_key) — N:M
   - `usuario_roles` (usuario_id, role_id) — N:M

2. **Convención por módulo** (cada módulo declara sus permisos en un único archivo):
   ```
   src/modules/regionales/permissions.ts
   src/modules/centros/permissions.ts
   src/modules/fichas/permissions.ts
   ...
   ```
   Cada archivo exporta:
   ```ts
   export const permissions: PermissionDef[] = [
     { key: 'regionales:read',   label: 'Ver regionales' },
     { key: 'regionales:create', label: 'Crear regional' },
     { key: 'regionales:update', label: 'Editar regional' },
     { key: 'regionales:delete', label: 'Eliminar regional' },
   ];
   ```
   Para módulos ya existentes (RegionalesView, CentrosView, etc.) se crea el `permissions.ts` correspondiente junto al componente. Para módulos nuevos, el agente solo necesita crear el `permissions.ts` y el sistema lo detecta solo.

3. **Auto-registro** (Vite `import.meta.glob` en `src/lib/permissions/registry.ts`):
   - Al arrancar el servidor, escanear `src/modules/*/permissions.ts`
   - Sincronizar a la tabla `permisos` (insertar nuevos, mantener existentes, opcional: marcar huérfanos como deprecated)
   - En el frontend, al montar `App`, hidratar `useCurrentPermissions()` con la lista del servidor

4. **Backend:**
   - `GET /api/permisos` — lista de permisos disponibles (para la UI de admin)
   - `GET/POST /api/roles` — listar/crear roles
   - `PUT /api/roles/:id/permisos` — asignar permisos a un rol
   - `GET/PUT /api/usuarios/:id/roles` — asignar roles a un usuario
   - Middleware `requirePermission('regionales:create')` (sustituye/convive con `requireRole`)
   - Helper `can(user, permission)` para lógica condicional en handlers

5. **Frontend:**
   - Componente `<Can permission="regionales:create">…</Can>` — oculta elementos UI
   - Hook `useCan(permission)` — para lógica condicional (`disabled`, `onClick`, etc.)
   - `<NavLink permission="regionales:read">` — filtra el sidebar
   - `<RequirePermission permission="…">` — protege rutas; redirige a `/sin-permiso` si falta

6. **UI de administración:**
   - `/roles` (admin): tabla de roles con matriz de permisos (módulos en filas, acciones en columnas, checkbox por celda)
   - `/permisos` (admin): vista read-only de permisos registrados (útil para auditoría y debugging)
   - `/usuarios` (admin): extiende V con asignación de uno o varios roles por usuario

7. **Migración de datos** (script en `scripts/seed-roles.ts`):
   - Crear roles por defecto equivalentes a los actuales: `admin` (todos los permisos), `editor` (CRUD en todos los módulos), `lector` (solo `read`)
   - Marcar como `es_sistema = true` (no editables, sí asignables)
   - Para cada usuario existente, asignar el rol correspondiente a su `usuarios.rol` actual
   - Mantener `usuarios.rol` como deprecated durante 1 release, eliminar después

**Beneficios:**
- Resuelve A (guards de frontend) como sub-producto trivial
- Sustituye V con una UI de gestión mucho más útil
- Nuevos módulos se integran solos (solo `permissions.ts`)
- Permite permisos por-recurso en el futuro (ej. usuario X solo edita fichas del centro Y)

**Dependencias:**
- Recomendable hacer **antes** J (migraciones de Drizzle) para que el schema use migraciones desde el inicio
- A se reduce a una mitigación de 1–2 h mientras se implementa Y
- V se elimina como tarea independiente
- C (zod) es útil para validar bodies de los nuevos endpoints

**Estimación:** 12–16 h (incluye migración de datos y testing manual de la UI de matrices)

---

### W. Accesibilidad (a11y) básica
Sin `aria-label` en botones de íconos, foco no siempre visible, contraste no verificado.

**Tarea:** Auditoría con axe DevTools. Corregir los hallazgos críticos.

**Estimación:** 4 h (variable)

---

### X. i18n ausente
Toda la UI está hardcodeada en español. Si se requiere bilingüismo, hay que refactorizar.

**Tarea:** Si se necesita: integrar `react-i18next` y extraer strings. Si no, **omitir**.

**Estimación:** 6+ h

---

## Resumen de esfuerzo

| Prioridad | Tareas | Horas estimadas |
|---|---|---|
| 🔴 Alta | 7 (A, B, C, D, E, F, Y) | ~17 h |
| 🟠 Media | 8 (G, H, I, J, K, L, M, N) | ~22 h |
| 🟡 Baja | 9 (O, P, Q, R, S, T, U, W, X) | ~30+ h |

> Nota: V está marcado como sub-tarea de Y, no se cuenta aparte.

---

## Roadmap sugerido

**Sprint 1 (1 día):** E (firewall + backup task), F (cambiar password admin), D (npm audit)
**Sprint 2 (1 día):** A mitigación (1–2 h), C (validación con zod), M (CORS)
**Sprint 3 (2 días):** B (CSRF), G (strict TS), N (graceful shutdown), L (CSP), K (health check)
**Sprint 4 (2 días):** I (ESLint/Prettier), J (migraciones)
**Sprint 5 (3 días):** **Y (sistema granular de permisos)** — absorbe A y V
**Sprint 6 (futuro):** H (tests críticos), O, P, R, Q, S, T, U, W, X según prioridad del negocio

---

## Cómo usar esta lista

1. Marcar la tarea como completada en este archivo al finalizarla
2. Commit con `tipo: descripción corta` referenciando la letra (ej. `fix(A): guard de rol en /programacion`)
3. Si una tarea cambia de alcance, actualizar este documento
4. Si surge una nueva necesidad, añadirla con la prioridad correspondiente
