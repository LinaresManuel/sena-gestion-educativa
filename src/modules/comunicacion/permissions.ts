export const COMUNICACION_PERMISSIONS = [
  { codigo: 'comunicacion.ver', nombre: 'Ver Comunicación', modulo: 'comunicacion', accion: 'ver', descripcion: 'Ver mensajes y comunicaciones' },
  { codigo: 'comunicacion.enviar', nombre: 'Enviar Mensajes', modulo: 'comunicacion', accion: 'enviar', descripcion: 'Enviar nuevos mensajes' },
  { codigo: 'comunicacion.responder', nombre: 'Responder Mensajes', modulo: 'comunicacion', accion: 'responder', descripcion: 'Responder a mensajes existentes' },
  { codigo: 'comunicacion.eliminar', nombre: 'Eliminar Mensajes', modulo: 'comunicacion', accion: 'eliminar', descripcion: 'Eliminar mensajes' },
] as const;
