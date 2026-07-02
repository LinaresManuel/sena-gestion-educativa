export const NOTAS_PERMISSIONS = [
  { codigo: 'notas.ver', nombre: 'Ver Notas', modulo: 'notas', accion: 'ver', descripcion: 'Ver notas y evaluaciones' },
  { codigo: 'notas.registrar', nombre: 'Registrar Notas', modulo: 'notas', accion: 'registrar', descripcion: 'Registrar notas de aprendices' },
  { codigo: 'notas.editar', nombre: 'Editar Notas', modulo: 'notas', accion: 'editar', descripcion: 'Modificar notas existentes' },
  { codigo: 'notas.eliminar', nombre: 'Eliminar Notas', modulo: 'notas', accion: 'eliminar', descripcion: 'Eliminar registros de notas' },
] as const;
