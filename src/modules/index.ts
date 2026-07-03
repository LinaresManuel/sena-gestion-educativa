import { INICIO_PERMISSIONS } from './inicio/permissions';
import { REGIONALES_PERMISSIONS } from './regionales/permissions';
import { CENTROS_PERMISSIONS } from './centros/permissions';
import { AMBIENTES_PERMISSIONS } from './ambientes/permissions';
import { TIPOS_AMBIENTE_PERMISSIONS } from './tipos_ambiente/permissions';
import { PROGRAMAS_PERMISSIONS } from './programas/permissions';
import { INSTRUCTORES_PERMISSIONS } from './instructores/permissions';
import { FICHAS_PERMISSIONS } from './fichas/permissions';
import { PROGRAMACION_PERMISSIONS } from './programacion/permissions';
import { ADMIN_PERMISSIONS } from './admin/permissions';

// Auto-discovery: importar todos los permisos de módulos
export const ALL_MODULE_PERMISSIONS = [
  ...INICIO_PERMISSIONS,
  ...REGIONALES_PERMISSIONS,
  ...CENTROS_PERMISSIONS,
  ...AMBIENTES_PERMISSIONS,
  ...TIPOS_AMBIENTE_PERMISSIONS,
  ...PROGRAMAS_PERMISSIONS,
  ...INSTRUCTORES_PERMISSIONS,
  ...FICHAS_PERMISSIONS,
  ...PROGRAMACION_PERMISSIONS,
  ...ADMIN_PERMISSIONS,
];

// Agrupar por módulo (en orden del sidebar)
export const PERMISSIONS_BY_MODULE = {
  inicio: INICIO_PERMISSIONS,
  regionales: REGIONALES_PERMISSIONS,
  centros: CENTROS_PERMISSIONS,
  ambientes: AMBIENTES_PERMISSIONS,
  tipos_ambiente: TIPOS_AMBIENTE_PERMISSIONS,
  programas: PROGRAMAS_PERMISSIONS,
  instructores: INSTRUCTORES_PERMISSIONS,
  fichas: FICHAS_PERMISSIONS,
  programacion: PROGRAMACION_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

// Todos los módulos disponibles (en orden del sidebar)
export const AVAILABLE_MODULES = Object.keys(PERMISSIONS_BY_MODULE);

// Obtener permisos de un módulo específico
export function getModulePermissions(modulo: string) {
  return PERMISSIONS_BY_MODULE[modulo as keyof typeof PERMISSIONS_BY_MODULE] || [];
}

// Obtener todos los códigos de permisos
export function getAllPermissionCodes(): string[] {
  return ALL_MODULE_PERMISSIONS.map(p => p.codigo);
}

// Verificar si un permiso existe
export function permissionExists(codigo: string): boolean {
  return ALL_MODULE_PERMISSIONS.some(p => p.codigo === codigo);
}
