# Plan — Gestión de Proyecto Formativo por Ficha

## Estrategia técnica

Ver plan detallado en la conversación. Resumen de archivos:

### Schema
- `src/db/schema.ts`: Eliminar `porcentajeHorasDirectas` de `competencias`. Agregar `proyectosFormativos` y `proyectoEtapasRaps`.

### API
- `server.ts`: 5 nuevos endpoints para proyecto formativo (GET/POST ficha, GET/POST etapas, PUT porcentaje).

### Frontend
- `src/components/ProyectoFormativoView.tsx`: **Crear** — vista completa con cabecera, % ejecución, pestañas de etapas, matriz de RAPs.
- `src/components/FichasView.tsx`: Botón "Proyecto" en card y tabla.
- `src/components/CurriculoModal.tsx`: Eliminar campo % ejecución directa del formulario y vista.
- `src/components/ProgramacionInstructoresView.tsx`: Leer % desde proyecto formativo de la ficha.
- `src/App.tsx`: Nueva ruta `/fichas/:fichaId/proyecto-formativo`.

### Seed
- `seed.ts`: Eliminar `porcentajeHorasDirectas` de competencias. Insertar proyectos formativos con RAPs por etapa.
