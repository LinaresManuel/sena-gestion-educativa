export const ADMIN_PERMISSIONS = [
  { codigo: 'admin.ver', nombre: 'Ver Admin', modulo: 'admin', accion: 'ver', descripcion: 'Acceder al panel de administración' },
  { codigo: 'admin.crear', nombre: 'Crear Usuario', modulo: 'admin', accion: 'crear', descripcion: 'Crear nuevos usuarios' },
  { codigo: 'admin.editar', nombre: 'Editar Usuario', modulo: 'admin', accion: 'editar', descripcion: 'Editar usuarios y resetear contraseñas' },
  { codigo: 'admin.eliminar', nombre: 'Eliminar Usuario', modulo: 'admin', accion: 'eliminar', descripcion: 'Eliminar usuarios del sistema' },
  { codigo: 'admin.roles', nombre: 'Gestionar Roles', modulo: 'admin', accion: 'roles', descripcion: 'Gestionar roles y permisos' },
] as const;
