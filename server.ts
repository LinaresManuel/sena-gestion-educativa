import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { regionales, centrosFormacion, tiposAmbiente, ambientes, elementosAmbiente, instructores, programas, competencias, resultadosAprendizaje, perfilesInstructor, fichas, programacionInstructores } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
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

  app.delete('/api/tipos-ambiente/:id', async (req, res) => {
    try {
      await db.delete(tiposAmbiente).where(eq(tiposAmbiente.id, Number(req.params.id)));
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
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/instructores', async (req, res) => {
    try {
      const result = await db.insert(instructores).values(req.body).returning();
      res.json(result[0]);
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

        // Copy perfiles
        const existingPerfiles = await db.select().from(perfilesInstructor).where(eq(perfilesInstructor.competenciaId, templateId));
        if (existingPerfiles.length > 0) {
          const nuevosPerfiles = existingPerfiles.map(p => ({
            competenciaId: newCompetencia.id,
            codigo: p.codigo,
            nombre: p.nombre
          }));
          await db.insert(perfilesInstructor).values(nuevosPerfiles);
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

  // API Routes for perfilesInstructor
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
        codigo: perfilesInstructor.codigo,
        nombre: perfilesInstructor.nombre
      }).from(perfilesInstructor).groupBy(perfilesInstructor.codigo, perfilesInstructor.nombre);
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.get('/api/competencias/:id/perfiles', async (req, res) => {
    try {
      const list = await db.select().from(perfilesInstructor).where(eq(perfilesInstructor.competenciaId, Number(req.params.id)));
      res.json(list);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.post('/api/competencias/:id/perfiles', async (req, res) => {
    try {
      const result = await db.insert(perfilesInstructor).values({ ...req.body, competenciaId: Number(req.params.id) }).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.put('/api/perfiles/:id', async (req, res) => {
    try {
      const result = await db.update(perfilesInstructor).set(req.body).where(eq(perfilesInstructor.id, Number(req.params.id))).returning();
      res.json(result[0]);
    } catch (e: any) {
      handleDbError(e, res);
    }
  });

  app.delete('/api/perfiles/:id', async (req, res) => {
    try {
      await db.delete(perfilesInstructor).where(eq(perfilesInstructor.id, Number(req.params.id)));
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
