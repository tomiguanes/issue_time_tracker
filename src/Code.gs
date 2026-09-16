/**
 * GitHub Sprint Time Tracker para Google Sheets
 * Permite sincronizar Issues de GitHub Projects v2, cronometrar el tiempo de trabajo,
 * guardar registros detallados y actualizar el estado y comentarios en GitHub.
 */

// ==========================================
// MENÚ PRINCIPAL E INICIALIZACIÓN
// ==========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⏱️ GitHub Tracker')
    .addItem('Abrir Cronómetro', 'showSidebar')
    .addItem('⚙️ Configuración de GitHub', 'showConfigDialog')
    .addSeparator()
    .addItem('📊 Inicializar Hojas de Cálculo', 'setupSheets')
    .addItem('🔄 Actualizar Resumen', 'refreshSummary')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('⏱️ GitHub Sprint Tracker')
    .setWidth(340);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showConfigDialog() {
  const html = HtmlService.createTemplateFromFile('ConfigDialog')
    .evaluate()
    .setWidth(460)
    .setHeight(520)
    .setTitle('⚙️ Configuración de GitHub Projects v2');
  SpreadsheetApp.getUi().showModalDialog(html, '⚙️ Configuración de GitHub Projects v2');
}

// ==========================================
// CONFIGURACIÓN DE HOJAS DE CÁLCULO
// ==========================================

const SHEET_NAMES = {
  LOGS: 'Registro Detallado',
  SUMMARY: 'Resumen por Issue'
};

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Hoja de Registro Detallado
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOGS, 0);
  }
  
  const logHeaders = [
    'ID Registro',
    'Fecha',
    'Sprint / Iteración',
    'Issue #',
    'Título',
    'Hora Inicio',
    'Hora Fin',
    'Duración (Horas)',
    'Duración (Texto)',
    'Notas de Trabajo',
    'Estado Resultante',
    'Enlace Issue'
  ];
  
  logSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
  const logHeaderRange = logSheet.getRange(1, 1, 1, logHeaders.length);
  logHeaderRange
    .setBackground('#1e293b')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  logSheet.setFrozenRows(1);
  logSheet.getRange('B2:B').setNumberFormat('yyyy-mm-dd');
  logSheet.getRange('F2:G').setNumberFormat('hh:mm:ss');
  logSheet.getRange('H2:H').setNumberFormat('0.00');

  // Ajuste de anchos de columna recomendados
  const colWidths = [120, 95, 130, 80, 240, 90, 90, 110, 110, 260, 130, 220];
  colWidths.forEach((w, i) => logSheet.setColumnWidth(i + 1, w));
  
  // 2. Hoja de Resumen por Issue
  let summarySheet = ss.getSheetByName(SHEET_NAMES.SUMMARY);
  if (!summarySheet) {
    summarySheet = ss.insertSheet(SHEET_NAMES.SUMMARY, 1);
  }
  
  summarySheet.clear();
  const summaryHeaders = [
    'Sprint / Iteración',
    'Issue #',
    'Título',
    'Horas Estimadas',
    'Horas Reales',
    'Diferencia (Real - Est.)',
    '% Consumido',
    'N° Sesiones',
    'Enlace Issue'
  ];
  
  summarySheet.getRange(1, 1, 1, summaryHeaders.length).setValues([summaryHeaders]);
  const sumHeaderRange = summarySheet.getRange(1, 1, 1, summaryHeaders.length);
  sumHeaderRange
    .setBackground('#0f766e')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
    
  summarySheet.setFrozenRows(1);
  const sumColWidths = [140, 85, 260, 115, 110, 140, 110, 95, 220];
  sumColWidths.forEach((w, i) => summarySheet.setColumnWidth(i + 1, w));

  refreshSummary();
  return { success: true, message: 'Hojas inicializadas y estructuradas con métricas de estimación y semáforo.' };
}

function refreshSummary(newEstimatesMap) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  const sumSheet = ss.getSheetByName(SHEET_NAMES.SUMMARY);
  
  if (!logSheet || !sumSheet) return;
  
  // 1. Resguardar estimaciones existentes cargadas en la hoja para no sobreescribirlas
  const existingEstimates = new Map();
  const lastSumRow = sumSheet.getLastRow();
  if (lastSumRow > 1) {
    const sumData = sumSheet.getRange(2, 2, lastSumRow - 1, 3).getValues(); // Col B (Issue #), Col C (Título), Col D (Estimado)
    for (const r of sumData) {
      const iNum = r[0];
      const est = parseFloat(r[2]);
      if (iNum && !isNaN(est) && est > 0) {
        existingEstimates.set(String(iNum), est);
      }
    }
  }

  // Si se enviaron estimaciones actualizadas desde el Sidebar o GitHub
  if (newEstimatesMap) {
    for (const [k, v] of Object.entries(newEstimatesMap)) {
      const numVal = parseFloat(v);
      if (!isNaN(numVal) && numVal >= 0) existingEstimates.set(String(k), numVal);
    }
  }
  
  const lastRow = logSheet.getLastRow();
  if (lastRow <= 1) {
    if (sumSheet.getLastRow() > 1) {
      sumSheet.getRange(2, 1, sumSheet.getLastRow() - 1, 9).clear();
    }
    return;
  }
  
  const data = logSheet.getRange(2, 1, lastRow - 1, 12).getValues();
  const issuesMap = new Map();
  
  for (const row of data) {
    const sprint = row[2] || 'Sin Sprint';
    const issueNum = row[3];
    const title = row[4];
    const durationHours = parseFloat(row[7]) || 0;
    const link = row[11];
    
    if (!issueNum) continue;
    const key = `${sprint}___${issueNum}`;
    
    if (!issuesMap.has(key)) {
      issuesMap.set(key, {
        sprint: sprint,
        issueNum: issueNum,
        title: title,
        totalHours: 0,
        sessionsCount: 0,
        link: link
      });
    }
    
    const item = issuesMap.get(key);
    item.totalHours += durationHours;
    item.sessionsCount += 1;
    if (!item.title && title) item.title = title;
    if (!item.link && link) item.link = link;
  }
  
  // Limpiar contenido previo de resumen
  if (sumSheet.getLastRow() > 1) {
    sumSheet.getRange(2, 1, sumSheet.getLastRow() - 1, 9).clear();
  }
  
  const outputRows = [];
  const sortedItems = Array.from(issuesMap.values());
  sortedItems.sort((a, b) => {
    if (a.sprint !== b.sprint) return a.sprint.localeCompare(b.sprint);
    return Number(a.issueNum) - Number(b.issueNum);
  });
  
  sortedItems.forEach((item, idx) => {
    const rowIdx = idx + 2;
    const estHours = existingEstimates.get(String(item.issueNum));
    
    // Fórmulas para Diferencia (Real - Estimado) y % Consumido
    const diffFormula = `=IF(OR(ISBLANK(D${rowIdx}), D${rowIdx}=""), "-", E${rowIdx}-D${rowIdx})`;
    const pctFormula = `=IF(OR(ISBLANK(D${rowIdx}), D${rowIdx}="", D${rowIdx}=0), "-", E${rowIdx}/D${rowIdx})`;
    
    outputRows.push([
      item.sprint,
      item.issueNum,
      item.title,
      (typeof estHours === 'number' && estHours >= 0) ? Number(estHours.toFixed(2)) : '',
      Number(item.totalHours.toFixed(2)),
      diffFormula,
      pctFormula,
      item.sessionsCount,
      item.link
    ]);
  });
  
  if (outputRows.length > 0) {
    sumSheet.getRange(2, 1, outputRows.length, 9).setValues(outputRows);
    sumSheet.getRange(2, 4, outputRows.length, 2).setNumberFormat('0.00'); // Horas Estimadas y Reales
    sumSheet.getRange(2, 6, outputRows.length, 1).setNumberFormat('+0.00;-0.00;0.00'); // Diferencia
    sumSheet.getRange(2, 7, outputRows.length, 1).setNumberFormat('0.0%'); // % Consumido
    
    // Reglas de Formato Condicional (Semáforo sobre % Consumido)
    const pctRange = sumSheet.getRange(2, 7, outputRows.length, 1);
    
    const ruleGreen = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(1.0)
      .setBackground('#dcfce7')
      .setFontColor('#166534')
      .setRanges([pctRange])
      .build();
      
    const ruleRed = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(1.0)
      .setBackground('#fee2e2')
      .setFontColor('#991b1b')
      .setRanges([pctRange])
      .build();
      
    sumSheet.setConditionalFormatRules([ruleGreen, ruleRed]);
  }
}

// ==========================================
// GESTIÓN DE CONFIGURACIÓN Y CREDENCIALES
// ==========================================

function getSettings() {
  const props = PropertiesService.getUserProperties();
  return {
    token: props.getProperty('GH_TOKEN') || '',
    ownerType: props.getProperty('GH_OWNER_TYPE') || 'organization', // 'organization' o 'user'
    owner: props.getProperty('GH_OWNER') || '',
    repo: props.getProperty('GH_REPO') || '',
    projectNumber: props.getProperty('GH_PROJECT_NUMBER') || '',
    username: props.getProperty('GH_USERNAME') || '',
    estimateField: props.getProperty('GH_ESTIMATE_FIELD') || ''
  };
}

function saveSettings(settings) {
  const props = PropertiesService.getUserProperties();
  props.setProperty('GH_TOKEN', (settings.token || '').trim());
  props.setProperty('GH_OWNER_TYPE', (settings.ownerType || 'organization').trim());
  props.setProperty('GH_OWNER', (settings.owner || '').trim());
  props.setProperty('GH_REPO', (settings.repo || '').trim());
  props.setProperty('GH_PROJECT_NUMBER', String(settings.projectNumber || '').trim());
  props.setProperty('GH_USERNAME', (settings.username || '').trim());
  props.setProperty('GH_ESTIMATE_FIELD', (settings.estimateField || '').trim());
  return { success: true, message: 'Configuración guardada de forma segura.' };
}

// ==========================================
// CLIENTE GITHUB GRAPHQL
// ==========================================

function executeGitHubGraphQL(query, variables, tokenOverride) {
  const token = tokenOverride || getSettings().token;
  if (!token) {
    throw new Error('No se ha configurado el GitHub Personal Access Token (PAT).');
  }
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'GoogleAppsScript-GitHubSprintTracker'
    },
    payload: JSON.stringify({ query: query, variables: variables || {} }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch('https://api.github.com/graphql', options);
  const statusCode = response.getResponseCode();
  const text = response.getContentText();
  
  if (statusCode === 401) {
    throw new Error('Error 401: Token de GitHub inválido o expirado.');
  }
  
  const json = JSON.parse(text);
  if (json.errors && json.errors.length > 0) {
    throw new Error('GraphQL Error: ' + json.errors.map(e => e.message).join(' | '));
  }
  
  return json.data;
}

function testGitHubConnection(config) {
  try {
    const isOrg = config.ownerType === 'organization';
    const projNum = parseInt(config.projectNumber, 10);
    
    if (!projNum) throw new Error('El número de proyecto debe ser un valor numérico.');
    
    const query = `
      query TestConnection($owner: String!, $number: Int!) {
        ${isOrg ? 'organization' : 'user'}(login: $owner) {
          projectV2(number: $number) {
            id
            title
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  configuration {
                    iterations {
                      id
                      title
                      startDate
                      duration
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    const data = executeGitHubGraphQL(query, { owner: config.owner, number: projNum }, config.token);
    const ownerObj = isOrg ? data.organization : data.user;
    
    if (!ownerObj || !ownerObj.projectV2) {
      return {
        success: false,
        message: `No se encontró el Proyecto v2 #${projNum} en ${config.owner}. Verifica el número y los permisos del token.`
      };
    }
    
    const proj = ownerObj.projectV2;
    return {
      success: true,
      projectTitle: proj.title,
      message: `¡Conexión exitosa! Proyecto: "${proj.title}"`
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ==========================================
// OBTENCIÓN DE DATOS DEL PROYECTO (SPRINTS E ISSUES)
// ==========================================

function getProjectSprintData() {
  const config = getSettings();
  if (!config.token || !config.owner || !config.projectNumber) {
    return {
      success: false,
      notConfigured: true,
      message: 'Configura tus credenciales y proyecto de GitHub antes de comenzar.'
    };
  }
  
  try {
    const isOrg = config.ownerType === 'organization';
    const projNum = parseInt(config.projectNumber, 10);
    
    const query = `
      query GetProjectItemsPage($owner: String!, $number: Int!, $cursor: String) {
        ${isOrg ? 'organization' : 'user'}(login: $owner) {
          projectV2(number: $number) {
            id
            title
            fields(first: 30) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  configuration {
                    iterations {
                      id
                      title
                      startDate
                      duration
                    }
                  }
                }
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
              }
            }
            items(first: 100, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                content {
                  ... on Issue {
                    id
                    number
                    title
                    url
                    state
                    milestone {
                      id
                      title
                    }
                    assignees(first: 10) {
                      nodes {
                        login
                      }
                    }
                    repository {
                      name
                    }
                  }
                }
                fieldValues(first: 15) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field {
                        ... on ProjectV2SingleSelectField {
                          id
                          name
                        }
                      }
                      name
                      optionId
                    }
                    ... on ProjectV2ItemFieldIterationValue {
                      field {
                        ... on ProjectV2IterationField {
                          id
                          name
                        }
                      }
                      title
                      iterationId
                    }
                    ... on ProjectV2ItemFieldNumberValue {
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                        }
                      }
                      number
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    
    let hasNextPage = true;
    let cursor = null;
    let allItemNodes = [];
    let project = null;
    let maxPages = 10; // Límite de seguridad: hasta 1000 items
    let pageCount = 0;

    while (hasNextPage && pageCount < maxPages) {
      pageCount++;
      const data = executeGitHubGraphQL(query, { owner: config.owner, number: projNum, cursor: cursor });
      const ownerObj = isOrg ? data.organization : data.user;
      
      if (!ownerObj || !ownerObj.projectV2) {
        throw new Error(`No se encontró el Proyecto v2 #${projNum} en ${config.owner}. Verifica el número y permisos.`);
      }

      project = ownerObj.projectV2;
      const itemsData = project.items;
      if (itemsData && itemsData.nodes) {
        allItemNodes.push(...itemsData.nodes);
      }

      if (itemsData && itemsData.pageInfo && itemsData.pageInfo.hasNextPage) {
        cursor = itemsData.pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }
    }
    
    // Identificar campo de Iteración, de Estado (Status) y de Estimación (Number)
    let iterationField = null;
    let statusField = null;
    let estimateField = null;
    const configuredEstimateName = (config.estimateField || '').trim().toLowerCase();
    
    for (const f of project.fields.nodes) {
      if (f.configuration && f.configuration.iterations) {
        iterationField = f;
      } else if (f.name && f.name.toLowerCase() === 'status') {
        statusField = f;
      } else if (f.dataType === 'NUMBER') {
        const fNameLower = (f.name || '').toLowerCase();
        if (configuredEstimateName && fNameLower === configuredEstimateName) {
          estimateField = f;
        } else if (!estimateField && (
          fNameLower.includes('estimate') || 
          fNameLower.includes('estimaci') || 
          fNameLower.includes('point') || 
          fNameLower.includes('horas') || 
          fNameLower.includes('tiempo')
        )) {
          estimateField = f;
        }
      }
    }
    
    const iterationsList = [];
    const milestoneMap = new Map();

    if (iterationField && iterationField.configuration && iterationField.configuration.iterations) {
      iterationsList.push(...iterationField.configuration.iterations.map(it => ({
        id: it.id,
        title: it.title,
        startDate: it.startDate,
        duration: it.duration
      })));
    }
    
    // Procesar los items del proyecto
    const issues = [];
    const targetUsername = (config.username || '').replace(/^@/, '').trim().toLowerCase();
    
    for (const item of allItemNodes) {
      if (!item.content || !item.content.number) continue; // Solo Issues
      
      const issue = item.content;
      const assignees = (issue.assignees?.nodes || []).map(a => a.login.toLowerCase());
      
      // Filtrar por usuario asignado si se definió
      const isAssigned = !targetUsername || assignees.includes(targetUsername);
      
      let itemSprintTitle = 'Sin Sprint';
      let itemSprintId = null;
      let itemStatusName = '';
      let itemStatusOptionId = '';
      let itemEstimate = 0;
      
      for (const fVal of item.fieldValues.nodes) {
        if (fVal.iterationId) {
          itemSprintTitle = fVal.title;
          itemSprintId = fVal.iterationId;
        } else if (fVal.optionId && fVal.field?.name?.toLowerCase() === 'status') {
          itemStatusName = fVal.name;
          itemStatusOptionId = fVal.optionId;
        } else if (typeof fVal.number === 'number') {
          if (estimateField && fVal.field?.id === estimateField.id) {
            itemEstimate = fVal.number;
          } else if (!estimateField) {
            itemEstimate = fVal.number;
          }
        }
      }

      // Si no tiene Iteration propia en Project v2, adoptar Milestone si existe
      if ((!itemSprintId || itemSprintTitle === 'Sin Sprint') && issue.milestone && issue.milestone.title) {
        itemSprintTitle = issue.milestone.title;
        itemSprintId = 'milestone_' + issue.milestone.title;
        milestoneMap.set(issue.milestone.title, itemSprintId);
      }
      
      issues.push({
        projectItemId: item.id,
        issueNodeId: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.url,
        state: issue.state,
        repository: issue.repository ? issue.repository.name : config.repo,
        isAssignedToUser: isAssigned,
        sprintTitle: itemSprintTitle,
        sprintId: itemSprintId,
        currentStatus: itemStatusName,
        statusOptionId: itemStatusOptionId,
        estimate: itemEstimate
      });
    }

    // Agregar Milestones detectados a la lista de iteraciones si no estaban
    milestoneMap.forEach((mId, mTitle) => {
      const exists = iterationsList.some(it => it.title.toLowerCase() === mTitle.toLowerCase());
      if (!exists) {
        iterationsList.push({
          id: mId,
          title: mTitle
        });
      }
    });

    // Ordenar iteraciones alfanuméricamente
    iterationsList.sort((a, b) => b.title.localeCompare(a.title, undefined, { numeric: true, sensitivity: 'base' }));
    
    return {
      success: true,
      projectId: project.id,
      projectTitle: project.title,
      statusFieldId: statusField ? statusField.id : null,
      statusOptions: statusField ? statusField.options : [],
      estimateFieldId: estimateField ? estimateField.id : null,
      estimateFieldName: estimateField ? estimateField.name : null,
      iterations: iterationsList,
      issues: issues
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateIssueEstimate(projectId, itemId, estimateFieldId, numberValue, issueNumber) {
  const num = parseFloat(numberValue);
  if (isNaN(num) || num < 0) throw new Error('El valor estimado debe ser un número mayor o igual a 0.');

  let ghUpdated = false;
  if (projectId && itemId && estimateFieldId) {
    const mutation = `
      mutation UpdateEstimate($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: Float!) {
        updateProjectV2ItemFieldValue(
          input: {
            projectId: $projectId
            itemId: $itemId
            fieldId: $fieldId
            value: {
              number: $value
            }
          }
        ) {
          projectV2Item {
            id
          }
        }
      }
    `;

    try {
      executeGitHubGraphQL(mutation, {
        projectId: projectId,
        itemId: itemId,
        fieldId: estimateFieldId,
        value: num
      });
      ghUpdated = true;
    } catch (err) {
      console.warn('Error al actualizar estimación en GitHub:', err.message);
    }
  }

  // Refrescar y guardar en la hoja de Resumen por Issue
  if (issueNumber) {
    const map = {};
    map[String(issueNumber)] = num;
    refreshSummary(map);
  }

  return { success: true, estimate: num, ghUpdated: ghUpdated };
}

// ==========================================
// PERSISTENCIA DEL CRONÓMETRO (ESTADO ACTIVO)
// ==========================================

function getTimerState() {
  const props = PropertiesService.getUserProperties();
  const state = {
    isRunning: props.getProperty('TIMER_IS_RUNNING') === 'true',
    isPaused: props.getProperty('TIMER_IS_PAUSED') === 'true',
    startTime: parseInt(props.getProperty('TIMER_START_TIME') || '0', 10),
    accumulatedMs: parseInt(props.getProperty('TIMER_ACCUMULATED_MS') || '0', 10),
    activeIssue: null
  };
  
  const issueJson = props.getProperty('TIMER_ACTIVE_ISSUE');
  if (issueJson) {
    try {
      state.activeIssue = JSON.parse(issueJson);
    } catch (e) {
      state.activeIssue = null;
    }
  }
  
  let currentElapsedMs = state.accumulatedMs;
  if (state.isRunning && state.startTime > 0) {
    currentElapsedMs += (Date.now() - state.startTime);
  }
  state.currentElapsedMs = currentElapsedMs;
  return state;
}

function startTimer(issueData, updateGitHubStatus) {
  const props = PropertiesService.getUserProperties();
  const now = Date.now();
  
  props.setProperty('TIMER_IS_RUNNING', 'true');
  props.setProperty('TIMER_IS_PAUSED', 'false');
  props.setProperty('TIMER_START_TIME', String(now));
  props.setProperty('TIMER_ACCUMULATED_MS', '0');
  props.setProperty('TIMER_ACTIVE_ISSUE', JSON.stringify(issueData));
  
  // Actualizar estado a "In Progress" en GitHub si está habilitado
  if (updateGitHubStatus && issueData.projectItemId && issueData.inProgressOptionId && issueData.statusFieldId) {
    try {
      updateProjectItemStatus(issueData.projectId, issueData.projectItemId, issueData.statusFieldId, issueData.inProgressOptionId);
    } catch (e) {
      console.warn('No se pudo actualizar estado In Progress en GitHub:', e.message);
    }
  }
  
  return { success: true, startTime: now };
}

function pauseTimer() {
  const props = PropertiesService.getUserProperties();
  const isRunning = props.getProperty('TIMER_IS_RUNNING') === 'true';
  
  if (isRunning) {
    const startTime = parseInt(props.getProperty('TIMER_START_TIME') || '0', 10);
    const prevAcc = parseInt(props.getProperty('TIMER_ACCUMULATED_MS') || '0', 10);
    const newAcc = prevAcc + (Date.now() - startTime);
    
    props.setProperty('TIMER_IS_RUNNING', 'false');
    props.setProperty('TIMER_IS_PAUSED', 'true');
    props.setProperty('TIMER_ACCUMULATED_MS', String(newAcc));
    props.setProperty('TIMER_START_TIME', '0');
    return { success: true, accumulatedMs: newAcc };
  }
  return { success: false, message: 'El cronómetro no estaba en ejecución.' };
}

function resumeTimer() {
  const props = PropertiesService.getUserProperties();
  const isPaused = props.getProperty('TIMER_IS_PAUSED') === 'true';
  
  if (isPaused) {
    const now = Date.now();
    props.setProperty('TIMER_IS_RUNNING', 'true');
    props.setProperty('TIMER_IS_PAUSED', 'false');
    props.setProperty('TIMER_START_TIME', String(now));
    return { success: true, resumeTime: now };
  }
  return { success: false, message: 'El cronómetro no estaba pausado.' };
}

function discardTimer() {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty('TIMER_IS_RUNNING');
  props.deleteProperty('TIMER_IS_PAUSED');
  props.deleteProperty('TIMER_START_TIME');
  props.deleteProperty('TIMER_ACCUMULATED_MS');
  props.deleteProperty('TIMER_ACTIVE_ISSUE');
  return { success: true };
}

// ==========================================
// GUARDADO DE REGISTRO EN SHEETS Y GITHUB
// ==========================================

function saveWorkSession(sessionData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!logSheet) {
    setupSheets();
    logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  }
  
  const tz = Session.getScriptTimeZone() || ss.getSpreadsheetTimeZone() || 'UTC';
  const now = new Date();
  const recordId = 'LOG-' + Utilities.formatDate(now, tz, 'yyyyMMdd-HHmmss');
  const dateStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  
  const durationSeconds = Math.max(1, Math.round((sessionData.durationMinutes || 0) * 60));
  const durationHours = durationSeconds / 3600;
  
  const hrs = Math.floor(durationSeconds / 3600);
  const mins = Math.floor((durationSeconds % 3600) / 60);
  const durationText = `${hrs}h ${mins}m`;
  
  const startTimeStr = sessionData.startTimeStr || Utilities.formatDate(new Date(now.getTime() - durationSeconds * 1000), tz, 'HH:mm:ss');
  const endTimeStr = sessionData.endTimeStr || Utilities.formatDate(now, tz, 'HH:mm:ss');
  
  const rowData = [
    recordId,
    dateStr,
    sessionData.sprintTitle || 'Sin Sprint',
    sessionData.issueNumber,
    sessionData.issueTitle,
    startTimeStr,
    endTimeStr,
    Number(durationHours.toFixed(2)),
    durationText,
    sessionData.notes || '',
    sessionData.resultingStatusName || 'Sin cambios',
    sessionData.issueUrl
  ];
  
  logSheet.appendRow(rowData);
  
  // Acciones en GitHub
  let githubCommentSuccess = false;
  let githubStatusSuccess = false;
  
  // 1. Comentar en GitHub si se seleccionó
  if (sessionData.shouldComment && sessionData.issueNodeId) {
    try {
      const commentBody = `⏱️ **Tiempo registrado:** \`${durationText}\` (${durationHours.toFixed(2)} hrs)\n` +
        (sessionData.notes ? `\n> ${sessionData.notes.replace(/\n/g, '\n> ')}\n` : '') +
        `\n*Registrado vía Google Sheets Tracker el ${dateStr} a las ${endTimeStr}*`;
      
      addCommentToIssue(sessionData.issueNodeId, commentBody);
      githubCommentSuccess = true;
    } catch (err) {
      console.warn('Error al comentar en GitHub:', err.message);
    }
  }
  
  // 2. Actualizar estado del proyecto si se seleccionó una opción válida
  if (sessionData.shouldUpdateStatus && sessionData.targetStatusOptionId && sessionData.statusFieldId) {
    try {
      updateProjectItemStatus(
        sessionData.projectId,
        sessionData.projectItemId,
        sessionData.statusFieldId,
        sessionData.targetStatusOptionId
      );
      githubStatusSuccess = true;
    } catch (err) {
      console.warn('Error al actualizar estado en GitHub:', err.message);
    }
  }
  
  // 3. Actualizar estimación si se modificó
  let githubEstimateSuccess = false;
  if (typeof sessionData.newEstimate === 'number' && sessionData.newEstimate >= 0) {
    if (sessionData.estimateFieldId && sessionData.projectId && sessionData.projectItemId) {
      try {
        const estRes = updateIssueEstimate(sessionData.projectId, sessionData.projectItemId, sessionData.estimateFieldId, sessionData.newEstimate, sessionData.issueNumber);
        githubEstimateSuccess = estRes.ghUpdated;
      } catch (err) {
        console.warn('Error al actualizar estimación en GitHub:', err.message);
      }
    } else if (sessionData.issueNumber) {
      const map = {};
      map[String(sessionData.issueNumber)] = sessionData.newEstimate;
      refreshSummary(map);
    }
  } else {
    refreshSummary();
  }
  
  // Limpiar timer activo
  discardTimer();
  
  return {
    success: true,
    message: 'Sesión guardada exitosamente.',
    githubCommentSuccess: githubCommentSuccess,
    githubStatusSuccess: githubStatusSuccess,
    githubEstimateSuccess: githubEstimateSuccess
  };
}

// ==========================================
// MUTACIONES GRAPHQL EN GITHUB
// ==========================================

function updateProjectItemStatus(projectId, itemId, fieldId, optionId) {
  const mutation = `
    mutation UpdateStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: {
            singleSelectOptionId: $optionId
          }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `;
  
  return executeGitHubGraphQL(mutation, {
    projectId: projectId,
    itemId: itemId,
    fieldId: fieldId,
    optionId: optionId
  });
}

function addCommentToIssue(issueNodeId, bodyText) {
  const mutation = `
    mutation AddIssueComment($subjectId: ID!, $body: String!) {
      addComment(input: { subjectId: $subjectId, body: $body }) {
        commentEdge {
          node {
            id
            url
          }
        }
      }
    }
  `;
  
  return executeGitHubGraphQL(mutation, {
    subjectId: issueNodeId,
    body: bodyText
  });
}
