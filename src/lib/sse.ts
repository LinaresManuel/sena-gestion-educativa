import type { Response } from 'express';

// Mapa de clientes SSE por ID de usuario
const sseClients = new Map<number, Set<Response>>();

export function addSseClient(userId: number, res: Response) {
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(res);
  res.on('close', () => {
    sseClients.get(userId)?.delete(res);
    if (sseClients.get(userId)?.size === 0) sseClients.delete(userId);
  });
}

export function notificarCambioPermisos(userId: number) {
  sseClients.get(userId)?.forEach(res => {
    res.write('event: permisos-cambiaron\ndata: {}\n\n');
  });
}

export function notificarCambioPermisosATodos() {
  for (const userId of sseClients.keys()) {
    notificarCambioPermisos(userId);
  }
}
