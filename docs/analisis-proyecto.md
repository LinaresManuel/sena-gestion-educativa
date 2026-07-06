# Análisis del Proyecto: sena-gestion-educativa

Documento generado a partir de la inspección del repositorio. Describe el stack tecnológico, el modelo de datos, el estado del backend y los requisitos para ejecutar el proyecto en local.

---

## 1. Descripción general

Aplicación web para la **gestión educativa del SENA** (Servicio Nacional de Aprendizaje). Permite administrar regionales, centros de formación, ambientes, instructores, programas, competencias, fichas y la programación de instructores.

---

## 2. Stack tecnológico

### 2.1 Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.0.1 | Framework de UI |
| Vite | 6.2.3 | Bundler y dev server |
| TypeScript | 5.8.2 | Tipado estático |
| TailwindCSS | 4.1.14 | Estilos utilitarios |
| React Router DOM | 7.15.0 | Navegación SPA |
| Motion | 12.23.24 | Animaciones |
| Lucide React | 0.546.0 | Iconografía |

### 2.2 Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js + Express | 4.21.2 | Servidor HTTP y API REST |
| tsx | 4.21.0 | Ejecución de TypeScript en dev |
| esbuild | 0.25.0 | Bundling del server en build |

> El backend está embebido en `server.ts` y se monta como middleware del propio Vite dev server. **La misma instancia sirve el frontend y la API** en `http://localhost:3000`.

---

## 3. Modelo de datos — SQL (SQLite)

Se utiliza **Drizzle ORM** sobre **better-sqlite3** con base de datos en `C:\sena-data\db\data.db` (producción) o `data.db` relativo (desarrollo).

**Tipo de base de datos:** SQL relacional.
**Driver:** `better-sqlite3` (síncrono, embebido).
**ORM:** Drizzle ORM 0.45.2 con migraciones gestionadas por `drizzle-kit`.

### 3.1 Diagrama de tablas

| Tabla | Propósito |
|---|---|
| `regionales` | Regionales del SENA |
| `centros_formacion` | Centros por regional |
| `tipos_ambiente` | Catálogo de tipos (taller, aula, laboratorio, etc.) |
| `ambientes` | Ambientes físicos por centro |
| `elementos_ambiente` | Elementos/equipos dentro de un ambiente |
| `instructores` | Personal instructor |
| `programas` | Programas de formación |
| `competencias` | Competencias asociadas a un programa |
| `resultados_aprendizaje` | Resultados de aprendizaje por competencia |
| `perfiles_instructor` | Perfiles requeridos por competencia |
| `fichas` | Fichas/grupos de aprendices |
| `programacion_instructores` | Asignación instructor–ficha con eventos |

### 3.2 Características del esquema

- **Claves primarias:** autoincrementales (`integer`).
- **Claves foráneas:** con `onDelete: 'cascade'` en relaciones dependiente (elementos, competencias, resultados, perfiles).
- **Constraints `UNIQUE`:** en `regionales.codigo`, `centros_formacion.codigo`, `tipos_ambiente.nombre`, `ambientes.codigo`, `instructores.documento`, `fichas.numero_ficha` y en la combinación `(programas.codigo, programas.version)`.
- **Campos JSON** (`mode: 'json'`):
  - `instructores.requisitos_academicos`
  - `fichas.horario` — `{ [dia]: string[] }`
  - `programacion_instructores.resultados_ids`
  - `programacion_instructores.eventos` — `{ [isoDate]: { [hora]: resultadoId } }`

---

## 4. Estado del backend

**El backend está completamente funcional.** Se expone una API REST con operaciones CRUD para todas las entidades.

### 4.1 Endpoints principales

| Método | Ruta | Recurso |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/api/regionales` | Regionales |
| `GET/POST/PUT/DELETE` | `/api/centros` | Centros de formación |
| `GET/POST/PUT/DELETE` | `/api/tipos-ambiente` | Tipos de ambiente |
| `GET/POST/PUT/DELETE` | `/api/ambientes` | Ambientes |
| `GET` | `/api/ambientes/:id/elementos` | Elementos por ambiente |
| `POST` | `/api/ambientes/:id/elementos` | Crear elemento en ambiente |
| `PUT/DELETE` | `/api/elementos-ambiente/:id` | Modificar/eliminar elemento |
| `GET/POST/DELETE` | `/api/instructores` | Instructores |
| `GET/POST/PUT/DELETE` | `/api/programas` | Programas |
| `GET/POST` | `/api/programas/:id/competencias` | Competencias por programa |
| `PUT/DELETE` | `/api/competencias/:id` | Modificar/eliminar competencia |
| `GET` | `/api/resultados` | Todos los resultados |
| `GET/POST` | `/api/competencias/:id/resultados` | Resultados por competencia |
| `PUT/DELETE` | `/api/resultados/:id` | Modificar/eliminar resultado |
| `GET` | `/api/competencias-unicas` | Competencias agrupadas por código |
| `GET` | `/api/perfiles-unicos` | Perfiles agrupados por código |
| `GET/POST` | `/api/competencias/:id/perfiles` | Perfiles por competencia |
| `PUT/DELETE` | `/api/perfiles/:id` | Modificar/eliminar perfil |
| `GET/POST/DELETE` | `/api/fichas` | Fichas |
| `PUT` | `/api/fichas/:id` | Actualizar ficha |
| `GET/POST/DELETE` | `/api/programacion-instructores` | Programación |
| `POST` | `/api/programacion-instructores/limpiar-celda` | Limpiar celda de horario |
| `DELETE` | `/api/programacion-instructores/ficha/:fichaId` | Eliminar por ficha |

### 4.2 Lógica de negocio destacada

- **Validación de choques de horario en `fichas`:** al crear una ficha se verifica que el ambiente no esté ocupado en las mismas fechas y franjas horarias. Si hay cruce, retorna `400` con el detalle del día, las horas y la ficha conflictiva.
- **Clonado de plantillas al duplicar competencias:** al crear una competencia con un código ya existente, se copian automáticamente sus `resultados_aprendizaje` y `perfiles_instructor` como plantilla.
- **Limpieza de celdas en la programación:** endpoint dedicado para eliminar una asignación específica (fecha + hora) de la grilla de programación.
- **Manejo centralizado de errores `UNIQUE`:** mensajes legibles en español para cada constraint violado.

### 4.3 Limitaciones conocidas

- ~~**No hay autenticación ni autorización** implementada.~~ ✅ Implementado: JWT con cookie httpOnly, sistema de permisos granular (39 permisos, 10 módulos).
- **No hay tests automatizados** configurados.
- ~~El archivo `data.db` está versionado en el repositorio (debería estar en `.gitignore`).~~ ✅ Corregido: la BD está en `C:\sena-data\db\data.db` fuera del repo.

---

## 5. Requisitos para correr en local

### 5.1 Prerrequisitos

- **Node.js 18+** (recomendado 20 LTS). El proyecto usa `tsx`, `vite 6` y compila con `tsc 5.8`.
- **npm** (incluido con Node).

### 5.2 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Configurar variables de entorno
#    Crear un archivo .env.local en la raíz con:
#    APP_URL=http://localhost:3000

# 3. (Opcional) Regenerar el esquema o cargar datos iniciales
npm run db:push     # Aplica el schema con Drizzle Kit
npm run seed        # Puebla la base de datos con datos iniciales

# 4. Ejecutar en desarrollo
npm run dev
```

La aplicación quedará disponible en **http://localhost:3000** (frontend + API en el mismo puerto).

> La aplicación no requiere claves de API externas para su funcionamiento básico.

### 5.3 Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `APP_URL` | Opcional | URL donde se aloja la app. Se usa para CORS y enlaces internos. |

### 5.4 Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `npm run dev` | Inicia Vite + Express en modo desarrollo (puerto 3000) |
| `build` | `npm run build` | Compila el frontend (Vite) y el backend (esbuild) |
| `start` | `npm run start` | Ejecuta el build de producción (`dist/server.cjs`) |
| `preview` | `npm run preview` | Preview de Vite |
| `lint` | `npm run lint` | Typecheck con `tsc --noEmit` |
| `db:push` | `npm run db:push` | Aplica el schema a la base de datos |
| `seed` | `npm run seed` | Puebla la BD con datos iniciales |
| `clean` | `npm run clean` | Elimina `dist` y `server.js` |

### 5.5 Estructura del proyecto

```
sena-gestion-educativa/
├── data.db                  # Base de datos SQLite (versionada)
├── server.ts                # Backend Express + middleware Vite
├── seed.ts                  # Script de datos iniciales
├── drizzle.config.ts        # Configuración de Drizzle Kit
├── index.html               # Entrada HTML de Vite
├── vite.config.ts           # Configuración de Vite
├── tsconfig.json            # Configuración de TypeScript
├── package.json
├── .env.example             # Plantilla de variables de entorno
└── src/
    ├── main.tsx             # Punto de entrada React
    ├── App.tsx              # Componente raíz con rutas
    ├── index.css            # Estilos globales (Tailwind)
    ├── components/          # Componentes UI
    └── db/
        ├── index.ts         # Instancia de Drizzle
        └── schema.ts        # Definición del esquema
```

---

## 6. Observaciones y recomendaciones

1. ~~**Mover `data.db` al `.gitignore`** para evitar versionar datos locales.~~ ✅ Corregido.
2. ~~**Añadir autenticación** si la app se va a desplegar en producción.~~ ✅ Implementado: JWT + permisos granulares.
3. **Agregar tests** (Vitest está disponible por la integración con Vite).
4. Considerar migrar las validaciones de horario a una capa de servicio o schema validation (ej. Zod) para mantener el `server.ts` más limpio.
5. Documentar los endpoints con OpenAPI/Swagger para facilitar el consumo desde el frontend.
