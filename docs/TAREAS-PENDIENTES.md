# Tareas Pendientes — SENA Gestión Educativa

Lista de implementaciones identificadas como necesarias o recomendables para completar el proyecto, organizada por prioridad. Generada tras el análisis del estado actual.

---

## Estado actual

**Implementado y funcional:**
- Auth JWT con cookie `httpOnly` y **sistema de permisos granular** (5 roles, 30 permisos, 8 módulos)
- CRUD completo de todas las entidades (regionales, centros, ambientes, instructores, programas, fichas, programación)
- Persistencia en SQLite con WAL mode en `C:\sena-data\db\`
- Servicio de Windows (NSSM) con auto-arranque y auto-restart
- Backups automáticos vía tarea programada (si está instalada)
- Logger estructurado (pino) con auditoría de mutaciones
- Health check, helmet, rate limit en `/api/auth`
- Panel de administración para gestión de roles y permisos
- Documentación de despliegue y operaciones

**Último commit:** `97f8def feat: agregar script de prueba de permisos`

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

**✅ IMPLEMENTADO COMPLETAMENTE**

Sistema de permisos granular que sustituye los 3 roles fijos por un modelo donde cada módulo declara sus permisos y la UI los muestra/oculta según los permisos asignados al usuario.

**Componentes implementados:**

1. **Esquema de BD:**
   - `permisos` (id, codigo, nombre, modulo, accion, descripcion)
   - `roles_permisos` (id, rol, permiso_id) — N:M
   - `usuarios_roles` (id, usuario_id, rol) — N:M

2. **Módulos de permisos:**
   - `src/modules/*/permissions.ts` — 8 módulos con 30 permisos totales
   - `src/modules/index.ts` — auto-descubrimiento de permisos

3. **Backend:**
   - JWT incluye array `permisos` con códigos
   - Middlewares: `requirePermission`, `requireAnyPermission`, `requireAllPermissions`
   - Endpoints admin: `/api/admin/roles`, `/api/admin/permisos`, `/api/admin/usuarios`

4. **Frontend:**
   - Hooks: `useHasPermission`, `useHasAnyPermission`, `useIsAdmin`
   - Componente: `RequirePermission` para proteger elementos UI
   - Sidebar dinámico que se filtra por permisos
   - Panel de administración con gestión visual de roles y permisos

5. **Migración:**
   - Script: `scripts/migrate-to-permissions.ts`
   - Verificación: `scripts/verify-permissions.ts`
   - Pruebas: `scripts/test-permissions.ts`

**Estimación original:** 12–16 h → **Completado en ~6 h**

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

### Z. Roles personalizados no se visualizan en la UI
**✅ IMPLEMENTADO**

Los roles creados desde el panel de administración ahora aparecen en la pestaña de "Roles y Permisos" al asignar permisos, y en el formulario de creación/edición de usuarios.

**Solución:**
- `AVAILABLE_ROLES` hardcodeado reemplazado por `SYSTEM_ROLES` (solo para protección de eliminación)
- `UserFormModal` ahora recibe `rolesDisponibles` desde la API (`/api/admin/roles`)
- La pestaña Roles y Permisos carga roles dinámicamente desde la API

**Estimación:** 30 min → **Completado**

---

## Resumen de esfuerzo

| Prioridad | Tareas | Horas estimadas |
|---|---|---|
| 🔴 Alta | 7 (A, B, C, D, E, F, Y) | ~17 h (Y completado: 6 h) |
| 🟠 Media | 8 (G, H, I, J, K, L, M, N) | ~22 h |
| 🟡 Baja | 10 (O, P, Q, R, S, T, U, W, X, Z) | ~30+ h |

> Nota: V está marcado como sub-tarea de Y, no se cuenta aparte. Y ya está completado.

---

## Roadmap sugerido

**Sprint 1 (1 día):** E (firewall + backup task), F (cambiar password admin), D (npm audit)
**Sprint 2 (1 día):** A mitigación (1–2 h), C (validación con zod), M (CORS)
**Sprint 3 (2 días):** B (CSRF), G (strict TS), N (graceful shutdown), L (CSP), K (health check)
**Sprint 4 (2 días):** I (ESLint/Prettier), J (migraciones)
**Sprint 5 (3 días):** ✅ **Y (sistema granular de permisos)** — COMPLETADO
**Sprint 6 (futuro):** H (tests críticos), O, P, R, Q, S, T, U, W, X según prioridad del negocio

---

## Cómo usar esta lista

1. Marcar la tarea como completada en este archivo al finalizarla
2. Commit con `tipo: descripción corta` referenciando la letra (ej. `fix(A): guard de rol en /programacion`)
3. Si una tarea cambia de alcance, actualizar este documento
4. Si surge una nueva necesidad, añadirla con la prioridad correspondiente
