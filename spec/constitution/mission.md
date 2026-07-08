# Misión del Proyecto

## ¿Qué estamos construyendo?

**SENA Gestión Educativa (SenaSchedule)** es un sistema de planificación y programación académica para centros de formación del SENA. Es una aplicación web SPA (Single Page Application) que integra frontend y backend en un mismo proceso Node.js, permitiendo administrar la infraestructura educativa, el talento humano y la asignación de horarios de forma centralizada.

El sistema cubre la gestión completa de:

- **Infraestructura**: Regionales, centros de formación, ambientes (aulas/talleres) y tipos de ambiente.
- **Oferta académica**: Programas de formación, competencias, elementos de ambiente y fichas (grupos de aprendices).
- **Talento humano**: Instructores y su perfil de competencias.
- **Programación**: Asignación de instructores a ambientes en bloques horarios.
- **Administración**: Usuarios, roles y permisos granulares por módulo.

## ¿Para quién lo construimos?

- **Coordinadores académicos** — Planifican la oferta educativa y asignan instructores a fichas y ambientes.
- **Instructores** — Consultan su programación horaria y los ambientes asignados.
- **Administradores del sistema** — Gestionan usuarios, roles y permisos; configuran la infraestructura del centro.
- **Personal de dirección** — Supervisan la ocupación de ambientes y la carga académica.

## Propuesta de valor

1. **Unificación**: Una sola plataforma reemplaza planillas, correos y sistemas aislados para toda la gestión académica.
2. **Control de acceso granular**: Permisos por módulo y acción (ver, crear, editar, eliminar) que se adaptan a la estructura organizacional del SENA.
3. **Simplicidad operativa**: Sin dependencias externas — SQLite embebido elimina la necesidad de un servidor de base de datos. Ideal para entornos LAN con recursos limitados.
4. **Autogestión de contraseñas**: Flujo seguro de primer ingreso con cambio obligatorio de contraseña temporal.
5. **Despliegue inmediato**: Build monolítico (frontend + backend en un binario Node) que se instala en minutos vía NSSM como servicio de Windows.
