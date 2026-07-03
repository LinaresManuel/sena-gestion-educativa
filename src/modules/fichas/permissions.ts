export const FICHAS_PERMISSIONS = [
  { codigo: 'fichas.ver', nombre: 'Ver Fichas', modulo: 'fichas', accion: 'ver', descripcion: 'Ver fichas y cursos' },
  { codigo: 'fichas.crear', nombre: 'Crear Ficha', modulo: 'fichas', accion: 'crear', descripcion: 'Crear nuevas fichas' },
  { codigo: 'fichas.editar', nombre: 'Editar Ficha', modulo: 'fichas', accion: 'editar', descripcion: 'Editar fichas existentes' },
  { codigo: 'fichas.eliminar', nombre: 'Eliminar Ficha', modulo: 'fichas', accion: 'eliminar', descripcion: 'Eliminar fichas' },
] as const;
