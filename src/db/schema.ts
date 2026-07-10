import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

// ==========================================
// FASE 1: MODELOS BASE DE INFRAESTRUCTURA E INSTRUCTORES
// ==========================================

export const regionales = sqliteTable('regionales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
});

export const centrosFormacion = sqliteTable('centros_formacion', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  regionalId: integer('regional_id').notNull().references(() => regionales.id),
});

export const tiposAmbiente = sqliteTable('tipos_ambiente', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull().unique(),
  descripcion: text('descripcion'),
});

export const ambientes = sqliteTable('ambientes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  capacidad: integer('capacidad').notNull(),
  tipoAmbienteId: integer('tipo_ambiente_id').notNull().references(() => tiposAmbiente.id),
  ubicacion: text('ubicacion'),
  estado: text('estado').notNull().default('ACTIVO'),
  centroId: integer('centro_id').notNull().references(() => centrosFormacion.id),
});

export const elementosAmbiente = sqliteTable('elementos_ambiente', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  placa: text('placa').notNull(),
  nombre: text('nombre').notNull(),
  detalle: text('detalle'),
  estado: text('estado').notNull().default('BUENO'), // EJ: BUENO, REGULAR, MALO, DE BAJA
  imagen: text('imagen'),
  ambienteId: integer('ambiente_id').notNull().references(() => ambientes.id, { onDelete: 'cascade' }),
});

export const instructores = sqliteTable('instructores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  documento: text('documento').notNull().unique(),
  nombres: text('nombres').notNull(),
  apellidos: text('apellidos').notNull(),
  tipoVinculacion: text('tipo_vinculacion').notNull(), // Ej: PLANTA, CONTRATISTA
  requisitosAcademicos: text('requisitos_academicos', { mode: 'json' }), // Guardamos array de perfiles/títulos
  estado: text('estado').notNull().default('ACTIVO'),
});

export const programas = sqliteTable('programas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  denominacion: text('denominacion').notNull(),
  codigo: text('codigo').notNull(),
  version: text('version').notNull(),
  horasLectiva: integer('horas_lectiva').notNull(),
  horasProductiva: integer('horas_productiva').notNull(),
  tipoPrograma: text('tipo_programa').notNull(),
  pdfDocument: text('pdf_document'),
}, (t) => ({
  unq: unique().on(t.codigo, t.version),
}));

export const competencias = sqliteTable('competencias', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programaId: integer('programa_id').notNull().references(() => programas.id, { onDelete: 'cascade' }),
  codigo: text('codigo').notNull(),
  nombre: text('nombre').notNull(),
  duracionHoras: integer('duracion_horas').notNull(),
  porcentajeHorasDirectas: integer('porcentaje_horas_directas').notNull().default(80),
});

export const resultadosAprendizaje = sqliteTable('resultados_aprendizaje', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  competenciaId: integer('competencia_id').notNull().references(() => competencias.id, { onDelete: 'cascade' }),
  codigo: text('codigo').notNull().default(''),
  nombre: text('nombre').notNull(),
  duracionHoras: integer('duracion_horas').notNull(),
  fase: text('fase').notNull().default(''),
});

export const perfilesInstructor = sqliteTable('perfiles_instructor', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  competenciaId: integer('competencia_id').notNull().references(() => competencias.id, { onDelete: 'cascade' }),
  codigo: text('codigo').notNull(),
  nombre: text('nombre').notNull(),
});

// ==========================================
// PERFILES ACADEMICOS (entidad independiente)
// ==========================================

export const perfilesAcademicos = sqliteTable('perfiles_academicos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  createdAt: text('created_at').notNull().default("datetime('now')"),
});

export const competenciasPerfiles = sqliteTable('competencias_perfiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  competenciaId: integer('competencia_id').notNull().references(() => competencias.id, { onDelete: 'cascade' }),
  perfilAcademicoId: integer('perfil_academico_id').notNull().references(() => perfilesAcademicos.id),
}, (t) => ({
  unq: unique().on(t.competenciaId, t.perfilAcademicoId),
}));

export const instructoresPerfiles = sqliteTable('instructores_perfiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  instructorId: integer('instructor_id').notNull().references(() => instructores.id, { onDelete: 'cascade' }),
  perfilAcademicoId: integer('perfil_academico_id').notNull().references(() => perfilesAcademicos.id),
}, (t) => ({
  unq: unique().on(t.instructorId, t.perfilAcademicoId),
}));

export const fichas = sqliteTable('fichas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numeroFicha: text('numero_ficha').notNull().unique(),
  centroFormacionId: integer('centro_formacion_id').notNull().references(() => centrosFormacion.id),
  fechaInicio: text('fecha_inicio').notNull(), // ISO Date String YYYY-MM-DD
  fechaFinLectiva: text('fecha_fin_lectiva').notNull(), // ISO Date String YYYY-MM-DD
  fechaFin: text('fecha_fin').notNull(), // ISO Date String YYYY-MM-DD
  modalidad: text('modalidad').notNull(), // VIRTUAL, PRESENCIAL, MIXTA
  horario: text('horario', { mode: 'json' }).notNull(), // { [dia: string]: string[] } 
  programaId: integer('programa_id').notNull().references(() => programas.id),
  ambienteId: integer('ambiente_id').notNull().references(() => ambientes.id),
});

export const programacionInstructores = sqliteTable('programacion_instructores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programaId: integer('programa_id').notNull().references(() => programas.id),
  fichaId: integer('ficha_id').notNull().references(() => fichas.id),
  competenciaId: integer('competencia_id').notNull().references(() => competencias.id),
  instructorId: integer('instructor_id').notNull().references(() => instructores.id),
  resultadosIds: text('resultados_ids', { mode: 'json' }).notNull(),
  eventos: text('eventos', { mode: 'json' }), // { [isoDate]: { [hora]: resultadoId } }
});

export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nombre: text('nombre').notNull(),
  rol: text('rol').notNull().default('editor'), // Deprecated: usar usuarios_roles con la nueva tabla roles
  debeCambiarPassword: integer('debe_cambiar_password', { mode: 'boolean' }).notNull().default(false),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  ultimoLoginAt: text('ultimo_login_at'),
  createdAt: text('created_at').notNull().default("datetime('now')"),
});

// ==========================================
// SISTEMA DE PERMISOS GRANULARES (TAREA Y)
// ==========================================

export const permisos = sqliteTable('permisos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  codigo: text('codigo').notNull().unique(), // Ej: 'programacion.ver', 'inventario.editar'
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  modulo: text('modulo').notNull(), // Ej: 'programacion', 'inventario', 'notas'
  accion: text('accion').notNull(), // Ej: 'ver', 'editar', 'crear', 'eliminar'
});

export const rolesPermisos = sqliteTable('roles_permisos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rol: text('rol').notNull(), // 'admin', 'editor', 'lector', 'instructor', 'aprendiz'
  permisoId: integer('permiso_id').notNull().references(() => permisos.id, { onDelete: 'cascade' }),
}, (t) => ({
  unq: unique().on(t.rol, t.permisoId),
}));

export const usuariosRoles = sqliteTable('usuarios_roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuarioId: integer('usuario_id').notNull().references(() => usuarios.id, { onDelete: 'cascade' }),
  rol: text('rol').notNull(), // 'admin', 'editor', 'lector', 'instructor', 'aprendiz'
}, (t) => ({
  unq: unique().on(t.usuarioId, t.rol),
}));
