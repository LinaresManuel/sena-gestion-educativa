export const PROGRAMAS_PERMISSIONS = [
  { codigo: 'programas.ver', nombre: 'Ver Programas', modulo: 'programas', accion: 'ver', descripcion: 'Ver programas de formación' },
  { codigo: 'programas.crear', nombre: 'Crear Programa', modulo: 'programas', accion: 'crear', descripcion: 'Crear nuevos programas de formación' },
  { codigo: 'programas.editar', nombre: 'Editar Programa', modulo: 'programas', accion: 'editar', descripcion: 'Editar programas y su currículo' },
  { codigo: 'programas.eliminar', nombre: 'Eliminar Programa', modulo: 'programas', accion: 'eliminar', descripcion: 'Eliminar programas de formación' },
] as const;
