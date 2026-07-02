export const ASISTENCIA_PERMISSIONS = [
  { codigo: 'asistencia.ver', nombre: 'Ver Asistencia', modulo: 'asistencia', accion: 'ver', descripcion: 'Ver registros de asistencia' },
  { codigo: 'asistencia.registrar', nombre: 'Registrar Asistencia', modulo: 'asistencia', accion: 'registrar', descripcion: 'Registrar asistencia de aprendices' },
  { codigo: 'asistencia.editar', nombre: 'Editar Asistencia', modulo: 'asistencia', accion: 'editar', descripcion: 'Modificar registros de asistencia' },
  { codigo: 'asistencia.eliminar', nombre: 'Eliminar Asistencia', modulo: 'asistencia', accion: 'eliminar', descripcion: 'Eliminar registros de asistencia' },
] as const;
