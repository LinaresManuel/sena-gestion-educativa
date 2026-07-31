# Plan — Manual de Usuario

## Estrategia

Documento Markdown autocontenido en la raíz del proyecto. No requiere cambios en código fuente.

## Fuentes de datos por sección

| Sección | Fuente principal |
|---|---|
| Portada | Proyecto general |
| Acceso e Inicio de Sesión | `src/Login.tsx`, `src/ChangePassword.tsx` |
| Entorno de Trabajo | `src/App.tsx` (PrivateLayout, Dashboard, sidebar) |
| Infraestructura | `RegionalesView.tsx`, `CentrosView.tsx`, `AmbientesView.tsx`, `TiposAmbienteView.tsx` |
| Oferta Académica | `ProgramasView.tsx`, `CurriculoModal.tsx`, `PerfilesAcademicosView.tsx` |
| Talento Humano | `InstructoresView.tsx` |
| Fichas | `FichasView.tsx` |
| Programación | `ProgramacionInstructoresView.tsx` |
| Proyecto Formativo | `ProyectoFormativoView.tsx` |
| Administración | `AdminPanel.tsx` |
| FAQ | Errores conocidos de AGENTS.md |
| Glosario | `spec/constitution/mission.md` |

## Archivos a crear

| Archivo | Acción |
|---|---|
| `spec/features/011-manual-usuario/spec.md` | Crear |
| `spec/features/011-manual-usuario/plan.md` | Crear |
| `spec/features/011-manual-usuario/tasks.md` | Crear |
| `MANUAL_DE_USUARIO.md` | Crear (raíz) |

## Lo que NO cambia

- Código fuente TypeScript
- Configuración del proyecto
- Documentación existente
