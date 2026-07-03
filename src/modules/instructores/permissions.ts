export const INSTRUCTORES_PERMISSIONS = [
  { codigo: 'instructores.ver', nombre: 'Ver Instructores', modulo: 'instructores', accion: 'ver', descripcion: 'Ver lista de instructores' },
  { codigo: 'instructores.crear', nombre: 'Crear Instructor', modulo: 'instructores', accion: 'crear', descripcion: 'Crear nuevos instructores' },
  { codigo: 'instructores.editar', nombre: 'Editar Instructor', modulo: 'instructores', accion: 'editar', descripcion: 'Editar datos de instructores' },
  { codigo: 'instructores.eliminar', nombre: 'Eliminar Instructor', modulo: 'instructores', accion: 'eliminar', descripcion: 'Eliminar instructores' },
] as const;
