export const CENTROS_PERMISSIONS = [
  { codigo: 'centros.ver', nombre: 'Ver Centros', modulo: 'centros', accion: 'ver', descripcion: 'Ver lista de centros de formación' },
  { codigo: 'centros.crear', nombre: 'Crear Centro', modulo: 'centros', accion: 'crear', descripcion: 'Crear nuevos centros de formación' },
  { codigo: 'centros.editar', nombre: 'Editar Centro', modulo: 'centros', accion: 'editar', descripcion: 'Editar centros existentes' },
  { codigo: 'centros.eliminar', nombre: 'Eliminar Centro', modulo: 'centros', accion: 'eliminar', descripcion: 'Eliminar centros de formación' },
] as const;
