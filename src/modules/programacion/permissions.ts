export const PROGRAMACION_PERMISSIONS = [
  { codigo: 'programacion.ver', nombre: 'Ver Programación', modulo: 'programacion', accion: 'ver', descripcion: 'Ver calendario y programación de instructores' },
  { codigo: 'programacion.crear', nombre: 'Crear Programación', modulo: 'programacion', accion: 'crear', descripcion: 'Crear nuevas programaciones de instructores' },
  { codigo: 'programacion.editar', nombre: 'Editar Programación', modulo: 'programacion', accion: 'editar', descripcion: 'Modificar programaciones existentes' },
  { codigo: 'programacion.eliminar', nombre: 'Eliminar Programación', modulo: 'programacion', accion: 'eliminar', descripcion: 'Eliminar programaciones' },
] as const;
