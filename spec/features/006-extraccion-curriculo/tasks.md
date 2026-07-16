# Tasks — Extracción Automática de Diseños Curriculares

## Schema BD

- [ ] Agregar `duracionTotal: integer('duracion_total')` nullable en tabla `programas`
- [ ] Agregar `normaUnidadCompetencia: text('norma_unidad_competencia')` nullable en tabla `competencias`

## Guía de extracción

- [ ] Adaptar formato de salida JSON en `guia_extraccion_diseno_curricular.md` al schema SQLite
- [ ] Actualizar ejemplo ADSO con los nuevos campos y tipos
- [ ] Especificar que `resultados_aprendizaje` es array de strings (sin duración/fase individual)

## Script Python de extracción

- [ ] Instalar PyMuPDF: `python -m pip install pymupdf`
- [ ] Crear `scripts/extract-pdf-text.py` con PyMuPDF
- [ ] Extraer texto página por página con marcadores `--- PÁGINA N ---`
- [ ] Probar contra `extraccion/diseno-curricular/Diseño ADSO.pdf`
- [ ] Verificar que la salida contiene las secciones de competencias y RAPs

## Script LLM (Fase 2 — documentado, no implementado)

- [ ] (Futuro) `scripts/extract-curriculo.py` — envía texto + prompt a LLM y recibe JSON

## Integración UI (Fase 3 — documentado, no implementado)

- [ ] (Futuro) Endpoint `POST /api/programas/importar-pdf`
- [ ] (Futuro) Modal de importación con progreso
- [ ] (Futuro) Botón "Importar desde PDF" en ProgramasView

## Verificación

- [ ] `npm run lint` — sin errores nuevos
- [ ] Commit + deploy sync + push
