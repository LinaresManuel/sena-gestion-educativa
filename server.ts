import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { regionales, centrosFormacion, tiposAmbiente, ambientes, elementosAmbiente, instructores, programas, competencias, resultadosAprendizaje, perfilesInstructor, perfilesAcademicos, competenciasPerfiles, instructoresPerfiles, fichas, programacionInstructores } from './src/db/schema.ts';
import { eq, and, ne, sql } from 'drizzle-orm';
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
      const list = await db.select().from(instructores);
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

  app.post('/api/instructores', async (req, res) => {
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

  app.put('/api/instructores/:id', async (req, res) => {
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

  // API Routes for Programacion Instructores
  app.get('/api/programacion-instructores', async (req, res) => {
    try {
      const list = await db.select().from(programacionInstructores);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/programacion-instructores', async (req, res) => {
    try {
      const result = await db.insert(programacionInstructores).values(req.body).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/programacion-instructores/limpiar-celda', async (req, res) => {
    try {
      const { fichaId, dateStr, hr } = req.body;
      let count = 0;
      console.log(`Borrando celda para ficha: ${fichaId}, date: ${dateStr}, hr: ${hr}`);
      
      const allProg = await db.select().from(programacionInstructores).where(eq(programacionInstructores.fichaId, Number(fichaId)));
      
      for (const p of allProg) {
         if (p.eventos) {
            const ev = typeof p.eventos === 'string' ? JSON.parse(p.eventos) : p.eventos;
            if (ev && ev[dateStr] && ev[dateStr][hr]) {
               delete ev[dateStr][hr];
               await db.update(programacionInstructores).set({ eventos: ev }).where(eq(programacionInstructores.id, p.id));
               count++;
            }
         }
      }
      console.log(`Borradas: ${count}`);
      res.json({ success: true, count });
    } catch (e: any) {
      console.error("Error en limpiar celda", e);
      handleDbError(e, res);
    }
  });

  app.delete('/api/programacion-instructores/ficha/:fichaId', async (req, res) => {
    try {
      await db.delete(programacionInstructores).where(eq(programacionInstructores.fichaId, Number(req.params.fichaId)));
      res.json({ success: true });
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/programacion-instructores/:id', async (req, res) => {
    try {
      await db.delete(programacionInstructores).where(eq(programacionInstructores.id, Number(req.params.id)));
      res.json({ success: true });
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
