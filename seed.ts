import { db } from './src/db/index.ts';
import { eq, inArray } from 'drizzle-orm';
import {
  regionales, centrosFormacion, tiposAmbiente, ambientes, elementosAmbiente,
  instructores, programas, competencias, resultadosAprendizaje,
  perfilesAcademicos, competenciasPerfiles, instructoresPerfiles,
  perfilesInstructor, fichas, programacionInstructores, programacionEventos
} from './src/db/schema.ts';
import adsoJson from './docs/competencias-extraidas/competencias_ADSO.json' with { type: 'json' };
import gcJson from './docs/competencias-extraidas/competencias_gestion_comercial.json' with { type: 'json' };
import aaJson from './docs/competencias-extraidas/competencias_asistencia_admin.json' with { type: 'json' };

type CompInput = { nombre: string; codigo: string; norma_unidad_competencia: string; duracion: string; resultados_aprendizaje: string[] };

function parseHoras(s: string): number {
  return parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;
}

async function seed() {
  console.log('=== Limpiando datos (excepto usuarios/permisos) ===');

  const ordenDelete = [
    programacionEventos, programacionInstructores, fichas, instructoresPerfiles,
    competenciasPerfiles, perfilesAcademicos, resultadosAprendizaje, competencias,
    programas, perfilesInstructor, elementosAmbiente, ambientes, tiposAmbiente,
    instructores, centrosFormacion, regionales,
  ];
  for (const t of ordenDelete) { try { await db.delete(t); } catch { /* ignore FK order */ } }

  console.log('=== Insertando datos ===');

  // 1. REGIONALES
  console.log('  Regionales...');
  await db.insert(regionales).values([
    { id: 1, codigo: '95', nombre: 'GUAINIA' },
    { id: 2, codigo: '96', nombre: 'ANTIOQUIA' },
  ]);

  // 2. CENTROS
  console.log('  Centros...');
  await db.insert(centrosFormacion).values([
    { id: 1, codigo: '9547', nombre: 'CAENA', regionalId: 1 },
    { id: 2, codigo: '9647', nombre: 'CETÁ', regionalId: 2 },
  ]);

  // 3. TIPOS AMBIENTE
  console.log('  Tipos Ambiente...');
  await db.insert(tiposAmbiente).values([
    { id: 1, nombre: 'LABORATORIO', descripcion: '001' },
    { id: 2, nombre: 'POLIVALENTES', descripcion: '002' },
    { id: 3, nombre: 'AULA TECNOLÓGICA', descripcion: '003' },
  ]);

  // 4. AMBIENTES
  console.log('  Ambientes...');
  await db.insert(ambientes).values([
    { id: 1, codigo: '001', nombre: 'GUACRU', capacidad: 30, tipoAmbienteId: 1, estado: 'ACTIVO', ubicacion: 'CAENA Piso 1', centroId: 1 },
    { id: 2, codigo: '002', nombre: 'AULA 101', capacidad: 25, tipoAmbienteId: 2, estado: 'ACTIVO', ubicacion: 'CAENA Piso 1', centroId: 1 },
    { id: 3, codigo: '003', nombre: 'SALA DE SISTEMAS', capacidad: 20, tipoAmbienteId: 3, estado: 'ACTIVO', ubicacion: 'CAENA Piso 2', centroId: 1 },
    { id: 4, codigo: '004', nombre: 'AUDITORIO', capacidad: 50, tipoAmbienteId: 2, estado: 'ACTIVO', ubicacion: 'CETÁ Piso 1', centroId: 2 },
  ]);

  // 5. ELEMENTOS
  console.log('  Elementos...');
  await db.insert(elementosAmbiente).values([
    { id: 1, placa: '7474747', nombre: 'COMPUTADOR LENOVO', detalle: 'Core i5 16GB', estado: 'BUENO', ambienteId: 1 },
    { id: 2, placa: '7474748', nombre: 'COMPUTADOR DELL', detalle: 'Core i7 32GB', estado: 'BUENO', ambienteId: 3 },
    { id: 3, placa: '8585858', nombre: 'PROYECTOR EPSON', detalle: 'Full HD 3500 lumens', estado: 'BUENO', ambienteId: 1 },
    { id: 4, placa: '8585859', nombre: 'MESA DE TRABAJO', detalle: '1.20m x 0.60m', estado: 'BUENO', ambienteId: 2 },
    { id: 5, placa: '8585860', nombre: 'SILLA GIRATORIA', detalle: 'Ergonómica', estado: 'BUENO', ambienteId: 2 },
    { id: 6, placa: '8585861', nombre: 'TABLERO ACRÍLICO', detalle: '1.80m x 1.20m', estado: 'BUENO', ambienteId: 4 },
  ]);

  // 6. INSTRUCTORES
  console.log('  Instructores...');
  await db.insert(instructores).values([
    { id: 1, documento: '9393939', nombres: 'ADRIAN', apellidos: 'MER', tipoVinculacion: 'PLANTA', centroFormacionId: 1, requisitosAcademicos: ['QUIMICO', 'MATEMATICO'], estado: 'ACTIVO' },
    { id: 2, documento: '838383', nombres: 'MANUEL', apellidos: 'R', tipoVinculacion: 'PLANTA', centroFormacionId: 1, requisitosAcademicos: ['ING INDUSTRIAL'], estado: 'ACTIVO' },
    { id: 3, documento: '7373737', nombres: 'CARLOS', apellidos: 'PÉREZ', tipoVinculacion: 'PLANTA', centroFormacionId: 1, requisitosAcademicos: ['ING SISTEMAS', 'DESARROLLO SOFTWARE'], estado: 'ACTIVO' },
    { id: 4, documento: '6363636', nombres: 'MARÍA', apellidos: 'GARCÍA', tipoVinculacion: 'CONTRATISTA', centroFormacionId: 1, requisitosAcademicos: ['GESTIÓN EMPRESARIAL'], estado: 'ACTIVO' },
    { id: 5, documento: '5353535', nombres: 'LUISA', apellidos: 'FERNÁNDEZ', tipoVinculacion: 'PLANTA', centroFormacionId: 2, requisitosAcademicos: ['ADMINISTRACIÓN', 'CONTABILIDAD'], estado: 'ACTIVO' },
  ]);

  // 7. PERFILES ACADÉMICOS
  console.log('  Perfiles Académicos...');
  await db.insert(perfilesAcademicos).values([
    { id: 1, codigo: 'DS', nombre: 'DESARROLLO DE SOFTWARE', descripcion: 'Competencias técnicas de análisis, diseño y construcción de software' },
    { id: 2, codigo: 'GA', nombre: 'GESTIÓN ADMINISTRATIVA', descripcion: 'Competencias de gestión documental, atención al cliente y administrativas' },
    { id: 3, codigo: 'GC', nombre: 'GESTIÓN COMERCIAL', descripcion: 'Competencias de comercialización, negociación y mercadeo' },
    { id: 4, codigo: 'CB', nombre: 'CIENCIAS BÁSICAS', descripcion: 'Competencias de física, matemáticas y ciencias naturales' },
    { id: 5, codigo: 'TC', nombre: 'TIC Y TRANSVERSALES', descripcion: 'Competencias TIC, comunicación, ética, emprendimiento e inglés' },
  ]);

  // 8. PROGRAMAS
  console.log('  Programas...');
  await db.insert(programas).values([
    { id: 1, denominacion: 'TECNÓLOGO EN NEGOCIOS VERDES Y SOSTENIBLES', codigo: '223132', version: '1', horasLectiva: 1960, horasProductiva: 680, duracionTotal: 2640, tipoPrograma: 'Tecnólogo', pdfDocument: '' },
    { id: 2, denominacion: 'ANÁLISIS Y DESARROLLO DE SOFTWARE', codigo: '228118', version: '10/09/2021', horasLectiva: 3120, horasProductiva: 864, duracionTotal: 3984, tipoPrograma: 'Tecnólogo', pdfDocument: '' },
    { id: 3, denominacion: 'ASISTENCIA ADMINISTRATIVA', codigo: '134101', version: '01/09/2021', horasLectiva: 1344, horasProductiva: 864, duracionTotal: 2208, tipoPrograma: 'Técnico', pdfDocument: '' },
  ]);

  // 9. COMPETENCIAS + RESULTADOS
  console.log('  Competencias y RAs...');
  let compId = 1;
  let raId = 1;
  const raEntries: { id: number; competenciaId: number; codigo: string; nombre: string; duracionHoras: number; fase: string }[] = [];

  const programasComp = [
    { programaId: 1, json: gcJson as CompInput[], prefix: 'GC' },
    { programaId: 2, json: adsoJson as CompInput[], prefix: 'ADSO' },
    { programaId: 3, json: aaJson as CompInput[], prefix: 'AA' },
  ];

  for (const { programaId, json, prefix } of programasComp) {
    for (const c of json) {
      const duracionH = parseHoras(c.duracion);
      const nuc = c.norma_unidad_competencia || '';
      await db.insert(competencias).values({
        id: compId, programaId, codigo: c.codigo, nombre: c.nombre,
        duracionHoras: duracionH, normaUnidadCompetencia: nuc, porcentajeHorasDirectas: 80,
      });

      for (let ri = 0; ri < c.resultados_aprendizaje.length; ri++) {
        const raTexto = c.resultados_aprendizaje[ri];
        const limpio = raTexto.replace(/^(RA\d+[\.\s]*\s*|0?\d+[\s-]+)/, '').trim();
        const codigoRA = String(ri + 1).padStart(2, '0');
        raEntries.push({
          id: raId, competenciaId: compId, codigo: codigoRA,
          nombre: limpio, duracionHoras: 0, fase: '',
        });
        raId++;
      }
      compId++;
    }
  }

  // Bulk insert RAs
  for (let i = 0; i < raEntries.length; i += 50) {
    await db.insert(resultadosAprendizaje).values(raEntries.slice(i, i + 50));
  }
  console.log(`  → ${compId - 1} competencias, ${raEntries.length} RAs insertados`);

  // 10. PERFILES INSTRUCTOR (legacy - mapped from competencias)
  console.log('  Perfiles Instructor (legacy)...');
  await db.insert(perfilesInstructor).values([
    { id: 1, competenciaId: 1, codigo: '01', nombre: 'CIENCIAS NATURALES' },
    { id: 2, competenciaId: 2, codigo: '02', nombre: 'SST' },
  ]);

  // 11. COMPETENCIAS_PERFILES (relaciona competencias con perfiles académicos)
  console.log('  Competencias-Perfiles...');
  const perfilMap: Record<string, number> = {
    'DS': 1, 'GA': 2, 'GC': 3, 'CB': 4, 'TC': 5,
  };
  const codToPerfil: Record<string, number> = {};
  for (const p of gcJson as CompInput[]) codToPerfil[p.codigo] = perfilMap['GC'];
  for (const p of adsoJson as CompInput[]) {
    if (['220201501', '240201524', '240201528', '210201501', '240201526', '220601501', '230101507', '240202501', '240201064', '220501046', '240201529', '240201530', '999999999'].includes(p.codigo)) {
      codToPerfil[p.codigo] = perfilMap['TC'];
    } else {
      codToPerfil[p.codigo] = perfilMap['DS'];
    }
  }
  for (const p of aaJson as CompInput[]) {
    if (['240201524', '240201528', '210201501', '240201526', '220601501', '230101507', '240202501', '220501046', '240201533', '240201530', '999999999'].includes(p.codigo)) {
      codToPerfil[p.codigo] = perfilMap['TC'];
    } else {
      codToPerfil[p.codigo] = perfilMap['GA'];
    }
  }

  let cpId = 1;
  for (let pid = 1; pid <= 3; pid++) {
    const json = [gcJson, adsoJson, aaJson][pid - 1] as CompInput[];
    let baseComp = 0;
    for (let j = 0; j < pid - 1; j++) baseComp += ([gcJson, adsoJson, aaJson][j] as CompInput[]).length;
    for (let ci = 0; ci < json.length; ci++) {
      const c = json[ci];
      const perfId = codToPerfil[c.codigo] || perfilMap['TC'];
      await db.insert(competenciasPerfiles).values({ id: cpId, competenciaId: baseComp + ci + 1, perfilAcademicoId: perfId });
      cpId++;
    }
  }

  // 12. INSTRUCTORES_PERFILES
  console.log('  Instructores-Perfiles...');
  await db.insert(instructoresPerfiles).values([
    { instructorId: 1, perfilAcademicoId: 4 }, // ADRIAN → CIENCIAS BÁSICAS
    { instructorId: 1, perfilAcademicoId: 5 }, // ADRIAN → TIC Y TRANSVERSALES
    { instructorId: 2, perfilAcademicoId: 2 }, // MANUEL → GESTIÓN ADMINISTRATIVA
    { instructorId: 3, perfilAcademicoId: 1 }, // CARLOS → DESARROLLO DE SOFTWARE
    { instructorId: 3, perfilAcademicoId: 5 }, // CARLOS → TIC Y TRANSVERSALES
    { instructorId: 4, perfilAcademicoId: 3 }, // MARÍA → GESTIÓN COMERCIAL
    { instructorId: 5, perfilAcademicoId: 2 }, // LUISA → GESTIÓN ADMINISTRATIVA
  ]);

  // 13. FICHAS (sin programacion)
  console.log('  Fichas...');
  await db.insert(fichas).values([
    {
      id: 1, numeroFicha: '93939', centroFormacionId: 1,
      fechaInicio: '2025-01-01', fechaFinLectiva: '2025-12-31', fechaFin: '2026-01-01',
      modalidad: 'PRESENCIAL',
      horario: { LUNES: ['06:00-07:00', '07:00-08:00', '08:00-09:00'], MARTES: ['09:00-10:00', '10:00-11:00', '11:00-12:00'], SABADO: ['06:00-07:00', '09:00-10:00', '11:00-12:00'] },
      programaId: 1, ambienteId: 1,
    },
    {
      id: 2, numeroFicha: '2754321', centroFormacionId: 1,
      fechaInicio: '2025-02-01', fechaFinLectiva: '2025-11-30', fechaFin: '2026-01-31',
      modalidad: 'PRESENCIAL',
      horario: { LUNES: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00'], MARTES: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00'], MIERCOLES: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00'], JUEVES: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00'], VIERNES: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00'], SABADO: ['06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00'] },
      programaId: 2, ambienteId: 3,
    },
    {
      id: 3, numeroFicha: '2898765', centroFormacionId: 1,
      fechaInicio: '2025-03-01', fechaFinLectiva: '2025-12-20', fechaFin: '2026-02-28',
      modalidad: 'VIRTUAL',
      horario: { LUNES: ['14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'], MARTES: ['14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'], MIERCOLES: ['14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'], JUEVES: ['14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'], VIERNES: ['14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'], SABADO: ['14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'] },
      programaId: 2, ambienteId: 3,
    },
    {
      id: 4, numeroFicha: '2988001', centroFormacionId: 2,
      fechaInicio: '2025-04-01', fechaFinLectiva: '2025-10-31', fechaFin: '2025-12-31',
      modalidad: 'MIXTA',
      horario: { LUNES: ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'], MARTES: ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'], MIERCOLES: ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'], JUEVES: ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'], VIERNES: ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'] },
      programaId: 3, ambienteId: 4,
    },
  ]);

  // 14. NO se crea programacionInstructores ni programacionEventos (vacío para pruebas)

  console.log('=== Seed completado exitosamente ===');
}

seed().catch((err) => { console.error('Seed error:', err); process.exit(1); });
