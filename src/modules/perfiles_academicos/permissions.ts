export const PERFILES_ACADEMICOS_PERMISSIONS = [
  { codigo: 'perfiles_academicos.ver', nombre: 'Ver Perfiles Académicos', modulo: 'perfiles_academicos', accion: 'ver', descripcion: 'Ver listado de perfiles académicos' },
  { codigo: 'perfiles_academicos.crear', nombre: 'Crear Perfil Académico', modulo: 'perfiles_academicos', accion: 'crear', descripcion: 'Crear nuevos perfiles académicos' },
  { codigo: 'perfiles_academicos.editar', nombre: 'Editar Perfil Académico', modulo: 'perfiles_academicos', accion: 'editar', descripcion: 'Editar perfiles académicos existentes' },
  { codigo: 'perfiles_academicos.eliminar', nombre: 'Eliminar Perfil Académico', modulo: 'perfiles_academicos', accion: 'eliminar', descripcion: 'Eliminar perfiles académicos' },
] as const;
