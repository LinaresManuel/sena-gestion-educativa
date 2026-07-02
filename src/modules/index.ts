import { INICIO_PERMISSIONS } from './inicio/permissions';
import { PROGRAMACION_PERMISSIONS } from './programacion/permissions';
import { COMUNICACION_PERMISSIONS } from './comunicacion/permissions';
import { INVENTARIO_PERMISSIONS } from './inventario/permissions';
import { CURSOS_PERMISSIONS } from './cursos/permissions';
import { SALONES_PERMISSIONS } from './salones/permissions';
import { NOTAS_PERMISSIONS } from './notas/permissions';
import { ASISTENCIA_PERMISSIONS } from './asistencia/permissions';
import { ADMIN_PERMISSIONS } from './admin/permissions';

// Auto-discovery: importar todos los permisos de módulos
export const ALL_MODULE_PERMISSIONS = [
  ...INICIO_PERMISSIONS,
  ...PROGRAMACION_PERMISSIONS,
  ...COMUNICACION_PERMISSIONS,
  ...INVENTARIO_PERMISSIONS,
  ...CURSOS_PERMISSIONS,
  ...SALONES_PERMISSIONS,
  ...NOTAS_PERMISSIONS,
  ...ASISTENCIA_PERMISSIONS,
  ...ADMIN_PERMISSIONS,
];

// Agrupar por módulo
export const PERMISSIONS_BY_MODULE = {
  inicio: INICIO_PERMISSIONS,
  programacion: PROGRAMACION_PERMISSIONS,
  comunicacion: COMUNICACION_PERMISSIONS,
  inventario: INVENTARIO_PERMISSIONS,
  cursos: CURSOS_PERMISSIONS,
  salones: SALONES_PERMISSIONS,
  notas: NOTAS_PERMISSIONS,
  asistencia: ASISTENCIA_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

// Todos los módulos disponibles
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
