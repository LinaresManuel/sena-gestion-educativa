export const CURSOS_PERMISSIONS = [
  { codigo: 'cursos.ver', nombre: 'Ver Cursos', modulo: 'cursos', accion: 'ver', descripcion: 'Ver información de cursos y fichas' },
  { codigo: 'cursos.crear', nombre: 'Crear Curso', modulo: 'cursos', accion: 'crear', descripcion: 'Crear nuevos cursos/fichas' },
  { codigo: 'cursos.editar', nombre: 'Editar Curso', modulo: 'cursos', accion: 'editar', descripcion: 'Modificar información de cursos' },
  { codigo: 'cursos.eliminar', nombre: 'Eliminar Curso', modulo: 'cursos', accion: 'eliminar', descripcion: 'Eliminar cursos/fichas' },
] as const;
