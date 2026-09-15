# ⏱️ GitHub Sprint Time Tracker para Google Sheets

<div align="center">

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GitHub GraphQL](https://img.shields.io/badge/GitHub%20GraphQL%20API-181717?style=for-the-badge&logo=github&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)

<p align="center">
  <b>Herramienta integrada y sin servidores para cronometrar, registrar y sincronizar horas de desarrollo de software por Sprint / Iteración directamente entre GitHub Projects (v2) y Google Sheets.</b>
</p>

</div>

---



<div align="center">
  <img src="./assets/sidebar_sidebar.png" alt="Sidebar de Time Tracker" width="300"/>
  <img src="./assets/sheetRegistro.png" alt="Google Sheets Registro" width="550"/>
  <img src="./assets/sheetResumen.png" alt="Google Sheets Resumen" width="550"/>
  <img src="./assets/issueTracked&Moved.png" alt="Issue trackeada y cambio de estado en project" width="550"/>

</div>


> [!TIP]
> **100% Serverless y Privado**: Funciona íntegramente dentro de tu entorno de Google Workspace. No requiere servidores intermediarios, bases de datos externas ni suscripciones de terceros.

---

## ✨ Características Principales

- ⏱️ **Cronómetro Persistente en Vivo**: Inicia, pausa y reanuda el tiempo de trabajo. Si cierras la pestaña, apagas la máquina o recargas la página, el cronómetro no se pierde gracias al almacenamiento de estado en `PropertiesService`.
- 📊 **Sincronización con GitHub Projects (v2)**: Lee automáticamente las iteraciones/sprints activos de tu tablero y lista únicamente las Issues asignadas a ti.
- 🔄 **Actualizaciones Automáticas en GitHub**:
  - Al iniciar el cronómetro, puede mover la tarea a `In Progress`.
  - Al detener y registrar la sesión, permite seleccionar el nuevo estado (`In Review`, `Done`, etc.).
  - Publica automáticamente un comentario en la Issue con el desglose exacto de tiempo y notas de la sesión.
- 📋 **Doble Estructura en Google Sheets**:
  - **`Registro Detallado`**: Historial fila por fila de cada sesión (ID, Fecha, Sprint, Issue #, Título, Hora Inicio, Hora Fin, Horas decimales, Horas formato texto, Notas, Estado y Enlace).
  - **`Resumen por Issue`**: Tabla consolidada que totaliza automáticamente el tiempo acumulado y la cantidad de sesiones por cada tarea y sprint.
- ✍️ **Carga Manual Alternativa**: Permite registrar bloques de tiempo transcurridos en caso de haber olvidado iniciar el cronómetro.
- 🔒 **Seguridad y Privacidad de Credenciales**: El Personal Access Token (PAT) se guarda en las propiedades privadas del usuario (`PropertiesService.getUserProperties()`), lo que garantiza que **nunca se expone en las celdas de la hoja ni es visible para otros colaboradores**.
- 🌍 **Soporte Multi-Zona Horaria**: Detecta dinámicamente la zona horaria configurada en tu hoja de cálculo o entorno de Google.

---

## 📂 Estructura del Repositorio

```text
├── src/
│   ├── Code.gs             # Backend en Google Apps Script (GraphQL, Sheets y Timer)
│   ├── Sidebar.html        # Interfaz de usuario de la barra lateral (HTML/CSS/JS)
│   ├── ConfigDialog.html   # Modal de credenciales y prueba de conexión con GitHub
│   └── appsscript.json     # Manifiesto de Apps Script (OAuth scopes y configuración)
├── .gitignore              # Exclusiones de Git (archivos locales, clasp, SO)
├── LICENSE                 # Licencia MIT
└── README.md               # Documentación y guía de instalación
```

| Archivo | Descripción |
| :--- | :--- |
| [`src/Code.gs`](./src/Code.gs) | Backend en Apps Script: lógica de sincronización GraphQL, mutaciones, timer y formateo de Sheets. |
| [`src/Sidebar.html`](./src/Sidebar.html) | Frontend de la barra lateral: cronómetro, selector de tareas por sprint y modal de guardado. |
| [`src/ConfigDialog.html`](./src/ConfigDialog.html) | Diálogo de configuración para ingresar y validar las credenciales de GitHub de forma segura. |
| [`src/appsscript.json`](./src/appsscript.json) | Manifiesto de permisos requeridos y versión de runtime (V8). |

---

## 🚀 Guía de Instalación

Puedes configurar el proyecto en menos de 5 minutos mediante cualquiera de los siguientes métodos:

### Opción 1: Instalación Manual Paso a Paso

#### Paso 1: Generar tu Personal Access Token (PAT) en GitHub
1. En GitHub, ve a **Settings > Developer Settings > Personal Access Tokens > Tokens (classic)**.
2. Haz clic en **Generate new token (classic)**.
3. Asigna una descripción (ej. `Google Sheets Time Tracker`).
4. Selecciona los permisos (*scopes*) mínimos requeridos:
   - `repo` (Acceso a repositorios públicos o privados, issues y comentarios).
   - `read:project` y `project` (Lectura y actualización en GitHub Projects v2).
5. Haz clic en **Generate token** y copia el token generado (`ghp_...`).
> *Nota: También puedes usar Fine-grained Personal Access Tokens con permisos equivalentes de lectura y escritura para Issues y Projects.*

#### Paso 2: Crear la Hoja de Cálculo y Cargar el Script
1. Abre [Google Sheets](https://sheets.new) y crea una nueva hoja en blanco.
2. En el menú superior, ve a **Extensiones > Apps Script**.
3. En el editor de Apps Script:
   - En el archivo `Código.gs` (o `Code.gs`), reemplaza todo su código con el contenido de [`src/Code.gs`](./src/Code.gs).
   - Haz clic en **+** (Añadir archivo) > **HTML**, nómbralo `Sidebar` y pega el código de [`src/Sidebar.html`](./src/Sidebar.html).
   - Haz clic en **+** (Añadir archivo) > **HTML**, nómbralo `ConfigDialog` y pega el código de [`src/ConfigDialog.html`](./src/ConfigDialog.html).
   - *(Opcional)* Ve a **Configuración del proyecto** (ícono de engranaje), activa la casilla **Mostrar archivo de manifiesto "appsscript.json" en el editor**, vuelve a la pestaña de archivos y reemplaza el contenido de `appsscript.json` con [`src/appsscript.json`](./src/appsscript.json).
4. Haz clic en el ícono de **Guardar** (disquete) o pulsa `Ctrl + S`.

#### Paso 3: Inicialización y Autorización
1. Regresa a tu hoja de cálculo y recárgala (**F5**).
2. Verás aparecer un nuevo menú superior llamado **⏱️ GitHub Tracker**.
3. Haz clic en **⏱️ GitHub Tracker > 📊 Inicializar Hojas de Cálculo**.
4. Google solicitará autorizar los permisos del script por primera vez:
   - Haz clic en **Continuar**, selecciona tu cuenta de Google.
   - En la advertencia de verificación de Google, haz clic en **Avanzado** y luego en **Ir a (proyecto) (no seguro)** para conceder acceso a tu propia hoja.
5. El script creará y formateará automáticamente las dos hojas de trabajo:
   - `Registro Detallado`
   - `Resumen por Issue`

#### Paso 4: Conectar tu Proyecto de GitHub
1. Haz clic en **⏱️ GitHub Tracker > ⚙️ Configuración de GitHub**.
2. Completa los datos solicitados:
   - **Personal Access Token (PAT)**: Pega el token generado en el Paso 1.
   - **Tipo de Dueño**: Selecciona `Organización` o `Usuario Personal`.
   - **Organización / Usuario**: El identificador de usuario u organización dueño del proyecto.
   - **Nombre del Repositorio**: El nombre del repo donde residen las issues.
   - **Número del Project (v2)**: El número visible en la URL del proyecto (ej: `github.com/orgs/mi-org/projects/3` -> el número es `3`).
   - **Tu Usuario de GitHub**: Tu usuario para filtrar las tareas asignadas a ti.
3. Haz clic en **🧪 Probar Conexión** para validar la comunicación.
4. Haz clic en **💾 Guardar**.

---

### Opción 2: Para Desarrolladores (Google Clasp)

Si prefieres trabajar localmente y desplegar mediante el CLI oficial de Google:

```bash
# 1. Instalar Google Clasp globalmente
npm install -g @google/clasp

# 2. Iniciar sesión en tu cuenta de Google
clasp login

# 3. Clonar un Apps Script existente o crear uno nuevo
clasp clone <SCRIPT_ID> --rootDir ./src

# 4. Enviar los cambios locales a la nube
clasp push
```

---

## 💡 Flujo de Trabajo Diario

1. Abre el menú **⏱️ GitHub Tracker > Abrir Cronómetro**.
2. En la barra lateral, selecciona el **Sprint / Iteración** y la **Issue** en la que trabajarás.
3. Haz clic en **▶ Iniciar Trabajo**:
   - El cronómetro comenzará a correr.
   - Si está configurado, la Issue cambiará a estado `In Progress` en tu GitHub Project.
   - Puedes cerrar la pestaña; el tiempo continuará calculándose con precisión exacta.
4. Puedes **⏸️ Pausar** y **▶ Reanudar** según lo necesites durante el día.
5. Al finalizar:
   - Pulsa **⏹️ Detener**.
   - Ingresa o revisa los minutos trabajados y añade notas del progreso realizado.
   - Selecciona el nuevo estado de la Issue (ej. `In Review` o `Done`).
   - Haz clic en **Guardar Registro**.
6. **Resultado inmediato**:
   - Se agrega la fila en `Registro Detallado`.
   - Se actualiza automáticamente la tabla en `Resumen por Issue`.
   - Se publica el comentario en la Issue de GitHub.
   - Se actualiza la columna del tablero en GitHub Projects v2.

---

## 🛡️ Seguridad y Buenas Prácticas

- **Cero exposición de credenciales**: El token nunca se almacena en celdas, fórmulas o variables públicas.
- **Acceso acotado**: Solo requiere los permisos indispensables (`spreadsheets`, `script.container.ui` y `script.external_request`) para interactuar con la hoja y la API GraphQL de GitHub.
- **Auditoría de código**: Todo el código fuente está disponible en este repositorio para revisión y auditoría antes de su despliegue.

---

## 🤝 Contribuciones

¡Las contribuciones, sugerencias y reportes de errores son más que bienvenidos!

1. Haz un Fork del proyecto.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'feat: agrega nueva funcionalidad'`).
4. Sube tu rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
