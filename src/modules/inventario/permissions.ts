export const INVENTARIO_PERMISSIONS = [
  { codigo: 'inventario.ver', nombre: 'Ver Inventario', modulo: 'inventario', accion: 'ver', descripcion: 'Ver elementos del inventario' },
  { codigo: 'inventario.crear', nombre: 'Crear Elemento', modulo: 'inventario', accion: 'crear', descripcion: 'Crear nuevos elementos en inventario' },
  { codigo: 'inventario.editar', nombre: 'Editar Elemento', modulo: 'inventario', accion: 'editar', descripcion: 'Modificar elementos del inventario' },
  { codigo: 'inventario.eliminar', nombre: 'Eliminar Elemento', modulo: 'inventario', accion: 'eliminar', descripcion: 'Eliminar elementos del inventario' },
] as const;
