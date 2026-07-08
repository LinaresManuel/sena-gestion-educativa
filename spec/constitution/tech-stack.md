# Stack Tecnológico y Convenciones

## Core Stack

### Backend — Node.js + Express 4

| Componente | Tecnología | Justificación |
|---|---|---|
| Runtime | Node.js 20 LTS | Ecosistema maduro, compatible con Windows Server, ejecutable único para frontend+backend |
| Framework HTTP | Express 4 | Minimalista, sin opinión, ampliamente conocido. Todo el CRUD y middleware en un solo archivo (`server.ts`) |
| Autenticación | JWT + `bcryptjs` + `cookie-parser` | Token firmado en cookie httpOnly. Sin sesiones en servidor. Sin dependencia externa de auth |
| Logger | Pino + `pino-pretty` | Logger estructurado de baja latencia. A archivo en producción, a stdout coloreado en desarrollo |
| Rate limiting | `express-rate-limit` | Protección en endpoint de login (10 req/min por IP) |
| Seguridad | `helmet` | Cabeceras HTTP de seguridad |

### Frontend — React 19 + Vite 6

| Componente | Tecnología | Justificación |
|---|---|---|
| UI Framework | React 19 | Última versión estable con concurrent features. Componentes funcionales + hooks |
| Build tool | Vite 6 | HMR ultrarrápido, tree-shaking nativo, plugin system |
| Ruteo | React Router 7 | Enrutador declarativo con loaders, actions y navegación a pila completa |
| Estilos | TailwindCSS 4 | Utility-first, cero runtime, builds pequeños. Sin dependencia de CSS-in-JS |
| Iconos | Lucide React | Tree-shakeable, consistente, licencia MIT |
| Animaciones | Motion (Framer Motion) | Animaciones declarativas para transiciones de componentes |

### Base de Datos — SQLite + Drizzle ORM

| Componente | Tecnología | Justificación |
|---|---|---|
| Motor | SQLite 3 (`better-sqlite3`) | Sin servidor, embebido, cero configuración. Perfecto para entornos LAN y despliegues Windows |
| ORM | Drizzle ORM | Tipado fuerte, consultas SQL-like, migraciones con `drizzle-kit`. Más liviano que Prisma |
| Modo de conexión | WAL + `foreign_keys = ON` + `synchronous = NORMAL` | Balance óptimo entre rendimiento e integridad referencial |

### Herramientas de Desarrollo

| Herramienta | Uso |
|---|---|
| TypeScript 5.8 | Tipado estático en frontend y backend |
| `tsx` | Ejecución de TypeScript en desarrollo (sin compilación previa) |
| `esbuild` | Bundle del backend para producción (`dist/server.cjs`) |
| `rimraf` | Limpieza multiplataforma de artefactos de build |

## Convenciones de Desarrollo

### Estructura del proyecto

```
/
├── src/
│   ├── components/       # Componentes de vista por módulo CRUD
│   ├── db/               # Conexión y esquema Drizzle
│   ├── lib/              # Utilidades (auth-context, logger, sse)
│   ├── middleware/        # Middleware Express (auth, permisos, logging, auditoría)
│   ├── modules/          # Definiciones de permisos por módulo
│   │   ├── <modulo>/
│   │   │   └── permissions.ts
│   │   └── index.ts      # Registro central de módulos
│   └── routes/           # Rutas Express (/api/auth/*)
├── scripts/              # PowerShell scripts de operación
├── docs/                 # Documentación técnica
├── server.ts             # Entry point Express (+ API CRUD inline)
├── seed.ts               # Poblado inicial de datos
└── spec/                 # Especificación y artefactos de arquitectura
```

### Nombrado

- **Archivos**: `PascalCase` para componentes React (`RegionalesView.tsx`), `kebab-case` para utilidades (`auth-context.ts`)
- **Variables y funciones**: `camelCase`
- **Interfaces y tipos**: `PascalCase` con nombre descriptivo (`AuthUser`, `Permiso`, `Role`)
- **Tablas BD**: `snake_case` en inglés (`centros_formacion`, `roles_permisos`)
- **Rutas API**: Prefijo `/api/<recurso>`, plural (`/api/regionales`, `/api/admin/roles/:rol/permisos`)

### Ramas (Git)

- `main` — Rama de producción. Solo recibe merges vía fast-forward desde el workspace.
- `workspace` — Remote local para sincronizar con la copia de deploy.
- Commits directos a `main` (proyecto unipersonal). Prefijo semántico: `feat:`, `fix:`, `docs:`, `refactor:`.

### Patrones de código

- **CRUD**: Cada módulo tiene su vista (`*View.tsx`), que sigue el patrón `mayCrear / mayEditar / mayEliminar` con `useHasPermission()`.
- **Permisos**: Nunca verificar `user.rol` directamente para decisiones UI; usar los hooks de `auth-context.ts`.
- **Fetch**: No usar `credentials` en llamadas `fetch()` — el wrapper global en `src/main.tsx` lo inyecta automáticamente.
- **Confirmación de eliminación**: Siempre usar `<ConfirmDialog>` antes de ejecutar un DELETE.

## Entorno de Desarrollo

### Requisitos mínimos

- Node.js 20 LTS (probado en Windows Server 2022 / Windows 10+)
- npm 10+
- PowerShell 5.1+ (para scripts de operación)
- Windows Defender / Firewall: puerto 3000 abierto (script `scripts/open-firewall.ps1`)

### Setup

```bash
npm install
npm run db:push
npm run seed
npm run dev        # http://localhost:3000
```

### Producción

```bash
npm run build
# Iniciar como servicio Windows con NSSM
# Ver scripts/deploy.ps1 y docs/DEPLOYMENT.md
```
