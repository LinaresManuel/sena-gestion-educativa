import { db } from './src/db/index.ts';
import { regionales, centrosFormacion, tiposAmbiente, ambientes, elementosAmbiente, instructores, programas, competencias, resultadosAprendizaje, perfilesInstructor, fichas } from './src/db/schema.ts';

async function seed() {
  console.log('Seeding database...');
  
  const data = {
  "regionales": [
    {
      "id": 1,
      "codigo": "95",
      "nombre": "GUAINIA"
    },
    {
      "id": 2,
      "codigo": "96",
      "nombre": "ANTIOQUIA"
    }
  ],
  "centrosFormacion": [
    {
      "id": 1,
      "codigo": "9547",
      "nombre": "CAENA",
      "regionalId": 1
    }
  ],
  "tiposAmbiente": [
    {
      "id": 1,
      "nombre": "001",
      "descripcion": "LABORATORIO"
    },
    {
      "id": 2,
      "nombre": "002",
      "descripcion": "POLIVALENTES"
    }
  ],
  "ambientes": [
    {
      "id": 1,
      "codigo": "001",
      "nombre": "GUACRU",
      "capacidad": 30,
      "tipoAmbienteId": 1,
      "ubicacion": "23124",
      "estado": "ACTIVO",
      "centroId": 1
    }
  ],
  "elementosAmbiente": [
    {
      "id": 1,
      "placa": "7474747",
      "nombre": "COMPUTADOR LENOVO",
      "detalle": "KDIDIID",
      "estado": "BUENO",
      "imagen": "",
      "ambienteId": 1
    }
  ],
  "instructores": [
    {
      "id": 1,
      "documento": "9393939",
      "nombres": "aDRIAN",
      "apellidos": "MER",
      "tipoVinculacion": "PLANTA",
      "requisitosAcademicos": [
        "QUIMICO",
        "MATEMATICO"
      ],
      "estado": "ACTIVO"
    },
    {
      "id": 2,
      "documento": "838383",
      "nombres": "MANUEL",
      "apellidos": "R",
      "tipoVinculacion": "PLANTA",
      "requisitosAcademicos": [
        "ING INDUSTRIAL"
      ],
      "estado": "ACTIVO"
    }
  ],
  "programas": [
    {
      "id": 1,
      "denominacion": "TECNOLOG EN NEGOCIOS VERDES",
      "codigo": "928928",
      "version": "1",
      "horasLectiva": 1960,
      "horasProductiva": 680,
      "tipoPrograma": "Tecnólogo",
      "pdfDocument": ""
    }
  ],
  "competencias": [
    {
      "id": 1,
      "programaId": 1,
      "codigo": "282828",
      "nombre": "ETICA",
      "duracionHoras": 120,
      "porcentajeHorasDirectas": 80
    },
    {
      "id": 2,
      "programaId": 1,
      "codigo": "29293",
      "nombre": "FISICA",
      "duracionHoras": 30,
      "porcentajeHorasDirectas": 80
    }
  ],
  "resultadosAprendizaje": [
    {
      "id": 1,
      "competenciaId": 1,
      "codigo": "01",
      "nombre": "RESULTADO E1",
      "duracionHoras": 30,
      "fase": "Analisis"
    },
    {
      "id": 2,
      "competenciaId": 1,
      "codigo": "02",
      "nombre": "rESULTADO E2",
      "duracionHoras": 90,
      "fase": "Planeación"
    },
    {
      "id": 3,
      "competenciaId": 2,
      "codigo": "01",
      "nombre": "FISICA",
      "duracionHoras": 30,
      "fase": "Analisis"
    }
  ],
  "perfilesInstructor": [
    {
      "id": 1,
      "competenciaId": 1,
      "codigo": "01",
      "nombre": "QUIMICO"
    },
    {
      "id": 2,
      "competenciaId": 1,
      "codigo": "02",
      "nombre": "ING INDUSTRIAL"
    },
    {
      "id": 3,
      "competenciaId": 2,
      "codigo": "03",
      "nombre": "MATEMATICO"
    }
  ],
  "fichas": [
    {
      "id": 1,
      "numeroFicha": "93939",
      "centroFormacionId": 1,
      "fechaInicio": "2025-01-01",
      "fechaFinLectiva": "20205-12-31",
      "fechaFin": "12027-01-01",
      "modalidad": "PRESENCIAL",
      "horario": {
        "LUNES": [
          "06:00-07:00",
          "07:00-08:00",
          "08:00-09:00"
        ],
        "MARTES": [
          "09:00-10:00",
          "10:00-11:00",
          "11:00-12:00"
        ],
        "SABADO": [
          "06:00-07:00",
          "09:00-10:00",
          "11:00-12:00"
        ]
      },
      "programaId": 1,
      "ambienteId": 1
    }
  ]
};
  
  if (data.regionales.length > 0) await db.insert(regionales).values(data.regionales).onConflictDoNothing();
  if (data.centrosFormacion.length > 0) await db.insert(centrosFormacion).values(data.centrosFormacion).onConflictDoNothing();
  if (data.tiposAmbiente.length > 0) await db.insert(tiposAmbiente).values(data.tiposAmbiente).onConflictDoNothing();
  if (data.ambientes.length > 0) await db.insert(ambientes).values(data.ambientes).onConflictDoNothing();
  if (data.elementosAmbiente.length > 0) await db.insert(elementosAmbiente).values(data.elementosAmbiente).onConflictDoNothing();
  if (data.instructores.length > 0) await db.insert(instructores).values(data.instructores).onConflictDoNothing();
  if (data.programas.length > 0) await db.insert(programas).values(data.programas).onConflictDoNothing();
  if (data.competencias.length > 0) await db.insert(competencias).values(data.competencias).onConflictDoNothing();
  if (data.resultadosAprendizaje.length > 0) await db.insert(resultadosAprendizaje).values(data.resultadosAprendizaje).onConflictDoNothing();
  if (data.perfilesInstructor.length > 0) await db.insert(perfilesInstructor).values(data.perfilesInstructor).onConflictDoNothing();
  if (data.fichas.length > 0) await db.insert(fichas).values(data.fichas).onConflictDoNothing();
  
  console.log('Seed completed successfully!');
}

seed().catch(console.error);
