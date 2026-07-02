export const SALONES_PERMISSIONS = [
  { codigo: 'salones.ver', nombre: 'Ver Salones', modulo: 'salones', accion: 'ver', descripcion: 'Ver ambientes y salones' },
  { codigo: 'salones.crear', nombre: 'Crear Salón', modulo: 'salones', accion: 'crear', descripcion: 'Crear nuevos ambientes' },
  { codigo: 'salones.editar', nombre: 'Editar Salón', modulo: 'salones', accion: 'editar', descripcion: 'Modificar información de ambientes' },
  { codigo: 'salones.eliminar', nombre: 'Eliminar Salón', modulo: 'salones', accion: 'eliminar', descripcion: 'Eliminar ambientes' },
] as const;
