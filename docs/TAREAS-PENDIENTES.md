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

### A. Frontend no protege rutas por rol
Cualquier usuario logueado (incluso `lector`) puede acceder a `/regionales`, `/programacion`, etc., y ver/editar datos.

**Tarea:** Añadir guard de rol por ruta en `src/App.tsx`. Mínimo: bloquear `/programacion` y creación/edición de entidades para `lector`.

**Estimación:** 1–2 h

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

### V. Tabla `usuarios` sin gestión vía UI
Solo se puede crear/editar usuarios con `sqlite3` directo (documentado en `OPERATIONS.md`).

**Tarea:** Crear vista `/usuarios` (admin only) con CRUD. Reusar `requireRole('admin')`.

**Estimación:** 3–4 h

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
| 🔴 Alta | 6 | ~10 h |
| 🟠 Media | 8 | ~22 h |
| 🟡 Baja | 9 | ~30+ h |

---

## Roadmap sugerido

**Sprint 1 (1 día):** E (firewall + backup task), F (cambiar password admin), D (npm audit)
**Sprint 2 (1 día):** A (guards de rol), C (validación con zod), M (CORS)
**Sprint 3 (2 días):** B (CSRF), G (strict TS), N (graceful shutdown), L (CSP), K (health check)
**Sprint 4 (2 días):** I (ESLint/Prettier), J (migraciones)
**Sprint 5 (3 días):** H (tests críticos)
**Sprint 6 (futuro):** O, P, R, V, etc. según prioridad del negocio

---

## Cómo usar esta lista

1. Marcar la tarea como completada en este archivo al finalizarla
2. Commit con `tipo: descripción corta` referenciando la letra (ej. `fix(A): guard de rol en /programacion`)
3. Si una tarea cambia de alcance, actualizar este documento
4. Si surge una nueva necesidad, añadirla con la prioridad correspondiente
