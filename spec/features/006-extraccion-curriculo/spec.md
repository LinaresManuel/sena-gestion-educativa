# Extracción Automática de Diseños Curriculares desde PDF

## Qué

Pipeline que automatiza la creación de programas, competencias y resultados de aprendizaje a partir de un PDF de diseño curricular del SENA.

1. **Extracción de texto plano** del PDF mediante script Python (PyMuPDF).
2. **Extracción estructurada vía LLM** usando la guía de extracción como system prompt, produciendo JSON.
3. **Persistencia en BD** creando el programa, sus competencias y resultados de aprendizaje.
4. **Interfaz web** con botón "Importar desde PDF" y modal de progreso.

## Para qué

Eliminar la entrada manual de programas extensos (15+ competencias, ~60 RAPs). Un diseño curricular como ADSO (~70 páginas) se importa en segundos en vez de horas de trabajo manual.

## Criterios de aceptación

- [ ] Schema BD actualizado: `programas.duracionTotal` (nullable), `competencias.normaUnidadCompetencia` (nullable).
- [ ] Script Python `scripts/extract-pdf-text.py` que extrae texto de un PDF página por página con marcadores `--- PÁGINA N ---`.
- [ ] Script usa PyMuPDF (`fitz`). Instalable vía `pip install pymupdf`.
- [ ] Guía de extracción actualizada con formato JSON adaptado al schema SQLite.
- [ ] JSON de salida con `programa.denominacion`, `programa.codigo`, `programa.version`, `programa.horas_lectiva`, `programa.horas_productiva`, `programa.duracion_total`, `programa.tipo_programa`.
- [ ] JSON de salida con `competencias[].codigo`, `competencias[].nombre`, `competencias[].norma_unidad_competencia`, `competencias[].duracion_horas` (número), `competencias[].resultados_aprendizaje` (array de strings).
- [ ] Resultados de aprendizaje se crean con `duracionHoras = 0` y `fase = ''` (editables después desde CurriculoModal).
- [ ] Fase 3 (UI + endpoint) documentada como incremental, no implementada en este hito.
- [ ] `npm run lint` sin errores nuevos.
