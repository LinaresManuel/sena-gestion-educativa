# Manual de Usuario

## SENA Gestión Educativa (SenaSchedule v1.0)

---

| Campo | Información |
|---|---|
| **Nombre del Sistema** | SENA Gestión Educativa (SenaSchedule) |
| **Versión** | 1.0 |
| **Fecha** | Julio 2026 |
| **Destinatarios** | Coordinadores Académicos, Instructores, Administradores del Sistema, Personal de Dirección |
| **Propósito** | Guía operativa paso a paso para la gestión de infraestructura, talento humano, oferta académica y programación horaria |

---

## 1. Introducción

Este manual describe cómo utilizar la plataforma **SENA Gestión Educativa** para gestionar la infraestructura educativa, el talento humano y la programación académica del Centro de Formación. El sistema está accesible desde cualquier navegador web conectado a la red local del centro.

---

## 2. Acceso e Inicio de Sesión

### 2.1 Requisitos de Acceso

- Un dispositivo con navegador web (Chrome, Firefox, Edge o Safari).
- Conexión a la red local (LAN) del Centro de Formación.
- Credenciales de acceso proporcionadas por el Administrador del Sistema.

### 2.2 Iniciar Sesión

1. Abra el navegador yIngrese la dirección del sistema (por ejemplo, `http://192.168.1.100:3000`).
2. Se mostrará la pantalla de inicio de sesión.
3. Digite su **Usuario** en el campo correspondiente.
4. Digite su **Contraseña** en el segundo campo. Puede hacer clic en el icono de ojo (👁) para mostrar u ocultar la contraseña.
5. Haga clic en el botón **Ingresar**.

> 📸 **[CAPTURA DE PANTALLA: Pantalla de Login]**
> *Formulario central con logo de SENA Gestión Educativa, campos "Usuario" y "Contraseña", botón azul "Ingresar" y texto inferior "Acceso restringido. Solo personal autorizado."*

Si las credenciales son correctas, el sistema lo redireccioná al **Dashboard**. Si son incorrectas, aparecerá un mensaje de error en rojo.

### 2.3 Primer Ingreso Obligatorio

Si es su primer ingreso al sistema, tras autenticarse se le redirigirá automáticamente a la pantalla de **Cambio de Contraseña**. Debe crear una nueva contraseña segura:

1. Digite su **Nueva contraseña** (mínimo 8 caracteres).
2. Digite la **Confirmación de la nueva contraseña** (debe coincidir exactamente).
3. Haga clic en **Actualizar contraseña**.

> 📸 **[CAPTURA DE PANTALLA: Formulario de Cambio Obligatorio de Contraseña]**
> *Formulario con icono de llave, título "Cambiar contraseña", mensaje "Tu contraseña temporal ha expirado. Crea una nueva contraseña para continuar.", dos campos de contraseña y botón azul "Actualizar contraseña".*

**Importante:** La contraseña temporal original es `Admin123!`. El sistema obliga a cambiarla en el primer inicio de sesión por razones de seguridad.

---

## 3. Entorno de Trabajo y Navegación

### 3.1 Menú Lateral (Sidebar)

Al iniciar sesión, verá un menú lateral izquierdo que contiene los módulos del sistema. **El menú se adapta automáticamente según sus permisos**: solo aparecen los módulos que usted tiene autorizados para consultar.

Los módulos disponibles son:

| Módulo | Icono | Descripción |
|---|---|---|
| **Dashboard** | Panel de control | Vista general con tarjetas de acceso rápido |
| **Regionales** | Mapa | Gestión de regionales del SENA |
| **Centros** | Edificio | Centros de formación por regional |
| **Ambientes** | Casa | Salones, talleres y laboratorios |
| **Tipos de Ambientes** | Casa (gris) | Clasificaciones de ambientes |
| **Instructores** | Personas | Personal instructorado |
| **Perfiles Académicos** | Personas (púrpura) | Catálogo de perfiles |
| **Programas** | Libro | Programas de formación |
| **Fichas** | Libro (verde) | Grupos de aprendices |
| **Programación** | Calendario | Asignación de horarios |
| **Administración** | Escudo (solo admin) | Usuarios, roles y permisos |

> 📸 **[CAPTURA DE PANTALLA: Menú Lateral desplegado]**
> *Sidebar blanco con logo "SenaSchedule" arriba, lista de módulos con iconos, nombre del usuario y botón "Cerrar sesión" abajo. La sección "Administración" aparece separada por una línea divisora.*

### 3.2 Dashboard

El **Dashboard** es la pantalla principal que se muestra al iniciar sesión. Presenta tarjetas clickeables para cada módulo disponible. Haga clic en cualquier tarjeta para acceder directamente al módulo correspondiente.

> 📸 **[CAPTURA DE PANTALLA: Dashboard con tarjetas de módulos]**
> *Cuadrícula de tarjetas blancas con bordes redondeados, cada una con un icono de color, título del módulo y descripción breve. Ejemplo: icono de calendario en índigo para "Programación" con texto "Asigna instructores a resultados de aprendizaje."*

### 3.3 Herramientas de Navegación

#### Cambiador de Vista (Toggle)

En los módulos de **Fichas**, puede alternar entre dos formas de visualización:

- **Cards** (tarjetas): Vista en cuadrícula ideal para pantallas grandes.
- **Tabla**: Vista en lista ideal para escanear muchos registros rápidamente.

Haga clic en los botones **Cards** o **Tabla** en la barra de herramientas para cambiar.

#### Buscadores y Filtros

Los módulos de **Fichas** y **Programación** incluyen filtros con búsqueda:

1. Haga clic en un filtro (por ejemplo, **Regional**).
2. Escriba texto para buscar entre las opciones.
3. Seleccione una opción de la lista.
4. Para limpiar todos los filtros, haga clic en **Limpiar**.

Los filtros se aplican en cascada: al seleccionar una **Regional**, los **Centros** se filtran automáticamente.

#### Badges de Conteo

Algunos módulos muestran indicadores como **3/5** indicando cuántos elementos están seleccionados respecto al total disponible.

---

## 4. Guía Operativa por Módulo

### 4.1 Gestión de Infraestructura

#### 4.1.1 Regionales

**¿Qué es una Regional?** Una región geográfica del SENA que agrupa centros de formación.

**Crear una Regional:**

1. Navegue a **Regionales** en el menú lateral.
2. Haga clic en el botón **Nueva Regional** (color ámbar).
3. Digite el **Código** (por ejemplo, `11`).
4. Digite el **Nombre** (por ejemplo, `Distrito Capital`).
5. Haga clic en **Crear**.

**Editar una Regional:**

1. En la tabla de regionales, haga clic en el icono de **lápiz** (✏️) de la fila a editar.
2. Modifique los campos deseados.
3. Haga clic en **Actualizar**.

**Eliminar una Regional:**

1. Haga clic en el icono de ** papelera** (🗑️) de la fila a eliminar.
2. El sistema mostrará las dependencias (centros asociados). Si dependencias se pueden eliminar en cascada, aparecerán en color ámbar. Si bloquean la eliminación, aparecerán en rojo.
3. Si no hay bloqueos, haga clic en **Continuar** y luego en **Eliminar** para confirmar.

> 📸 **[CAPTURA DE PANTALLA: Módulo de Regionales con tabla y modal de crear/editar]**
> *Tabla con columnas Código, Nombre y Acciones. Botón "Nueva Regional" arriba a la derecha. Modal emergente con fondo semitransparente, campos Código y Nombre, botones "Cancelar" y "Crear".*

#### 4.1.2 Centros de Formación

**Crear un Centro:**

1. Navegue a **Centros**.
2. Haga clic en **Nuevo Centro**.
3. Digite el **Código** (por ejemplo, `9202`).
4. Digite el **Nombre**.
5. Seleccione la **Regional** a la que pertenece (desplegable).
6. Haga clic en **Crear**.

La tabla muestra: Código, Nombre, Regional y botones de Acción.

#### 4.1.3 Tipos de Ambiente

Los tipos de ambiente clasifican los espacios físicos (Aula, Taller, Laboratorio, etc.).

**Crear un Tipo:**

1. Navegue a **Tipos de Ambientes**.
2. Haga clic en **Nuevo Tipo**.
3. Digite el **Nombre** (por ejemplo, `Laboratorio de Sistemas`).
4. Opcionalmente, escriba una **Descripción**.
5. Haga clic en **Crear**.

#### 4.1.4 Ambientes de Aprendizaje

**Crear un Ambiente:**

1. Navegue a **Ambientes**.
2. Haga clic en **Nuevo Ambiente**.
3. Seleccione el **Centro de Formación** al que pertenece.
4. Digite el **Código** (por ejemplo, `A-101`).
5. Ingrese la **Capacidad** (número de personas).
6. Digite el **Nombre** (por ejemplo, `Sala de Sistemas 1`).
7. Seleccione el **Tipo** de ambiente.
8. Seleccione el **Estado**: ACTIVO, INACTIVO o MANTENIMIENTO.
9. Opcionalmente, ingrese la **Ubicación** (coordenadas o URL de Maps).
10. Haga clic en **Crear**.

> 📸 **[CAPTURA DE PANTALLA: Módulo de Ambientes y Modal de Crear/Editar Ambiente]**
> *Tabla de ambientes con columnas Código, Nombre, Centro, Capacidad/Tipo y Acciones. Modal con formulario de 7 campos distribuidos en dos columnas, incluyendo desplegables para Centro, Tipo y Estado.*

**Gestionar Elementos (Inventario):**

Cada ambiente puede tener un inventario de elementos (equipos, mobiliario):

1. En la tabla de ambientes, haga clic en el **icono de lista** (📋) de la fila del ambiente.
2. Se abrirá una vista con el inventario actual.
3. Para agregar un elemento, complete los campos: **No Placa**, **Nombre del Bien**, **Detalle** (opcional), **Estado** (BUENO, REGULAR, MALO, DE BAJA) y **Foto** (opcional).
4. Haga clic en **Agregar**.
5. Para editar o eliminar un elemento, use los iconos de acción en la tabla.

---

### 4.2 Oferta Académica y Talento Humano

#### 4.2.1 Programas de Formación

**Crear un Programa:**

1. Navegue a **Programas**.
2. Haga clic en **Nuevo Programa**.
3. Complete los campos:
   - **Denominación del Programa** (nombre completo)
   - **Código** del programa
   - **Versión**
   - **Horas Etapa Lectiva** (número)
   - **Horas Etapa Productiva** (número)
   - **Tipo de Programa** (Técnico, Tecnólogo, Especialización Tecnológica, Operario, Auxiliar, Curso Especial)
   - **Documento PDF** (opcional, arrastre un archivo o haga clic para seleccionar)
4. Haga clic en **Crear**.

La tabla muestra: Programa (con enlace de descarga PDF si existe), Código/Versión, Tipo, Total de Horas y Acciones.

#### 4.2.2 Currículo del Programa (Competencias y RAPs)

Para gestionar el contenido académico de un programa:

1. En la tabla de programas, haga clic en el **icono de lista** (📋) "Contenidos Curriculares".
2. Se abrirá el **modal de Currículo**.

**Agregar una Competencia:**

1. En la parte superior del modal, digite el **Código** de la competencia (el sistema sugiere códigos existentes).
2. Digite el **Nombre de la Competencia**.
3. Ingrese la **Duración en Horas**.
4. Haga clic en **Añadir**.

**Agregar Resultados de Aprendizaje (RAPs):**

1. Expanda la competencia haciendo clic en ella.
2. Haga clic en **+ Añadir RA**.
3. Complete: **Código** (opcional), **Nombre**, **Horas** y **Fase** (Análisis, Planeación, Ejecución, Evaluación, Complementario).
4. Haga clic en **Guardar**.

**Asignar Perfiles a Competencias:**

1. Dentro de la competencia expandida, haga clic en **+ Añadir Perfil**.
2. Seleccione el perfil académico de la lista.
3. Haga clic en **Asignar**.

El sistema valida automáticamente si las horas de los RAPs coinciden con las horas de la competencia, mostrando una indicación verde ✅ o de advertencia ⚠️.

#### 4.2.3 Instructores

**Crear un Instructor:**

1. Navegue a **Instructores**.
2. Haga clic en **Nuevo Instructor**.
3. Complete los campos de datos personales:
   - **Documento** (número de identificación)
   - **Nombres** y **Apellidos**
   - **Tipo de Vinculación** (PLANTA o CONTRATISTA)
   - **Centro de Formación** (desplegable)
   - **Estado** (ACTIVO o INACTIVO)
4. Seleccione los **Perfiles Académicos** marcando al menos un checkbox.
5. Configure la **Disponibilidad Semanal** en la cuadrícula interactiva:
   - Haga clic en una celda para seleccionar/deseleccionar una hora.
   - Puede arrastrar el mouse para seleccionar un rango rectangular de horas.
   - Las celdas seleccionadas se muestran en color índigo.
6. Haga clic en **Crear**.

> 📸 **[CAPTURA DE PANTALLA: Modal de Crear/Editar Instructor]**
> *Modal ancho (max-w-4xl) con dos columnas: izquierda con campos de formulario (Documento, Nombres, Apellidos, Tipo Vinculación, Centro, Perfiles académicos como checkboxes, Estado); derecha con cuadrícula interactiva de 6 días × 16 horas (06:00-22:00) para configurar disponibilidad semanal.*

**Ver Agenda de un Instructor:**

1. En la tabla de instructores, haga clic en el **icono de calendario** 📅 de la fila del instructor.
2. Se abrirá un modal con la agenda semanal en formato de cuadrícula read-only.
3. Use las flechas **◀** y **▶** para navegar entre semanas.
4. Las celdas coloreadas indican eventos programados:
   - **Azul**: Planificado
   - **Verde**: Ejecutado
   - **Rojo**: Cancelado
5. Haga clic en **Cerrar** para salir.

#### 4.2.4 Perfiles Académicos

Los perfiles académicos son entidades independientes que se asignan a competencias e instructores.

**Crear un Perfil:**

1. Navegue a **Perfiles Académicos**.
2. Haga clic en **Nuevo Perfil**.
3. Digite el **Código** (por ejemplo, `BD`).
4. Digite el **Nombre** (por ejemplo, `Bases de Datos`).
5. Opcionalmente, escriba una **Descripción**.
6. Haga clic en **Guardar**.

La tabla muestra: Código, Nombre, Descripción, conteo de Competencias asociadas e Instructores asociados.

#### 4.2.5 Fichas (Grupos de Aprendices)

**Crear una Ficha:**

1. Navegue a **Fichas**.
2. Haga clic en **Nueva Ficha**.
3. Complete los campos de datos:
   - **Número de Ficha** (identificador único)
   - **Modalidad** (PRESENCIAL, VIRTUAL o MIXTA)
   - **Programa de Formación** (desplegable)
   - **Fecha Inicio**, **Fin Lectiva** y **Fin Ficha** (campos de fecha)
   - **Centro de Formación** y **Ambiente de Formación** (desplegables)
4. Configure el **Horario de Formación** en la cuadrícula interactiva:
   - Haga clic en las celdas para seleccionar los días y horas de formación.
   - Puede arrastrar para seleccionar rangos rectangulares.
   - Las celdas seleccionadas se muestran en púrpura.
5. Haga clic en **Crear**.

> 📸 **[CAPTURA DE PANTALLA: Vista de Fichas en modo Cards]**
> *Cuadrícula de tarjetas blancas, cada una mostrando: badge de modalidad (púrpura/azul/ámbar), número de ficha, nombre del programa, fechas formateadas DD/MM/AAAA, centro y ambiente. Botones en el footer: "Ver Horario", "Proyecto", Editar (✏️), Eliminar (🗑️).*

> 📸 **[CAPTURA DE PANTALLA: Editor gráfico de horario semanal de Ficha]**
> *Cuadrícula CSS Grid con columnas LUN-SAB y filas 06:00-22:00. Celdas seleccionadas en púrpura claro con borde púrpura. Hover muestra cambio de color. Fondo del contenedor con borde redondeado y fondo gris claro.*

**Usar Filtros:**

1. Use los filtros **Programa**, **Regional**, **Centro** y **Ambiente** en la barra superior.
2. Los filtros se combinan en AND (todos se aplican simultáneamente).
3. Haga clic en **Limpiar** para restablecer todos los filtros.

**Ver Detalles de una Ficha (modo Tabla):**

1. Cambie a modo **Tabla** usando el toggle.
2. Haga clic en el **icono de ojo** (👁) de la fila.
3. Se abrirá un modal con toda la información de la ficha en modo solo lectura, incluyendo el horario.

---

### 4.3 Programación de Instructores

El módulo de **Programación** permite asignar instructores a ambientes en franjas horarias específicas, validando automáticamente los conflictos de disponibilidad.

#### Flujo de Programación Paso a Paso

1. **Seleccione una Regional** (filtro opcional).
2. **Seleccione un Centro** (filtrado por la regional).
3. **Seleccione una Ficha**: al hacerlo, el sistema carga automáticamente el programa, competencias y eventos existentes.
4. **Seleccione una Competencia**: aparecen las competencias del programa de la ficha.
5. **Seleccione un Instructor**: el sistema muestra solo los instructores del centro con perfiles compatibles con la competencia seleccionada.
6. **Seleccione un Resultado de Aprendizaje (RA)**: en el panel lateral derecho, haga clic en el RA que desea programar.
7. **Pinte en el calendario**: arrastre el mouse sobre las celdas del calendario para asignar el RA seleccionado.
8. **Guarde**: haga clic en **Guardar** para persistir los cambios.

> 📸 **[CAPTURA DE PANTALLA: Pantalla de Programación de Instructores con el panel lateral de RAs]**
> *Panel dividido: lado izquierdo (4/5) con calendario semanal donde las celdas muestran códigos de RA en diferentes colores (azul=planificado, verde=ejecutado, rojo=cancelado); lado derecho (1/5) con tarjetas de RAs que muestran código, nombre, barra de progreso y horas asignadas/maximas.*

#### Estados de los Eventos

| Estado | Color | Significado |
|---|---|---|
| **PLANIFICADO** | Azul | Evento creado, pendiente de ejecución |
| **EJECUTADO** | Verde | Evento realizado |
| **CANCELADO** | Rojo | Evento anulado |

#### Detección de Conflictos

El sistema detecta automáticamente:

- **Conflictos de instructor**: si el instructor ya está asignado a otro evento en la misma fecha y hora.
- **Conflictos de ambiente**: si el ambiente ya está ocupado en la misma fecha y hora.
- **Límite de horas del RA**: cuando se alcanza el máximo de horas programadas para un resultado de aprendizaje.

Los conflictos se muestran como celdas en color ámbar con un icono de advertencia (⚠️).

#### Gestionar Eventos

**Ver detalle de un evento:**
1. Haga clic en una celda ocupada del calendario.
2. Se abrirá un modal con los datos del evento: Fecha, Hora, RA, Instructor y Estado.
3. Puede cambiar el estado haciendo clic en los botones **PLANIFICADO**, **EJECUTADO** o **CANCELADO**.

**Eliminar un evento:**
1. Coloque el mouse sobre la celda del evento.
2. Haga clic en el **icono X** que aparece en la esquina superior derecha.
3. Confirme la eliminación.

**Limpiar toda la programación de una ficha:**
1. Haga clic en **Limpiar Todo** (botón rojo en la barra superior).
2. Confirme la acción. Esto eliminará TODOS los eventos de la ficha.

#### Navegación de Semanas

Use las flechas **◀** y **▶** para navegar entre semanas. El rango de fechas se muestra en la barra superior del calendario.

---

### 4.4 Proyecto Formativo por Ficha

El **Proyecto Formativo** gestiona la distribución de Resultados de Aprendizaje por etapas para cada ficha.

**Acceder al Proyecto Formativo:**

1. Navegue a **Fichas**.
2. Haga clic en el botón **Proyecto** (icono 📄) en la tarjeta o fila de la ficha.
3. Se abrirá la vista dedicada del proyecto formativo.

> 📸 **[CAPTURA DE PANTALLA: Vista del Proyecto Formativo de una Ficha]**
> *Vista con header que muestra número de ficha y programa. Selector de % Ejecución Directa (70%/80%). Cinco pestañas horizontales: Análisis, Planeación, Ejecución, Evaluación, Complementario. Debajo, lista jerárquica de competencias con RAPs como checkboxes. RAPs ya asignados a otras etapas muestran badge de advertencia "En {etapa}".*

**Configurar el Porcentaje de Ejecución Directa:**

1. Use el desplegable **% Ejec. Directa** en la parte superior.
2. Seleccione **70%** u **80%**.
3. Haga clic en **Guardar**.

**Asignar RAPs por Etapa:**

1. Haga clic en la pestaña de la etapa deseada (Análisis, Planeación, Ejecución, Evaluación o Complementario).
2. Marque los checkboxes de los RAPs que desea asignar a esa etapa.
3. Si un RAP ya está asignado a otra etapa, aparecerá un badge de advertencia. Al marcarlo, se le preguntará si desea **Mover** el RAP de una etapa a otra.
4. Haga clic en **Guardar Asignación**.

**Buscar RAPs:**

Use la barra de búsqueda "Buscar competencia o RA..." para filtrar por código o nombre. La búsqueda no distingue tildes ni acentos.

---

### 4.5 Panel de Administración

> **Nota:** Este módulo es accesible **únicamente** para usuarios con permisos de administrador.

#### 4.5.1 Gestión de Usuarios

**Crear un Usuario:**

1. Navegue a **Administración** y seleccione la pestaña **Usuarios**.
2. Haga clic en **Nuevo Usuario**.
3. Complete los campos:
   - **Username** (nombre de usuario para iniciar sesión)
   - **Nombre completo**
   - **Roles**: seleccione al menos un rol haciendo clic en los botones de rol (se resaltan en azul al estar activos).
4. Haga clic en **Guardar**.
5. Se mostrará una contraseña temporal auto-generada. ** Cópiala y envíala al usuario de forma segura.** El sistema mostrará la contraseña solo una vez.

> 📸 **[CAPTURA DE PANTALLA: Modal de Crear Usuario con contraseña generada]**
> *Modal con campos Username, Nombre completo y botones de Roles. Debajo, un cuadro azul con la contraseña temporal generada, botón de copiar al portapapeles y advertencia de que el usuario deberá cambiarla en el primer ingreso.*

**Resetear Contraseña de un Usuario:**

1. En la pestaña **Usuarios**, haga clic en el **icono de llave** (🔑) de la fila del usuario.
2. Confirme la acción haciendo clic en **Generar contraseña**.
3. Se generará una nueva contraseña temporal. Compártala con el usuario.

**Editar un Usuario:**

1. Haga clic en el **icono de lápiz** (✏️) de la fila.
2. Modifique nombre, roles o estado (activo/inactivo).
3. Haga clic en **Guardar**.

**Eliminar un Usuario:**

1. Haga clic en el **icono de papelera** (🗑️).
2. Confirme la eliminación.

#### 4.5.2 Gestión de Roles y Permisos

**Crear un Rol:**

1. Navegue a la pestaña **Roles y Permisos**.
2. Haga clic en **Nuevo**.
3. Digite el **Nombre del rol** (por ejemplo, `Coordinador`).
4. Marque los permisos que desea asignar, organizados por módulo. Cada módulo tiene permisos de: Ver, Crear, Editar, Eliminar.
5. Haga clic en **Crear Rol**.

**Asignar Permisos a un Rol Existente:**

1. En la lista de roles (panel izquierdo), haga clic en el rol que desea modificar.
2. En el editor de permisos (panel derecho), use los siguientes botones de acceso rápido:
   - **Solo lectura**: asigna solo permisos de "ver" en todos los módulos.
   - **CRUD Completo**: asigna todos los permisos.
   - **Limpiar**: elimina todos los permisos.
3. También puede marcar/desmarcar permisos individualmente usando los checkboxes.
4. Use el **buscador** superior para filtrar permisos por nombre o módulo.
5. Haga clic en **Guardar** cuando termine.

> 📸 **[CAPTURA DE PANTALLA: Matriz de Roles y Permisos en el Panel de Administración]**
> *Panel dividido: izquierda con lista de roles (uno seleccionado en azul); derecha con botones "Solo lectura", "CRUD Completo", "Limpiar", barra de búsqueda y tarjetas de módulos. Cada módulo muestra nombre, contador de permisos seleccionados y checkboxes organizados en dos columnas con bordes de color por tipo de acción (azul=ver, verde=crear, ámbar=editar, rojo=eliminar).*

**Eliminar un Rol:**

1. Haga clic en el **icono de papelera** (🗑️) al lado del nombre del rol.
2. Confirme la eliminación.

#### 4.5.3 Estadísticas

La pestaña **Estadísticas** muestra un resumen del sistema:

- Total de Usuarios registrados
- Total de Roles configurados
- Total de Permisos disponibles

---

## 5. Preguntas Frecuentes y Mensajes del Sistema

### ¿Qué hago si no veo un módulo en el menú lateral?

El menú lateral se adapta según los permisos asignados a su usuario. Si un módulo no aparece, significa que su usuario no tiene el permiso `ver` para ese módulo. **Contacte al Administrador del Sistema** para que le asigne los permisos necesarios desde el panel de **Administración → Roles y Permisos**.

### ¿Cómo interpretar las alertas de conflicto en la programación?

Cuando programa instructores, el sistema puede mostrar:

- **Celdas en ámbar con ⚠️**: Indica un conflicto de doble asignación. El instructor o el ambiente ya está ocupado en esa fecha y hora. Debe resolver el conflicto antes de guardar.
- **Texto "N/D" en celdas con rayas diagonales**: Indica que el instructor no está disponible en esa franja horaria según su horario configurado.
- **Badge "Completado" en verde** en el panel de RAs: Indica que se alcanzó el máximo de horas permitidas para ese Resultado de Aprendizaje.

### ¿Qué hago si se me olvida la contraseña?

Contacte al **Administrador del Sistema**. Desde el panel de **Administración → Usuarios**, puede generar una nueva contraseña temporal que deberá cambiar en el próximo inicio de sesión.

### ¿Por qué no puedo eliminar una entidad?

El sistema verifica **dependencias** antes de permitir una eliminación. Si una entidad tiene datos dependientes que no pueden eliminarse en cascada (por ejemplo, un Centro que tiene Fichas activas), el sistema bloqueará la eliminación y le mostrará qué dependencias debe resolver primero.

### ¿Cómo cambio mi propia contraseña?

1. Inicie sesión en el sistema.
2. Navegue a **Administración → Usuarios**.
3. Haga clic en el **icono de llave** (🔑) junto a su usuario.
4. El sistema generará una nueva contraseña temporal.

Alternativamente, el administrador puede resetear su contraseña directamente.

---

## 6. Glossario de Términos Institucionales (SENA)

| Término | Definición |
|---|---|
| **Ficha** | Grupo de aprendices matriculados en un programa de formación, identificado por un número único. Cada ficha tiene fechas de inicio, fin lectiva y fin total, así como un horario y ambiente asignados. |
| **Ambiente** | Espacio físico (aula, taller, laboratorio, salón) donde se imparte la formación. Cada ambiente pertenece a un centro de formación y tiene capacidad, tipo y estado definidos. |
| **Competencia** | Unidad de formación que describe las habilidades y conocimientos que debe desarrollar un aprendiz. Cada programa de formación está compuesto por varias competencias, y cada competencia tiene una duración en horas. |
| **Resultado de Aprendizaje (RAP)** | Elemento desglosado de una competencia que describe un resultado específico que el aprendiz debe demostrar. Cada RAP tiene horas, código y una fase (Análisis, Planeación, Ejecución, Evaluación o Complementario). |
| **Regional** | División geográfica del SENA que agrupa uno o más centros de formación. |
| **Centro de Formación** | Instalación física del SENA donde se imparten programas de formación. Pertenece a una regional y contiene ambientes de aprendizaje. |
| **Proyecto Formativo** | Estrategia metodológica que integra los Resultados de Aprendizaje de una ficha en etapas secuenciales (Análisis, Planeación, Ejecución, Evaluación, Complementario). Define el porcentaje de horas directas de la formación. |
| **Programación** | Asignación formal de un instructor a un ambiente en una fecha y hora específicas, para la enseñanza de un Resultado de Aprendizaje determinado dentro de una ficha. |
| **Perfiles Académicos** | Catálogo de perfiles que identifican las áreas de conocimiento de un instructor (por ejemplo, "Bases de Datos", "Redes"). Se asignan tanto a competencias como a instructores. |
| **Horario** | Configuración semanal que define los días y horas en los que una ficha recibe formación, o un instructor está disponible para ser programado. |

---

**Elaborado por:** Equipo Técnico de Desarrollo de Software
**Supervisado por:** Subdirector Fernando Gonzales Torres — Área de Gestión Administrativa
**Fecha:** Julio 2026
