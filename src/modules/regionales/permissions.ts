export const REGIONALES_PERMISSIONS = [
  { codigo: 'regionales.ver', nombre: 'Ver Regionales', modulo: 'regionales', accion: 'ver', descripcion: 'Ver lista de regionales' },
  { codigo: 'regionales.crear', nombre: 'Crear Regional', modulo: 'regionales', accion: 'crear', descripcion: 'Crear nuevas regionales' },
  { codigo: 'regionales.editar', nombre: 'Editar Regional', modulo: 'regionales', accion: 'editar', descripcion: 'Editar regionales existentes' },
  { codigo: 'regionales.eliminar', nombre: 'Eliminar Regional', modulo: 'regionales', accion: 'eliminar', descripcion: 'Eliminar regionales' },
] as const;
