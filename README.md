GitHub Sprint Time Tracker para Google Sheets

Herramienta profesional e integrada para medir y registrar el tiempo de dedicación en cada Issue de desarrollo de software por Sprint / Iteración utilizando la API GraphQL de GitHub Projects (v2)  y  Google Sheets mediante Google Apps Script (GAS).

Características Principales
- Integración Nativa: Funciona directamente dentro de Google Sheets con una barra lateral (Sidebar) elegante y funcional. No requiere instalar servidores ni programas locales.
- Sincronización con GitHub Projects v2: Lee las iteraciones/sprints del tablero de GitHub y lista las Issues asignadas a ti.
- Cronómetro Persistente en Vivo: Inicia, pausa y reanuda el tiempo. Si cierras la pestaña o se recarga el navegador, el cronómetro continúa corriendo con precisión gracias al guardado de estado en `PropertiesService`.
- Carga Manual Alternativa: Permite registrar bloques de tiempo pasados si olvidaste encender el cronómetro.
- Actualización Automática en GitHub:
  - Al iniciar el cronómetro, puede mover la Issue a `In Progress`.
  - Al detener y guardar, permite elegir el estado final (ej. `In Review`, `Done` o `Sin cambios`) y lo actualiza en el tablero del proyecto.
  - Publica un comentario de trazabilidad en la Issue con el tiempo exacto y notas de la sesión.
- Doble Estructura en Google Sheets:
  - `Registro Detallado`: Historial fila por fila de cada sesión (Fecha, Sprint, Issue, Horas de inicio y fin, Duración en horas decimales y texto, notas y enlace).
  - `Resumen por Issue`: Tabla consolidada que totaliza automáticamente las horas dedicadas y el número de sesiones por Sprint e Issue.
- Credenciales Seguras: El Personal Access Token (PAT) se almacena cifrado en las propiedades del usuario en Apps Script, **nunca expuesto en las celdas de la hoja**.

Archivos del Proyecto

| [`Code.gs`](./Code.gs) | Backend en Apps Script: integración GraphQL de GitHub, persistencia del cronómetro y formateo de Sheets. 
| [`Sidebar.html`](./Sidebar.html) | Frontend de la barra lateral con cronómetro interactivo, selector de tareas y modal de guardado. 
| [`ConfigDialog.html`](./ConfigDialog.html) | Modal de configuración para ingresar y probar las credenciales de GitHub de forma segura. 
| [`appsscript.json`](./appsscript.json) | Manifiesto de Apps Script con permisos y zona horaria configurada. 

Guía de Instalación Paso a Paso
Paso 1: Generar tu Personal Access Token (PAT) en GitHub para que la herramienta pueda consultar tu tablero de proyectos y comentar en las issues:

1. En GitHub, ve a Settings > Developer Settings > Personal Access Tokens > Tokens (classic).
2. Haz clic en Generate new token (classic).
3. Asigna un nombre (ej. `Google Sheets Time Tracker`).
4. Selecciona los siguientes permisos (scopes):
   - `repo` (Acceso a repositorios públicos o privados, issues y comentarios).
   - `read:project` y `project` (Lectura y actualización de GitHub Projects v2).
5. Haz clic en Generate token y copia el token generado (`ghp_...`).
Nota: También puedes utilizar un Fine-grained Personal Access Token asignándole permisos de lectura y escritura a Projects e Issues.

Paso 2: Crear la Hoja de Google Sheets y Configurar el Script
1. Abre [Google Sheets](https://sheets.new) y crea una nueva hoja en blanco (por ejemplo, llámala `Software Development - Sprint Time Tracker`).
2. En el menú superior, haz clic en Extensiones> Apps Script.
3. En el editor de Apps Script:
   - Reemplaza el contenido de `Código.gs` (o `Code.gs`) con el contenido de [`Code.gs`](./Code.gs).
   - Haz clic en el botón `+` (Añadir archivo) > HTML, nómbralo exactamente `Sidebar` y pega el código de [`Sidebar.html`](./Sidebar.html).
   - Haz clic en `+` > HTML, nómbralo exactamente `ConfigDialog` y pega el código de [`ConfigDialog.html`](./ConfigDialog.html).
   - (Opcional) Ve a Configuración del proyecto (ícono de engranaje a la izquierda), marca la casilla Mostrar archivo de manifiesto "appsscript.json" en el editor, vuelve a Archivos y pega el contenido de [`appsscript.json`](./appsscript.json).
4. Haz clic en el ícono de Guardar (disquete) en la barra superior.

Paso 3: Inicialización y Autorización
1. Vuelve a la pestaña de tu hoja de cálculo de Google Sheets y recarga la página (F5).
2. Verás aparecer un nuevo menú superior llamado ⏱️ GitHub Tracker.
3. Haz clic en ⏱️ GitHub Tracker > 📊 Inicializar Hojas de Cálculo.
   - Google te solicitará autorizar los permisos del script por primera vez. Haz clic en "Continuar", selecciona tu cuenta, elige "Avanzado" y luego "Ir a (título del script) (no seguro)" para conceder los permisos.
4. Al ejecutarse, creará automáticamente las dos hojas con el diseño y formatos listos:
   - `Registro Detallado`
   - `Resumen por Issue`

Paso 4: Conectar tu Repositorio y Proyecto
1. Haz clic en ⏱️ GitHub Tracker > ⚙️ Configuración de GitHub.
2. Completa los campos:
   - Personal Access Token (PAT): Pega el token generado en el Paso 1.
   - Tipo de Dueño: Elige `Organización` o `Usuario Personal`.
   - Organización / Usuario: El nombre de usuario o de la organización donde reside el proyecto.
   - Nombre del Repositorio: El nombre del repo donde están las issues.
   - Número del Project (v2): El número que aparece en la URL del proyecto (ej: `github.com/orgs/mi-org/projects/3` -> el número es `3`).
   - Tu Usuario de GitHub: Tu handle para filtrar automáticamente las tareas asignadas a ti.
3. Haz clic en 🧪 Probar Conexión para validar que GitHub responda correctamente.
4. Haz clic en 💾 Guardar.

Cómo Utilizar la Herramienta en tu Día a Día
1. En el menú superior, ve a ⏱️ GitHub Tracker > Abrir Cronómetro. Se abrirá el panel lateral.
2. Selecciona la Iteración / Sprint y la Issue en la que vas a trabajar.
3. Pulsa ▶ Iniciar Trabajo:
   - El cronómetro comenzará a correr en segundos.
   - La Issue se marcará automáticamente en `In Progress` en tu tablero de GitHub.
   - Si cierras Sheets, apagas el monitor o refrescas la página, el cronómetro seguirá contando con exactitud.
4. Si necesitas interrumpir la tarea, pulsa ⏸️ Pausar y luego ▶ Reanudar.
5. Al finalizar:
   - Pulsa ⏹️ Detener.
   - Se abrirá la tarjeta de guardado con la duración calculada en minutos.
   - Puedes ajustar los minutos si es necesario.
   - Escribe un resumen o notas de lo que realizaste.
   - Selecciona el nuevo estado de la Issue (ej: `In Review` o `Done`).
   - Pulsa Guardar Registro.
6. ¡Listo!:
   - Se inserta la fila en `Registro Detallado`.
   - Se actualiza el total de horas en `Resumen por Issue`.
   - Se publica el comentario en la Issue de GitHub con el tiempo y las notas.
   - Se actualiza la columna del tablero del proyecto en GitHub.
