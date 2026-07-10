# Plan — Reordenar Módulos por Relación

## Estrategia técnica

Reordenar bloques JSX y entradas de objeto en 3 ubicaciones dentro de 2 archivos. No hay cambios de lógica, solo de presentación.

## Nuevo orden (de arriba a abajo)

1. Dashboard
2. Regionales
3. Centros
4. Ambientes
5. Tipos de Ambientes
6. Instructores
7. Perfiles Académicos
8. Programas
9. Fichas
10. Programación
11. Administración

## Archivos a modificar

### 1. `src/App.tsx` — Dashboard (grid de tarjetas)

**Lugar:** función `Dashboard`, bloque `grid grid-cols-1 md:grid-cols-4 gap-6 mt-8` (líneas ~47-98).

Reordenar los 9 `<Link>` condicionales:
- Regionales (canViewRegionales)
- Centros (canViewCentros)
- Ambientes (canViewAmbientes)
- Programas → mover después de Perfiles Académicos
- Instructores → mover antes de Perfiles Académicos
- Fichas → mover después de Programas
- Programación → mover después de Fichas
- Administración (isAdmin) — queda al final

### 2. `src/App.tsx` — Sidebar (nav)

**Lugar:** función `PrivateLayout`, bloque `<nav>` (líneas ~128-165).

Reordenar los mismos enlaces en el mismo orden que el dashboard.

### 3. `src/modules/index.ts` — PERMISSIONS_BY_MODULE

**Lugar:** líneas ~29-40.

Reordenar las claves del objeto:

```typescript
export const PERMISSIONS_BY_MODULE = {
  inicio: ...,
  regionales: ...,
  centros: ...,
  ambientes: ...,
  tipos_ambiente: ...,
  instructores: ...,       // Movido aquí
  perfiles_academicos: ..., // Movido aquí
  programas: ...,
  fichas: ...,
  programacion: ...,
  admin: ...,
};
```

## Lo que NO cambia

- Rutas de React Router (se resuelven por path, no por orden)
- Hooks de permisos (`useHasPermission`)
- Componentes de vista
- Lógica de negocio
