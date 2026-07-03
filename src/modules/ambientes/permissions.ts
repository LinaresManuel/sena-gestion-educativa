export const AMBIENTES_PERMISSIONS = [
  { codigo: 'ambientes.ver', nombre: 'Ver Ambientes', modulo: 'ambientes', accion: 'ver', descripcion: 'Ver ambientes y salones' },
  { codigo: 'ambientes.crear', nombre: 'Crear Ambiente', modulo: 'ambientes', accion: 'crear', descripcion: 'Crear nuevos ambientes' },
  { codigo: 'ambientes.editar', nombre: 'Editar Ambiente', modulo: 'ambientes', accion: 'editar', descripcion: 'Editar ambientes y sus elementos de inventario' },
  { codigo: 'ambientes.eliminar', nombre: 'Eliminar Ambiente', modulo: 'ambientes', accion: 'eliminar', descripcion: 'Eliminar ambientes' },
] as const;
