# Onboarding para workspace de desarrollo (IA / nuevo PC)

## Propósito

Esta guía permite a un agente de IA (o desarrollador) clonar y ejecutar el proyecto **SENA Gestión Educativa** en un PC nuevo, como workspace de desarrollo — **sin** instalar ni configurar el servicio de Windows (NSSM). Todo corre bajo `npm run dev`.

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/LinaresManuel/sena-gestion-educativa.git
cd sena-gestion-educativa
```

> **Consejo para IA:** No crees ni modifiques archivos en la raíz del repo a menos que sea estrictamente necesario. Todo el código fuente está en `src/`.

---

## 2. Variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
JWT_SECRET=dev-secret-minimo-32-caracteres-cambiame
DATABASE_URL=data.db
COOKIE_SECURE=false
PORT=3000
APP_URL=http://localhost:3000
SESSION_TTL_HOURS=8
```

- El `JWT_SECRET` debe tener **al menos 32 caracteres** o el servidor falla al arrancar.
- `DATABASE_URL=data.db` crea la BD en la raíz del proyecto (relativo a `cwd`).
- `COOKIE_SECURE=false` permite usar cookies sin HTTPS (LAN/localhost).

---

## 3. Instalar dependencias

```bash
npm install
```

---

## 4. Inicializar base de datos

```bash
# Aplicar esquema de tablas
npm run db:push

# Poblar datos de prueba (idempotente, seguro ejecutar varias veces)
npm run seed
```

El seed crea:
- 2 regionales, 2 centros, 3 tipos de ambiente, 4 ambientes
- 5 instructores con perfiles y horarios
- 3 programas con 54 competencias y 207 RAPs (con horas distribuidas)
- 4 fichas con fechas vigentes (ene–dic 2026)
- Usuario admin (`admin` / `Admin123!`)
- 43 permisos, 5 roles, y asignaciones

---

## 5. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación queda en `http://localhost:3000`.

**Login:** `admin` / `Admin123!`

El modo dev sirve el frontend con Vite middleware (hot reload) + Express API en el mismo puerto.

---

## 6. Estructura del proyecto

```
/
├── server.ts                  # API Express + CRUD (inline, ~1337 líneas)
├── seed.ts                    # Poblado de datos de prueba
├── drizzle.config.ts          # Config de Drizzle Kit
├── .env.local                 # Variables de entorno (NO commitar)
├── package.json               # Scripts y dependencias
│
├── src/
│   ├── main.tsx               # Entry point React + fetch wrapper (credentials: include)
│   ├── App.tsx                # Router + layout + sidebar
│   ├── config.ts              # Carga de .env.local
│   ├── db/
│   │   ├── index.ts           # Conexión SQLite (WAL)
│   │   └── schema.ts          # Esquema de 22 tablas (Drizzle ORM)
│   ├── lib/
│   │   ├── logger.ts          # Pino logger
│   │   └── auth-context.ts    # Hooks de permisos (useHasPermission, etc.)
│   ├── middleware/
│   │   ├── auth.ts            # JWT + cookie middleware
│   │   ├── request-logger.ts
│   │   ├── audit.ts
│   │   └── error-handler.ts
│   ├── routes/
│   │   ├── auth.ts            # Login, logout, me
│   │   └── admin.ts           # CRUD usuarios, roles, permisos
│   ├── modules/
│   │   └── index.ts           # Módulos y permisos del sistema
│   └── components/
│       ├── FichasView.tsx      # CRUD fichas con cuadrícula horaria
│       ├── ProgramacionInstructoresView.tsx  # Programación semanal
│       ├── InstructoresView.tsx # CRUD instructores con agenda
│       ├── ProgramasView.tsx   # CRUD programas
│       ├── CurriculoModal.tsx  # Gestión competencias/RAPs
│       ├── SearchableSelect.tsx # Select con búsqueda
│       ├── ConfirmDialog.tsx   # Diálogo de confirmación reutilizable
│       ├── AdminPanel.tsx      # Panel de administración
│       └── ...                 # Otros CRUDs (Regionales, Centros, etc.)
│
├── scripts/
│   ├── extract-pdf-text.py    # Extrae texto de PDF con PyMuPDF
│   ├── extract-curriculo.py   # Pipeline PDF → texto → LLM → JSON (OpenRouter)
│   ├── guia_extraccion_diseno_curricular.md  # System prompt para extracción por IA
│   ├── sync-schema-v2.cjs     # Sincroniza esquema BD entre workspace y deploy
│   └── *.ps1                  # Scripts PowerShell (servicio, backup, etc.)
│
├── spec/features/             # Especificaciones de features (obligatorio crear antes de implementar)
│   ├── 006-extraccion-curriculo/
│   ├── 007-rediseno-programacion/
│   └── 008-agenda-instructor/
│
├── extraccion/                # Recursos para extracción curricular (PDFs, guías, textos)
├── docs/                      # Documentación del proyecto
└── curriculos-json/           # JSONs extraídos para verificación
```

---

## 7. Flujo de trabajo obligatorio

### 7.1. Antes de implementar cualquier feature

1. Crear carpeta en `spec/features/00X-nombre-feature/`
2. Crear `spec.md` (qué y para qué, criterios de aceptación)
3. Crear `plan.md` (cómo, qué archivos modificar)
4. Crear `tasks.md` (checklist de implementación)
5. **Solo entonces** empezar a modificar código fuente

### 7.2. Después de implementar

```bash
# Typecheck
npm run lint

# Commit
git add <archivos>
git commit -m "tipo: descripción"

# Push al remoto
git push origin main
```

### 7.3. Reglas importantes

| Regla | Explicación |
|---|---|
| **No commitear `.env.local`** | Está en `.gitignore`. Contiene secretos. |
| **No commitear `.agents/` ni `skills-lock.json`** | Son archivos locales del agente. |
| **No arreglar errores TS pre-existentes** | `React.FormEvent`, `req.user`, `unknown.length` son del template original. |
| **No crear tests** | El proyecto **no** tiene framework de tests. |
| **Siempre crear spec/plan/tasks** | Antes de escribir código fuente. |
| **`credentials: 'include'` va en `main.tsx`** | No agregar en llamadas `fetch()` individuales. |

---

## 8. Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server con hot reload en :3000 |
| `npm run build` | Build de producción (frontend + backend) |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run db:push` | Aplica esquema a la BD |
| `npm run seed` | Puebla datos de prueba (idempotente) |
| `npm run clean` | Limpia `dist/` y `server.js` |

---

## 9. Errores frecuentes

### 9.1. `JWT_SECRET` muy corto
El proceso sale con código 1 si el secret tiene menos de 32 caracteres.

### 9.2. `npm run dev` no arranca porque el puerto 3000 está ocupado
Otra instancia o el servicio NSSM está corriendo. Detenerlo o cambiar `PORT` en `.env.local`.

### 9.3. La cookie no se envía
Síntoma: el login funciona pero las requests devuelven 401. Causa: el cliente accede por `localhost` y la cookie se seteó en `127.0.0.1` (o viceversa). Usar **un único hostname** durante toda la sesión.

### 9.4. `npm run db:push` pide confirmación interactiva
Drizzle-kit detecta cambios conflictivos. Solución: usar `npx drizzle-kit push --force` o generar migración con `npx drizzle-kit generate` y aplicarla con `npx drizzle-kit migrate`.

---

## 10. Para agentes de IA: qué NO hacer

- ❌ No modificar `server.ts` para agregar pequeñas rutas — hay un patrón establecido, seguirlo.
- ❌ No cambiar la estructura de carpetas sin consultar.
- ❌ No instalar nuevas dependencias sin necesidad justificada.
- ❌ No eliminar código comentado o imports sin verificar que no se usan.
- ❌ No asumir que el proyecto tiene tests.
- ❌ No usar `dotenv` — la carga de `.env.local` ya está implementada en `src/config.ts`.
- ❌ No asumir que el servicio NSSM está disponible (solo en el PC de deploy).
- ✅ **Siempre** crear spec/plan/tasks antes de implementar.
- ✅ **Siempre** revisar `AGENTS.md` y la documentación en `docs/` antes de actuar.
