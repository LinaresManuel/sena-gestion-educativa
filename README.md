# SENA Gestión Educativa

Sistema de gestión de programación académica para el SENA. Permite administrar regionales, centros de formación, ambientes, instructores, programas, competencias, fichas y la programación de horarios.

## Stack

- **Frontend:** React 19 + Vite 6 + TypeScript + TailwindCSS 4 + React Router 7
- **Backend:** Node.js + Express 4 (embebido en `server.ts`)
- **Base de datos:** SQLite con Drizzle ORM
- **Almacenamiento local:** archivo `data.db`

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- npm

## Instalación local

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Configurar la URL de la app
#    Crear .env.local con:
#    APP_URL=http://localhost:3000

# 3. Crear la base de datos y cargar datos iniciales
npm run db:push
npm run seed

# 4. Arrancar en desarrollo
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia Vite + Express en modo desarrollo |
| `npm run build` | Compila frontend y backend para producción |
| `npm start` | Ejecuta el build de producción |
| `npm run db:push` | Aplica el esquema a la base de datos |
| `npm run seed` | Puebla la base de datos con datos iniciales |
| `npm run lint` | Verifica tipos con `tsc --noEmit` |
| `npm run clean` | Elimina artefactos de build |

## Documentación

- [Análisis del proyecto](docs/analisis-proyecto.md)
- [Guía de despliegue](docs/DEPLOYMENT.md) — instalar en un PC servidor LAN
- [Guía de operaciones](docs/OPERATIONS.md) — operación diaria, respaldos, logs
- [Gestión de usuarios](docs/USERS.md) — credenciales, roles, procedimientos
