# Plan — Extracción Automática de Diseños Curriculares

## Estrategia técnica

Tres fases incrementales. Este hito implementa Fase 1 y prepara el terreno para Fases 2 y 3.

### Fase 1: Script Python de extracción de texto

**Archivo**: `scripts/extract-pdf-text.py`

**Dependencia**: `PyMuPDF` (`pip install pymupdf`)

**Uso**: `python scripts/extract-pdf-text.py "ruta/al/diseno.pdf"`

**Comportamiento**: Itera páginas del PDF con `fitz.open()`, extrae texto con `page.get_text()`, imprime con separador `--- PÁGINA N ---`.

### Fase 2: Extracción estructurada vía LLM

**Archivo futuro**: `scripts/extract-curriculo.py`

1. Lee PDF → texto plano (reusa Fase 1).
2. Lee `extraccion/guia_extraccion_diseno_curricular.md` como system prompt.
3. Construye payload y envía al LLM (OpenAI / Claude / Ollama, configurable por ENV).
4. Valida JSON contra el schema esperado.
5. Imprime JSON resultante.

### Fase 3: Integración UI + API

- Endpoint `POST /api/programas/importar-pdf` en `server.ts`.
- Botón "Importar desde PDF" en `ProgramasView.tsx`.
- Componente `ImportarPDFModal.tsx` con progreso paso a paso.
- Al confirmar: crea programa, competencias y RAPs en BD.

### Schema BD (cambios)

```diff
programas {
  ...
+ duracionTotal: integer('duracion_total'),
}
competencias {
  ...
+ normaUnidadCompetencia: text('norma_unidad_competencia'),
}
```

### Guía de extracción (cambios en `extraccion/guia_extraccion_diseno_curricular.md`)

Formato de salida JSON adaptado a SQLite:

```json
{
  "programa": {
    "denominacion": "string",
    "codigo": "string",
    "version": "string",
    "horas_lectiva": number,
    "horas_productiva": number,
    "duracion_total": number,
    "tipo_programa": "string"
  },
  "competencias": [
    {
      "codigo": "string",
      "nombre": "string",
      "norma_unidad_competencia": "string",
      "duracion_horas": number,
      "resultados_aprendizaje": ["string", "string"]
    }
  ]
}
```

Los RAPs se crean con `duracionHoras = 0` y `fase = ''` — editables desde CurriculoModal.

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| `src/db/schema.ts` | + `duracionTotal`, + `normaUnidadCompetencia` |
| `extraccion/guia_extraccion_diseno_curricular.md` | Adaptar formato JSON al schema SQLite |
| `scripts/extract-pdf-text.py` | **Crear** — extracción con PyMuPDF |
| `spec/features/006-extraccion-curriculo/spec.md` | **Crear** |
| `spec/features/006-extraccion-curriculo/plan.md` | **Crear** |
| `spec/features/006-extraccion-curriculo/tasks.md` | **Crear** |

### Lo que NO cambia

- APIs existentes de programas/competencias/RAPs
- Permisos
- CurriculoModal (sigue funcionando igual para edición manual)
- Seed data
