import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { regionales, centrosFormacion, tiposAmbiente, ambientes, elementosAmbiente, instructores, programas, competencias, resultadosAprendizaje, perfilesInstructor, perfilesAcademicos, competenciasPerfiles, instructoresPerfiles, fichas, programacionInstructores, programacionEventos } from './src/db/schema.ts';
import { eq, and, ne, sql, inArray } from 'drizzle-orm';
import { config } from './src/config.ts';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter, { seedAdminIfMissing } from './src/routes/auth.ts';
import adminRouter from './src/routes/admin.ts';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { requirePermission } from './src/middleware/permissions.ts';
import { requestLogger } from './src/middleware/request-logger.ts';
import { auditLogger } from './src/middleware/audit.ts';
import { addSseClient } from './src/lib/sse.ts';
import { errorHandler, notFoundHandler } from './src/middleware/error-handler.ts';
import { logger } from './src/lib/logger.ts';


function handleDbError(e: any, res: any) {
  if (e.message?.includes('UNIQUE constraint failed')) {
    if (e.message.includes('regionales.codigo')) return res.status(400).json({ error: 'Ya existe una regional con este código' });
    if (e.message.includes('centros_formacion.codigo')) return res.status(400).json({ error: 'Ya existe un centro de formación con este código' });
    if (e.message.includes('tipos_ambiente.nombre')) return res.status(400).json({ error: 'Ya existe un tipo de ambiente con este nombre' });
    if (e.message.includes('ambientes.codigo')) return res.status(400).json({ error: 'Ya existe un ambiente con este código' });
    if (e.message.includes('instructores.documento')) return res.status(400).json({ error: 'Ya existe un instructor con este documento' });
    if (e.message.includes('programas.codigo')) return res.status(400).json({ error: 'Ya existe un programa con este código' });
    if (e.message.includes('fichas.numero_ficha')) return res.status(400).json({ error: 'Ya existe una ficha con este número' });
    if (e.message.includes('perfiles_academicos.codigo')) return res.status(400).json({ error: 'Ya existe un perfil académico con este código' });
    return res.status(400).json({ error: 'El registro ya existe (valor duplicado)' });
  }
  res.status(500).json({ error: e.message });
}

async function startServer() {
  const app = express();
  const PORT = config.PORT;

  app.use(requestLogger);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));
  app.use(cookieParser());

  // Rate limit on auth endpoints (TEMPORALMENTE DESHABILITADO)
  // const authLimiter = rateLimit({
  //   windowMs: 60 * 1000,
  //   max: 10,
  //   standardHeaders: true,
  //   legacyHeaders: false,
  //   message: { error: 'Demasiados intentos. Intenta en un minuto.' },
  // });
  // app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/auth', authRouter);

  // Admin routes (require auth + admin permission)
  app.use('/api/admin', requireAuth as any, adminRouter);

  // SSE para notificaciones en tiempo real de cambios de permisos
  app.get('/api/auth/sse', requireAuth, (req: AuthRequest, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('event: connected\ndata: {}\n\n');
    if (req.user) addSseClient(req.user.id, res);
  });

  // Health check (public)
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), version: '1.0.0', env: config.NODE_ENV });
  });

  // Protect all other /api/* routes
  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path.startsWith('/auth')) return next();
    return requireAuth(req as AuthRequest, res, next);
  });

  // Audit mutations (after auth so user is available)
  app.use('/api', auditLogger);

  // Dependency check endpoint for delete confirmation
  app.get('/api/dependencias/:entity/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const dependencias: { tipo: string; count: number; label: string; elimina: boolean }[] = [];

      switch (req.params.entity) {
        case 'regionales': {
          const rows = await db.select().from(centrosFormacion).where(eq(centrosFormacion.regionalId, id));
          if (rows.length > 0) dependencias.push({ tipo: 'centros', count: rows.length, label: 'centros de formación', elimina: false });
          break;
        }
        case 'centros': {
          const ambRows = await db.select().from(ambientes).where(eq(ambientes.centroId, id));
          if (ambRows.length > 0) dependencias.push({ tipo: 'ambientes', count: ambRows.length, label: 'ambientes', elimina: false });
          const fchRows = await db.select().from(fichas).where(eq(fichas.centroFormacionId, id));
          if (fchRows.length > 0) dependencias.push({ tipo: 'fichas', count: fchRows.length, label: 'fichas', elimina: false });
          break;
        }
        case 'tipos-ambiente': {
          const rows = await db.select().from(ambientes).where(eq(ambientes.tipoAmbienteId, id));
          if (rows.length > 0) dependencias.push({ tipo: 'ambientes', count: rows.length, label: 'ambientes', elimina: false });
          break;
        }
        case 'ambientes': {
          const elemRows = await db.select().from(elementosAmbiente).where(eq(elementosAmbiente.ambienteId, id));
          if (elemRows.length > 0) dependencias.push({ tipo: 'elementos', count: elemRows.length, label: 'elementos del ambiente', elimina: true });
          const fchRows = await db.select().from(fichas).where(eq(fichas.ambienteId, id));
          if (fchRows.length > 0) dependencias.push({ tipo: 'fichas', count: fchRows.length, label: 'fichas', elimina: false });
          break;
        }
        case 'instructores': {
          const rows = await db.select().from(programacionInstructores).where(eq(programacionInstructores.instructorId, id));
          if (rows.length > 0) dependencias.push({ tipo: 'programaciones', count: rows.length, label: 'programaciones', elimina: false });
          break;
        }
        case 'programas': {
          const compRows = await db.select().from(competencias).where(eq(competencias.programaId, id));
          if (compRows.length > 0) dependencias.push({ tipo: 'competencias', count: compRows.length, label: 'competencias (con resultados y perfiles asociados)', elimina: true });
          const fchRows = await db.select().from(fichas).where(eq(fichas.programaId, id));
          if (fchRows.length > 0) dependencias.push({ tipo: 'fichas', count: fchRows.length, label: 'fichas', elimina: false });
          const progRows = await db.select().from(programacionInstructores).where(eq(programacionInstructores.programaId, id));
          if (progRows.length > 0) dependencias.push({ tipo: 'programaciones', count: progRows.length, label: 'programaciones', elimina: false });
          break;
        }
        case 'competencias': {
          const raRows = await db.select().from(resultadosAprendizaje).where(eq(resultadosAprendizaje.competenciaId, id));
          if (raRows.length > 0) dependencias.push({ tipo: 'resultados', count: raRows.length, label: 'resultados de aprendizaje', elimina: true });
          const cpRows = await db.select().from(competenciasPerfiles).where(eq(competenciasPerfiles.competenciaId, id));
          if (cpRows.length > 0) dependencias.push({ tipo: 'perfiles', count: cpRows.length, label: 'perfiles académicos asignados', elimina: false });
          break;
        }
        case 'fichas': {
          const rows = await db.select().from(programacionInstructores).where(eq(programacionInstructores.fichaId, id));
          if (rows.length > 0) dependencias.push({ tipo: 'programaciones', count: rows.length, label: 'programaciones', elimina: false });
          break;
        }
        default:
          return res.status(400).json({ error: 'Entidad no válida' });
      }
      res.json({ dependencias });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Regionales
  app.get('/api/regionales', async (req, res) => {
    try {
      const list = await db.select().from(regionales);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/regionales', async (req, res) => {
    try {
      const result = await db.insert(regionales).values(req.body).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/regionales/:id', async (req, res) => {
    try {
      const result = await db.update(regionales)
        .set(req.body)
        .where(eq(regionales.id, Number(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/regionales/:id', async (req, res) => {
    try {
      await db.delete(regionales).where(eq(regionales.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Centros de Formación
  app.get('/api/centros', async (req, res) => {
    try {
      const centros = await db.select().from(centrosFormacion);
      res.json(centros);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/centros', async (req, res) => {
    try {
      const result = await db.insert(centrosFormacion).values(req.body).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/centros/:id', async (req, res) => {
    try {
      const result = await db.update(centrosFormacion)
        .set(req.body)
        .where(eq(centrosFormacion.id, Number(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/centros/:id', async (req, res) => {
    try {
      await db.delete(centrosFormacion).where(eq(centrosFormacion.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Tipos de Ambiente
  app.get('/api/tipos-ambiente', async (req, res) => {
    try {
      const list = await db.select().from(tiposAmbiente);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/tipos-ambiente', async (req, res) => {
    try {
      const result = await db.insert(tiposAmbiente).values(req.body).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/tipos-ambiente/:id', async (req, res) => {
    try {
      const result = await db.update(tiposAmbiente)
        .set(req.body)
        .where(eq(tiposAmbiente.id, Number(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/tipos-ambiente/:id', requirePermission('tipos_ambiente.eliminar'), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const ambientesConTipo = await db.select().from(ambientes).where(eq(ambientes.tipoAmbienteId, id)).limit(1);
      if (ambientesConTipo.length > 0) {
        return res.status(400).json({ error: 'No se puede eliminar el tipo porque está siendo utilizado por uno o más ambientes.' });
      }
      await db.delete(tiposAmbiente).where(eq(tiposAmbiente.id, id));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Ambientes
  app.get('/api/ambientes', async (req, res) => {
    try {
      const list = await db.select().from(ambientes);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/ambientes', async (req, res) => {
    try {
      const result = await db.insert(ambientes).values(req.body).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/ambientes/:id', async (req, res) => {
    try {
      const result = await db.update(ambientes)
        .set(req.body)
        .where(eq(ambientes.id, Number(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/ambientes/:id', requirePermission('ambientes.eliminar'), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const fichasConAmbiente = await db.select().from(fichas).where(eq(fichas.ambienteId, id)).limit(1);
      if (fichasConAmbiente.length > 0) {
        return res.status(400).json({ error: 'No se puede eliminar el ambiente porque está siendo utilizado por una o más fichas.' });
      }
      await db.delete(ambientes).where(eq(ambientes.id, id));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Elementos de Ambiente
  app.get('/api/ambientes/:id/elementos', async (req, res) => {
    try {
      const list = await db.select().from(elementosAmbiente).where(eq(elementosAmbiente.ambienteId, Number(req.params.id)));
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/ambientes/:id/elementos', async (req, res) => {
    try {
      const result = await db.insert(elementosAmbiente).values({ ...req.body, ambienteId: Number(req.params.id) }).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/elementos-ambiente/:id', async (req, res) => {
    try {
      const result = await db.update(elementosAmbiente)
        .set(req.body)
        .where(eq(elementosAmbiente.id, Number(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/elementos-ambiente/:id', async (req, res) => {
    try {
      await db.delete(elementosAmbiente).where(eq(elementosAmbiente.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Instructores
  app.get('/api/instructores', async (req, res) => {
    try {
      const where = req.query.centroId ? eq(instructores.centroFormacionId, Number(req.query.centroId)) : undefined;
      const list = await db.select().from(instructores).where(where);
      const withPerfiles = await Promise.all(list.map(async (inst) => {
        const perfiles = await db.select({
          id: perfilesAcademicos.id,
          codigo: perfilesAcademicos.codigo,
          nombre: perfilesAcademicos.nombre,
        }).from(instructoresPerfiles)
          .innerJoin(perfilesAcademicos, eq(instructoresPerfiles.perfilAcademicoId, perfilesAcademicos.id))
          .where(eq(instructoresPerfiles.instructorId, inst.id));
        return { ...inst, perfiles };
      }));
      res.json(withPerfiles);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/instructores', requirePermission('instructores.crear'), async (req, res) => {
    try {
      const { perfilIds, ...instructorData } = req.body;
      const result = await db.insert(instructores).values(instructorData).returning();
      const instructor = result[0];

      if (Array.isArray(perfilIds) && perfilIds.length > 0) {
        const values = perfilIds.map((pid: number) => ({
          instructorId: instructor.id,
          perfilAcademicoId: pid,
        }));
        await db.insert(instructoresPerfiles).values(values);
      }

      const perfiles = await db.select({
        id: perfilesAcademicos.id,
        codigo: perfilesAcademicos.codigo,
        nombre: perfilesAcademicos.nombre,
      }).from(instructoresPerfiles)
        .innerJoin(perfilesAcademicos, eq(instructoresPerfiles.perfilAcademicoId, perfilesAcademicos.id))
        .where(eq(instructoresPerfiles.instructorId, instructor.id));

      res.json({ ...instructor, perfiles });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/instructores/:id', requirePermission('instructores.editar'), async (req, res) => {
    try {
      const { perfilIds, ...instructorData } = req.body;
      const result = await db.update(instructores)
        .set(instructorData)
        .where(eq(instructores.id, Number(req.params.id)))
        .returning();
      if (result.length === 0) return res.status(404).json({ error: 'Instructor no encontrado' });

      if (Array.isArray(perfilIds)) {
        await db.delete(instructoresPerfiles).where(eq(instructoresPerfiles.instructorId, Number(req.params.id)));
        if (perfilIds.length > 0) {
          const values = perfilIds.map((pid: number) => ({
            instructorId: Number(req.params.id),
            perfilAcademicoId: pid,
          }));
          await db.insert(instructoresPerfiles).values(values);
        }
      }

      const perfiles = await db.select({
        id: perfilesAcademicos.id,
        codigo: perfilesAcademicos.codigo,
        nombre: perfilesAcademicos.nombre,
      }).from(instructoresPerfiles)
        .innerJoin(perfilesAcademicos, eq(instructoresPerfiles.perfilAcademicoId, perfilesAcademicos.id))
        .where(eq(instructoresPerfiles.instructorId, Number(req.params.id)));

      res.json({ ...result[0], perfiles });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/instructores/:id', async (req, res) => {
    try {
      await db.delete(instructores).where(eq(instructores.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Programas
  app.get('/api/programas', async (req, res) => {
    try {
      const list = await db.select().from(programas);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/programas', async (req, res) => {
    try {
      const result = await db.insert(programas).values(req.body).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/programas/:id', async (req, res) => {
    try {
      const result = await db.update(programas)
        .set(req.body)
        .where(eq(programas.id, Number(req.params.id)))
        .returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/programas/:id', async (req, res) => {
    try {
      await db.delete(programas).where(eq(programas.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Competencias
  app.get('/api/programas/:id/competencias', async (req, res) => {
    try {
      const list = await db.select().from(competencias).where(eq(competencias.programaId, Number(req.params.id)));
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/programas/:id/competencias', async (req, res) => {
    try {
      // Find if we have an existing one with this code to use as template
      const existingTemplate = await db.select().from(competencias).where(eq(competencias.codigo, req.body.codigo)).limit(1);

      const result = await db.insert(competencias).values({ ...req.body, programaId: Number(req.params.id) }).returning();
      const newCompetencia = result[0];

      if (existingTemplate.length > 0) {
        const templateId = existingTemplate[0].id;
        
        // Copy resultados
        const existingResultados = await db.select().from(resultadosAprendizaje).where(eq(resultadosAprendizaje.competenciaId, templateId));
        if (existingResultados.length > 0) {
          const nuevosResultados = existingResultados.map(r => ({
            competenciaId: newCompetencia.id,
            codigo: r.codigo,
            nombre: r.nombre,
            duracionHoras: r.duracionHoras
          }));
          await db.insert(resultadosAprendizaje).values(nuevosResultados);
        }

        // Copy perfiles (via junction table)
        const existingPerfiles = await db.select().from(competenciasPerfiles).where(eq(competenciasPerfiles.competenciaId, templateId));
        if (existingPerfiles.length > 0) {
          const nuevosPerfiles = existingPerfiles.map(p => ({
            competenciaId: newCompetencia.id,
            perfilAcademicoId: p.perfilAcademicoId,
          }));
          await db.insert(competenciasPerfiles).values(nuevosPerfiles);
        }
      }

      res.json(newCompetencia);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/competencias/:id', async (req, res) => {
    try {
      const result = await db.update(competencias).set(req.body).where(eq(competencias.id, Number(req.params.id))).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/competencias/:id', async (req, res) => {
    try {
      await db.delete(competencias).where(eq(competencias.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Resultados de Aprendizaje
  app.get('/api/resultados', async (req, res) => {
    try {
      const list = await db.select().from(resultadosAprendizaje);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.get('/api/competencias/:id/resultados', async (req, res) => {
    try {
      const list = await db.select().from(resultadosAprendizaje).where(eq(resultadosAprendizaje.competenciaId, Number(req.params.id)));
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/competencias/:id/resultados', async (req, res) => {
    try {
      const result = await db.insert(resultadosAprendizaje).values({ ...req.body, competenciaId: Number(req.params.id) }).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/resultados/:id', async (req, res) => {
    try {
      const result = await db.update(resultadosAprendizaje).set(req.body).where(eq(resultadosAprendizaje.id, Number(req.params.id))).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/resultados/:id', async (req, res) => {
    try {
      await db.delete(resultadosAprendizaje).where(eq(resultadosAprendizaje.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Perfiles Académicos (asignación a competencias)
  app.get('/api/competencias-unicas', async (req, res) => {
    try {
      const list = await db.select({
        codigo: competencias.codigo,
        nombre: competencias.nombre,
        duracionHoras: competencias.duracionHoras
      }).from(competencias).groupBy(competencias.codigo, competencias.nombre, competencias.duracionHoras);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.get('/api/perfiles-unicos', async (req, res) => {
    try {
      const list = await db.select({
        codigo: perfilesAcademicos.codigo,
        nombre: perfilesAcademicos.nombre
      }).from(perfilesAcademicos);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.get('/api/competencias/:id/perfiles', async (req, res) => {
    try {
      const list = await db.select({
        id: competenciasPerfiles.id,
        competenciaId: competenciasPerfiles.competenciaId,
        perfilAcademicoId: competenciasPerfiles.perfilAcademicoId,
        codigo: perfilesAcademicos.codigo,
        nombre: perfilesAcademicos.nombre,
      }).from(competenciasPerfiles)
        .innerJoin(perfilesAcademicos, eq(competenciasPerfiles.perfilAcademicoId, perfilesAcademicos.id))
        .where(eq(competenciasPerfiles.competenciaId, Number(req.params.id)));
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/competencias/:id/perfiles', async (req, res) => {
    try {
      const { perfilAcademicoId } = req.body;
      const result = await db.insert(competenciasPerfiles).values({
        competenciaId: Number(req.params.id),
        perfilAcademicoId,
      }).returning();
      const full = await db.select({
        id: competenciasPerfiles.id,
        competenciaId: competenciasPerfiles.competenciaId,
        perfilAcademicoId: competenciasPerfiles.perfilAcademicoId,
        codigo: perfilesAcademicos.codigo,
        nombre: perfilesAcademicos.nombre,
      }).from(competenciasPerfiles)
        .innerJoin(perfilesAcademicos, eq(competenciasPerfiles.perfilAcademicoId, perfilesAcademicos.id))
        .where(eq(competenciasPerfiles.id, result[0].id))
        .limit(1);
      res.json(full[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/perfiles/:id', async (req, res) => {
    try {
      const { perfilAcademicoId } = req.body;
      const result = await db.update(competenciasPerfiles)
        .set({ perfilAcademicoId })
        .where(eq(competenciasPerfiles.id, Number(req.params.id)))
        .returning();
      if (result.length === 0) return res.status(404).json({ error: 'Asignación no encontrada' });
      const full = await db.select({
        id: competenciasPerfiles.id,
        competenciaId: competenciasPerfiles.competenciaId,
        perfilAcademicoId: competenciasPerfiles.perfilAcademicoId,
        codigo: perfilesAcademicos.codigo,
        nombre: perfilesAcademicos.nombre,
      }).from(competenciasPerfiles)
        .innerJoin(perfilesAcademicos, eq(competenciasPerfiles.perfilAcademicoId, perfilesAcademicos.id))
        .where(eq(competenciasPerfiles.id, result[0].id))
        .limit(1);
      res.json(full[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/perfiles/:id', async (req, res) => {
    try {
      await db.delete(competenciasPerfiles).where(eq(competenciasPerfiles.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Perfiles Académicos (entidad independiente)
  app.get('/api/perfiles-academicos', async (req, res) => {
    try {
      const list = await db.select().from(perfilesAcademicos);
      // Agregar conteo de usos
      const withCounts = await Promise.all(list.map(async (pa) => {
        const [cpCount, ipCount] = await Promise.all([
          db.select({ count: sql<number>`count(*)` }).from(competenciasPerfiles).where(eq(competenciasPerfiles.perfilAcademicoId, pa.id)),
          db.select({ count: sql<number>`count(*)` }).from(instructoresPerfiles).where(eq(instructoresPerfiles.perfilAcademicoId, pa.id)),
        ]);
        return {
          ...pa,
          competenciasCount: Number(cpCount[0]?.count ?? 0),
          instructoresCount: Number(ipCount[0]?.count ?? 0),
        };
      }));
      res.json(withCounts);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/perfiles-academicos', async (req, res) => {
    try {
      const { codigo, nombre, descripcion } = req.body;
      const result = await db.insert(perfilesAcademicos).values({ codigo, nombre, descripcion }).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/perfiles-academicos/:id', async (req, res) => {
    try {
      const { codigo, nombre, descripcion } = req.body;
      const result = await db.update(perfilesAcademicos)
        .set({ codigo, nombre, descripcion })
        .where(eq(perfilesAcademicos.id, Number(req.params.id)))
        .returning();
      if (result.length === 0) return res.status(404).json({ error: 'Perfil académico no encontrado' });
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/perfiles-academicos/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      // Verificar dependencias
      const [cpCount, ipCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(competenciasPerfiles).where(eq(competenciasPerfiles.perfilAcademicoId, id)),
        db.select({ count: sql<number>`count(*)` }).from(instructoresPerfiles).where(eq(instructoresPerfiles.perfilAcademicoId, id)),
      ]);
      if (Number(cpCount[0]?.count ?? 0) > 0 || Number(ipCount[0]?.count ?? 0) > 0) {
        return res.status(409).json({
          error: 'No se puede eliminar el perfil porque está asignado a competencias o instructores',
          competencias: Number(cpCount[0]?.count ?? 0),
          instructores: Number(ipCount[0]?.count ?? 0),
        });
      }
      await db.delete(perfilesAcademicos).where(eq(perfilesAcademicos.id, id));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Fichas
  app.get('/api/fichas', async (req, res) => {
    try {
      const list = await db.select().from(fichas);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/fichas', async (req, res) => {
    try {
      // Validate availability of ambiente
      const { fechaInicio, fechaFinLectiva, ambienteId, horario } = req.body;
      
      const allFichas = await db.select().from(fichas).where(eq(fichas.ambienteId, Number(ambienteId)));
      
      const newStart = new Date(fechaInicio);
      const newEnd = new Date(fechaFinLectiva);
      
      for (const ficha of allFichas) {
        const existStart = new Date(ficha.fechaInicio);
        const existEnd = new Date(ficha.fechaFinLectiva);
        
        // Date overlap check
        if (newStart <= existEnd && newEnd >= existStart) {
          // Time overlap check
          const existHorario = typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario;
          for (const [day, hours] of Object.entries(horario)) {
            if (existHorario[day]) {
              const intersection = (hours as string[]).filter(h => existHorario[day].includes(h));
              if (intersection.length > 0) {
                return res.status(400).json({ error: `El ambiente no está disponible los ${day} a las ${intersection.join(', ')} en las fechas seleccionadas debido a la ficha ${ficha.numeroFicha}` });
              }
            }
          }
        }
      }

      const result = await db.insert(fichas).values(req.body).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/fichas/:id', async (req, res) => {
    try {
      const editId = Number(req.params.id);
      const { fechaInicio, fechaFinLectiva, ambienteId, horario } = req.body;

      // Validate availability excluding current ficha
      const allFichas = await db.select().from(fichas)
        .where(and(eq(fichas.ambienteId, Number(ambienteId)), ne(fichas.id, editId)));

      const newStart = new Date(fechaInicio);
      const newEnd = new Date(fechaFinLectiva);

      for (const ficha of allFichas) {
        const existStart = new Date(ficha.fechaInicio);
        const existEnd = new Date(ficha.fechaFinLectiva);

        if (newStart <= existEnd && newEnd >= existStart) {
          const existHorario = typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario;
          for (const [day, hours] of Object.entries(horario)) {
            if (existHorario[day]) {
              const intersection = (hours as string[]).filter(h => existHorario[day].includes(h));
              if (intersection.length > 0) {
                return res.status(400).json({ error: `El ambiente no está disponible los ${day} a las ${intersection.join(', ')} en las fechas seleccionadas debido a la ficha ${ficha.numeroFicha}` });
              }
            }
          }
        }
      }

      const result = await db.update(fichas)
        .set(req.body)
        .where(eq(fichas.id, editId))
        .returning();
      if (result.length === 0) return res.status(404).json({ error: 'Ficha no encontrada' });
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/fichas/:id', async (req, res) => {
    try {
      await db.delete(fichas).where(eq(fichas.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // API Routes for Programacion Instructores (cabecera)
  app.get('/api/programacion-instructores', requirePermission('programacion.ver'), async (req, res) => {
    try {
      const conditions = [];
      if (req.query.fichaId) conditions.push(eq(programacionInstructores.fichaId, Number(req.query.fichaId)));
      if (req.query.instructorId) conditions.push(eq(programacionInstructores.instructorId, Number(req.query.instructorId)));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const list = await db.select({
        id: programacionInstructores.id,
        programaId: programacionInstructores.programaId,
        fichaId: programacionInstructores.fichaId,
        competenciaId: programacionInstructores.competenciaId,
        instructorId: programacionInstructores.instructorId,
        resultadosIds: programacionInstructores.resultadosIds,
        estado: programacionInstructores.estado,
        createdAt: programacionInstructores.createdAt,
        updatedAt: programacionInstructores.updatedAt,
        eventosCount: sql<number>`(SELECT COUNT(*) FROM programacion_eventos pe WHERE pe.programacion_id = ${programacionInstructores.id})`.as<'eventosCount'>('eventosCount'),
      }).from(programacionInstructores).where(where);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/programacion-instructores', requirePermission('programacion.crear'), async (req, res) => {
    try {
      const { programaId, fichaId, competenciaId, instructorId, resultadosIds, estado } = req.body;
      const existing = await db.select().from(programacionInstructores).where(
        and(
          eq(programacionInstructores.fichaId, Number(fichaId)),
          eq(programacionInstructores.competenciaId, Number(competenciaId)),
          eq(programacionInstructores.instructorId, Number(instructorId)),
        )
      );
      if (existing.length > 0) {
        const updated = await db.update(programacionInstructores).set({
          resultadosIds,
          estado: estado ?? existing[0].estado,
          updatedAt: sql`(datetime('now'))`,
        }).where(eq(programacionInstructores.id, existing[0].id)).returning();
        res.json(updated[0]);
      } else {
        const result = await db.insert(programacionInstructores).values({
          programaId: Number(programaId),
          fichaId: Number(fichaId),
          competenciaId: Number(competenciaId),
          instructorId: Number(instructorId),
          resultadosIds,
          estado: estado ?? 'PLANIFICADO',
        }).returning();
        res.json(result[0]);
      }
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/programacion-instructores/:id', requirePermission('programacion.editar'), async (req, res) => {
    try {
      const { resultadosIds, estado } = req.body;
      const updated = await db.update(programacionInstructores).set({
        ...(resultadosIds !== undefined && { resultadosIds }),
        ...(estado !== undefined && { estado }),
        updatedAt: sql`(datetime('now'))`,
      }).where(eq(programacionInstructores.id, Number(req.params.id))).returning();
      if (updated.length === 0) return res.status(404).json({ error: 'Programación no encontrada' });
      res.json(updated[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/programacion-instructores/limpiar-celda', requirePermission('programacion.editar'), async (req, res) => {
    try {
      const { fichaId, dateStr, hr } = req.body;
      const horaInicio = parseInt(String(hr).split('-')[0], 10);
      const allProg = await db.select({ id: programacionInstructores.id }).from(programacionInstructores).where(eq(programacionInstructores.fichaId, Number(fichaId)));
      const progIds = allProg.map(p => p.id);
      let count = 0;
      if (progIds.length > 0) {
        const deleted = await db.delete(programacionEventos).where(
          and(
            inArray(programacionEventos.programacionId, progIds),
            eq(programacionEventos.fecha, dateStr),
            eq(programacionEventos.horaInicio, horaInicio)
          )
        );
        count = deleted.changes;
      }
      res.json({ success: true, count });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/programacion-instructores/ficha/:fichaId', requirePermission('programacion.eliminar'), async (req, res) => {
    try {
      await db.delete(programacionInstructores).where(eq(programacionInstructores.fichaId, Number(req.params.fichaId)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/programacion-instructores/:id', requirePermission('programacion.eliminar'), async (req, res) => {
    try {
      await db.delete(programacionInstructores).where(eq(programacionInstructores.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
});

  // ── API Routes for Programacion Eventos (detalle normalizado) ──

  const DIAS_SEMANA_ES = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

  function getDiaSemana(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return DIAS_SEMANA_ES[date.getDay()];
  }

  function isHoraInHorario(horario: unknown, dia: string, horaInicio: number): boolean {
    if (!horario || typeof horario !== 'object') return false;
    const slots = (horario as Record<string, string[]>)[dia];
    if (!slots || !Array.isArray(slots)) return false;
    return slots.some(slot => parseInt(slot.split('-')[0], 10) === horaInicio);
  }

  app.get('/api/programacion-eventos', requirePermission('programacion.ver'), async (req, res) => {
    try {
      const conditions = [];
      if (req.query.fichaId) {
        conditions.push(eq(programacionInstructores.fichaId, Number(req.query.fichaId)));
      }
      if (req.query.instructorId) conditions.push(eq(programacionEventos.instructorId, Number(req.query.instructorId)));
      if (req.query.fecha) conditions.push(eq(programacionEventos.fecha, String(req.query.fecha)));
      if (req.query.programacionId) conditions.push(eq(programacionEventos.programacionId, Number(req.query.programacionId)));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const list = await db.select({
        id: programacionEventos.id,
        programacionId: programacionEventos.programacionId,
        fecha: programacionEventos.fecha,
        horaInicio: programacionEventos.horaInicio,
        resultadoId: programacionEventos.resultadoId,
        instructorId: programacionEventos.instructorId,
        ambienteId: programacionEventos.ambienteId,
        estado: programacionEventos.estado,
        createdAt: programacionEventos.createdAt,
        updatedAt: programacionEventos.updatedAt,
        resultadoCodigo: resultadosAprendizaje.codigo,
        resultadoNombre: resultadosAprendizaje.nombre,
        instructorNombre: instructores.nombres,
        instructorApellido: instructores.apellidos,
        ambienteCodigo: ambientes.codigo,
        ambienteNombre: ambientes.nombre,
        fichaId: programacionInstructores.fichaId,
        programaId: programacionInstructores.programaId,
        competenciaId: programacionInstructores.competenciaId,
      })
        .from(programacionEventos)
        .leftJoin(resultadosAprendizaje, eq(programacionEventos.resultadoId, resultadosAprendizaje.id))
        .leftJoin(instructores, eq(programacionEventos.instructorId, instructores.id))
        .leftJoin(ambientes, eq(programacionEventos.ambienteId, ambientes.id))
        .leftJoin(programacionInstructores, eq(programacionEventos.programacionId, programacionInstructores.id))
        .where(where);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.get('/api/programacion-eventos/ficha/:fichaId', requirePermission('programacion.ver'), async (req, res) => {
    try {
      const fichaId = Number(req.params.fichaId);
      const events = await db.select({
        id: programacionEventos.id,
        programacionId: programacionEventos.programacionId,
        fecha: programacionEventos.fecha,
        horaInicio: programacionEventos.horaInicio,
        resultadoId: programacionEventos.resultadoId,
        instructorId: programacionEventos.instructorId,
        ambienteId: programacionEventos.ambienteId,
        estado: programacionEventos.estado,
        resultadoCodigo: resultadosAprendizaje.codigo,
        resultadoNombre: resultadosAprendizaje.nombre,
        instructorNombre: instructores.nombres,
        instructorApellido: instructores.apellidos,
        competenciaId: programacionInstructores.competenciaId,
      })
        .from(programacionEventos)
        .leftJoin(programacionInstructores, eq(programacionEventos.programacionId, programacionInstructores.id))
        .leftJoin(resultadosAprendizaje, eq(programacionEventos.resultadoId, resultadosAprendizaje.id))
        .leftJoin(instructores, eq(programacionEventos.instructorId, instructores.id))
        .where(eq(programacionInstructores.fichaId, fichaId));
      const grouped: Record<string, Record<number, typeof events[number]>> = {};
      for (const e of events) {
        if (!grouped[e.fecha]) grouped[e.fecha] = {};
        grouped[e.fecha][e.horaInicio] = e;
      }
      res.json(grouped);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/programacion-eventos', requirePermission('programacion.crear'), async (req, res) => {
    try {
      const { programacionId } = req.body;
      const eventosInput: { fecha: string; horaInicio: number; resultadoId: number; instructorId: number; ambienteId: number }[] = req.body.eventos;

      if (!programacionId || !eventosInput || !Array.isArray(eventosInput) || eventosInput.length === 0) {
        return res.status(400).json({ error: 'Se requiere programacionId y un array de eventos' });
      }

      const prog = await db.select().from(programacionInstructores).where(eq(programacionInstructores.id, Number(programacionId)));
      if (prog.length === 0) return res.status(404).json({ error: 'Programación no encontrada' });

      const fichaRow = await db.select().from(fichas).where(eq(fichas.id, prog[0].fichaId));
      if (fichaRow.length === 0) return res.status(404).json({ error: 'Ficha no encontrada' });
      const ficha = fichaRow[0];

      const ras = await db.select().from(resultadosAprendizaje)
        .leftJoin(competencias, eq(resultadosAprendizaje.competenciaId, competencias.id))
        .where(eq(competencias.id, prog[0].competenciaId));
      const validResultadoIds = new Set(ras.map(r => r.resultados_aprendizaje.id));

      const instructorRow = await db.select().from(instructores).where(eq(instructores.id, prog[0].instructorId));
      const instructorCentroId = instructorRow[0]?.centroFormacionId;

      const errors: string[] = [];
      for (const [i, ev] of eventosInput.entries()) {
        if (!ev.fecha || !ev.horaInicio || !ev.resultadoId || !ev.instructorId || !ev.ambienteId) {
          errors.push(`Evento ${i}: faltan campos obligatorios`);
          continue;
        }
        if (ev.fecha < ficha.fechaInicio || ev.fecha > ficha.fechaFinLectiva) {
          errors.push(`Evento ${i}: fecha ${ev.fecha} fuera del rango lectivo de la ficha (${ficha.fechaInicio} a ${ficha.fechaFinLectiva})`);
        }
        const dia = getDiaSemana(ev.fecha);
        if (!isHoraInHorario(ficha.horario, dia, ev.horaInicio)) {
          errors.push(`Evento ${i}: hora ${ev.horaInicio} no está en el horario de la ficha para ${dia}`);
        }
        if (!validResultadoIds.has(ev.resultadoId)) {
          errors.push(`Evento ${i}: resultado ${ev.resultadoId} no pertenece a la competencia de la programación`);
        }
        const inst = await db.select().from(instructores).where(eq(instructores.id, ev.instructorId));
        if (inst.length === 0 || inst[0].centroFormacionId !== ficha.centroFormacionId) {
          errors.push(`Evento ${i}: instructor ${ev.instructorId} no pertenece al centro de la ficha`);
        }
        const instructorConflict = await db.select().from(programacionEventos).where(
          and(eq(programacionEventos.fecha, ev.fecha), eq(programacionEventos.horaInicio, ev.horaInicio), eq(programacionEventos.instructorId, ev.instructorId))
        );
        if (instructorConflict.length > 0) {
          errors.push(`Evento ${i}: instructor ${ev.instructorId} ya tiene un evento en ${ev.fecha} hora ${ev.horaInicio}`);
        }
        const ambienteConflict = await db.select().from(programacionEventos).where(
          and(eq(programacionEventos.fecha, ev.fecha), eq(programacionEventos.horaInicio, ev.horaInicio), eq(programacionEventos.ambienteId, ev.ambienteId))
        );
        if (ambienteConflict.length > 0) {
          errors.push(`Evento ${i}: ambiente ${ev.ambienteId} ya está reservado en ${ev.fecha} hora ${ev.horaInicio}`);
        }
      }

      if (errors.length > 0) {
        return res.status(409).json({ error: 'Conflictos detectados', conflictos: errors });
      }

      const inserted = await db.insert(programacionEventos).values(
        eventosInput.map(ev => ({
          programacionId: Number(programacionId),
          fecha: ev.fecha,
          horaInicio: ev.horaInicio,
          resultadoId: ev.resultadoId,
          instructorId: ev.instructorId,
          ambienteId: ev.ambienteId,
          estado: 'PLANIFICADO' as const,
        }))
      ).returning();
      res.json(inserted);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/programacion-eventos/:id', requirePermission('programacion.editar'), async (req, res) => {
    try {
      const { estado, resultadoId, instructorId } = req.body;
      const updatedFields: Record<string, unknown> = { updatedAt: sql`(datetime('now'))` };
      if (estado !== undefined) updatedFields.estado = estado;
      if (resultadoId !== undefined) updatedFields.resultadoId = resultadoId;
      if (instructorId !== undefined) {
        const existing = await db.select().from(programacionEventos).where(eq(programacionEventos.id, Number(req.params.id)));
        if (existing.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
        const conflict = await db.select().from(programacionEventos).where(
          and(
            eq(programacionEventos.fecha, existing[0].fecha),
            eq(programacionEventos.horaInicio, existing[0].horaInicio),
            eq(programacionEventos.instructorId, Number(instructorId)),
            ne(programacionEventos.id, Number(req.params.id)),
          )
        );
        if (conflict.length > 0) {
          return res.status(409).json({ error: 'Instructor ya tiene un evento en esa fecha y hora' });
        }
        updatedFields.instructorId = Number(instructorId);
      }
      const updated = await db.update(programacionEventos).set(updatedFields).where(eq(programacionEventos.id, Number(req.params.id))).returning();
      if (updated.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
      res.json(updated[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/programacion-eventos/:id', requirePermission('programacion.eliminar'), async (req, res) => {
    try {
      await db.delete(programacionEventos).where(eq(programacionEventos.id, Number(req.params.id)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // Disponibilidad de instructor
  app.get('/api/disponibilidad/instructor/:id', requirePermission('programacion.ver'), async (req, res) => {
    try {
      const instructorId = Number(req.params.id);
      const { fecha, hora } = req.query;
      if (!fecha || hora === undefined) return res.status(400).json({ error: 'Se requiere fecha y hora' });
      const horaInicio = Number(hora);
      const conditions = [
        eq(programacionEventos.instructorId, instructorId),
        eq(programacionEventos.fecha, String(fecha)),
        eq(programacionEventos.horaInicio, horaInicio),
      ];
      if (req.query.fichaId) {
        const progIds = await db.select({ id: programacionInstructores.id }).from(programacionInstructores)
          .where(ne(programacionInstructores.fichaId, Number(req.query.fichaId)));
        if (progIds.length > 0) {
          conditions.push(inArray(programacionEventos.programacionId, progIds.map(p => p.id)));
        }
      }
      const conflictos = await db.select({
        eventoId: programacionEventos.id,
        fichaId: programacionInstructores.fichaId,
        fichaNumero: fichas.numeroFicha,
        programaDenominacion: programas.denominacion,
        estado: programacionEventos.estado,
      })
        .from(programacionEventos)
        .leftJoin(programacionInstructores, eq(programacionEventos.programacionId, programacionInstructores.id))
        .leftJoin(fichas, eq(programacionInstructores.fichaId, fichas.id))
        .leftJoin(programas, eq(programacionInstructores.programaId, programas.id))
        .where(and(...conditions));
      res.json({ disponible: conflictos.length === 0, conflictos });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // Disponibilidad de ambiente
  app.get('/api/disponibilidad/ambiente/:id', requirePermission('programacion.ver'), async (req, res) => {
    try {
      const ambienteId = Number(req.params.id);
      const { fecha, hora } = req.query;
      if (!fecha || hora === undefined) return res.status(400).json({ error: 'Se requiere fecha y hora' });
      const horaInicio = Number(hora);
      const conditions = [
        eq(programacionEventos.ambienteId, ambienteId),
        eq(programacionEventos.fecha, String(fecha)),
        eq(programacionEventos.horaInicio, horaInicio),
      ];
      if (req.query.fichaId) {
        const progIds = await db.select({ id: programacionInstructores.id }).from(programacionInstructores)
          .where(ne(programacionInstructores.fichaId, Number(req.query.fichaId)));
        if (progIds.length > 0) {
          conditions.push(inArray(programacionEventos.programacionId, progIds.map(p => p.id)));
        }
      }
      const conflictos = await db.select({
        eventoId: programacionEventos.id,
        fichaId: programacionInstructores.fichaId,
        fichaNumero: fichas.numeroFicha,
        programaDenominacion: programas.denominacion,
        estado: programacionEventos.estado,
      })
        .from(programacionEventos)
        .leftJoin(programacionInstructores, eq(programacionEventos.programacionId, programacionInstructores.id))
        .leftJoin(fichas, eq(programacionInstructores.fichaId, fichas.id))
        .leftJoin(programas, eq(programacionInstructores.programaId, programas.id))
        .where(and(...conditions));
      res.json({ disponible: conflictos.length === 0, conflictos });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), version: '1.0.0', env: config.NODE_ENV });
  });

  // Vite middleware for development
  if (config.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 404 + error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    logger.info({ port: PORT, env: config.NODE_ENV, db: config.DATABASE_URL }, 'server_started');
  });
}

startServer().then(() => {
  seedAdminIfMissing().catch((err) => console.error('Error creando admin inicial:', err));
});
