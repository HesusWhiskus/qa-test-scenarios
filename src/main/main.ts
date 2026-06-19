import { app, BrowserWindow, ipcMain, dialog, Menu, session, screen, shell, clipboard, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { migrateScenario } from '../renderer/types/schema';
import { createSettingsStore } from './settings';
import {
  testYouTrackConnection,
  createYouTrackIssue,
  uploadYouTrackAttachment,
  searchYouTrackIssues,
} from './youtrack-client';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const IS_DEV = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

app.setAppLogsPath();
const USER_DATA_DIR = app.getPath('userData');
const SETTINGS_PATH = path.join(USER_DATA_DIR, 'settings.json');
const SCENARIOS_DIR = path.join(USER_DATA_DIR, 'scenarios');

const settingsStore = createSettingsStore(SETTINGS_PATH);
const { loadSettings, updateSettings, addRecentFile } = settingsStore;

// ---------------------------------------------------------------------------
// Path validation
// ---------------------------------------------------------------------------

function assertJsonExtension(filePath: string): void {
  if (path.extname(filePath).toLowerCase() !== '.json') {
    throw new Error(`Rejected non-JSON path: ${filePath}`);
  }
}

function assertSafeFilename(filename: string): void {
  if (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\') ||
    filename !== path.basename(filename)
  ) {
    throw new Error(`Rejected unsafe filename: ${filename}`);
  }
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);

function assertImageExtension(filename: string): void {
  if (!IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase())) {
    throw new Error(`Rejected non-image filename: ${filename}`);
  }
}

function getScenarioFilesDir(scenarioPath: string): { filesDir: string; scenarioName: string } {
  const scenarioDir = path.dirname(scenarioPath);
  const scenarioName = path.basename(scenarioPath, '.json');
  return { filesDir: path.join(scenarioDir, `${scenarioName}_files`), scenarioName };
}

function isVisibleOnAnyDisplay(bounds: { x: number; y: number; width: number; height: number }): boolean {
  const displays = screen.getAllDisplays();
  return displays.some(display => {
    const { x, y, width, height } = display.workArea;
    return (
      bounds.x + bounds.width > x &&
      bounds.x < x + width &&
      bounds.y + bounds.height > y &&
      bounds.y < y + height
    );
  });
}

function slugifyTitle(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .toLowerCase();
  return slug || 'scenariusz';
}

function getAutoSavePath(title: string): string {
  if (!fs.existsSync(SCENARIOS_DIR)) {
    fs.mkdirSync(SCENARIOS_DIR, { recursive: true });
  }
  const base = slugifyTitle(title);
  let candidate = path.join(SCENARIOS_DIR, `${base}.json`);
  if (!fs.existsSync(candidate)) return candidate;
  let i = 2;
  while (fs.existsSync(path.join(SCENARIOS_DIR, `${base}-${i}.json`))) i++;
  return path.join(SCENARIOS_DIR, `${base}-${i}.json`);
}

// ---------------------------------------------------------------------------
// Scenario file I/O
// ---------------------------------------------------------------------------

type ReadScenarioError = { error: 'read_failed' | 'invalid_schema' };

function readScenarioFile(filePath: string): { filePath: string; content: unknown } | ReadScenarioError {
  try {
    assertJsonExtension(filePath);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const migrated = migrateScenario(parsed);
    if (!migrated) return { error: 'invalid_schema' };
    return { filePath, content: migrated };
  } catch {
    return { error: 'read_failed' };
  }
}

function getTemplatesDir(): string {
  if (IS_DEV) {
    return path.join(app.getAppPath(), 'public', 'templates');
  }
  return path.join(process.resourcesPath, 'templates');
}

function listJsonFiles(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listJsonFiles(fullPath, baseDir));
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.json') {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results.sort();
}

function assertSafeRelativePath(relativePath: string): void {
  if (
    relativePath.includes('..') ||
    path.isAbsolute(relativePath) ||
    relativePath.startsWith('/')
  ) {
    throw new Error(`Rejected unsafe relative path: ${relativePath}`);
  }
}

interface SavedRunSummary {
  id: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  progress: { done: number; total: number };
}

interface SavedScenarioSummary {
  filePath: string;
  title: string;
  updatedAt: string;
  runCount: number;
  activeRunCount: number;
  lastRun: SavedRunSummary | null;
}

function countRunProgress(
  run: { results: Record<string, { status: string }> },
  totalItems: number,
): { done: number; total: number } {
  let done = 0;
  for (const result of Object.values(run.results)) {
    if (result.status !== 'pending') done++;
  }
  return { done, total: totalItems };
}

function buildScenarioSummary(filePath: string): SavedScenarioSummary | null {
  const readResult = readScenarioFile(filePath);
  if ('error' in readResult) return null;

  const scenario = readResult.content as {
    meta: { title: string; updatedAt: string };
    sections: { items: unknown[] }[];
    runs: {
      id: string;
      meta: { name: string; startedAt: string; completedAt?: string };
      results: Record<string, { status: string }>;
    }[];
  };

  const totalItems = scenario.sections.reduce((n, s) => n + s.items.length, 0);
  const runs = scenario.runs || [];
  const activeRunCount = runs.filter(r => !r.meta.completedAt).length;

  const lastRun = runs.length === 0
    ? null
    : [...runs].sort((a, b) => b.meta.startedAt.localeCompare(a.meta.startedAt))[0];

  let lastRunSummary: SavedRunSummary | null = null;
  if (lastRun) {
    const progress = countRunProgress(lastRun, totalItems);
    lastRunSummary = {
      id: lastRun.id,
      name: lastRun.meta.name,
      startedAt: lastRun.meta.startedAt,
      completedAt: lastRun.meta.completedAt,
      progress,
    };
  }

  let updatedAt = scenario.meta.updatedAt;
  try {
    const stat = fs.statSync(filePath);
    if (stat.mtime.toISOString() > updatedAt) updatedAt = stat.mtime.toISOString();
  } catch { /* ignore */ }

  return {
    filePath,
    title: scenario.meta.title,
    updatedAt,
    runCount: runs.length,
    activeRunCount,
    lastRun: lastRunSummary,
  };
}

function listScenarioPaths(): string[] {
  const paths = new Set<string>();
  const settings = loadSettings();

  if (fs.existsSync(SCENARIOS_DIR)) {
    for (const entry of fs.readdirSync(SCENARIOS_DIR, { withFileTypes: true })) {
      if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.json') {
        paths.add(path.join(SCENARIOS_DIR, entry.name));
      }
    }
  }

  for (const filePath of settings.recentFiles) {
    if (fs.existsSync(filePath) && path.extname(filePath).toLowerCase() === '.json') {
      paths.add(filePath);
    }
  }

  return [...paths];
}

function listSavedScenarios(): SavedScenarioSummary[] {
  const summaries: SavedScenarioSummary[] = [];
  for (const filePath of listScenarioPaths()) {
    const summary = buildScenarioSummary(filePath);
    if (summary) summaries.push(summary);
  }

  return summaries.sort((a, b) => {
    if (a.activeRunCount > 0 && b.activeRunCount === 0) return -1;
    if (b.activeRunCount > 0 && a.activeRunCount === 0) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function saveScreenshotToDir(scenarioPath: string, sourceBuffer: Buffer, ext: string): { filename: string; relativePath: string } | null {
  assertJsonExtension(scenarioPath);
  const { filesDir, scenarioName } = getScenarioFilesDir(scenarioPath);
  if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });
  const filename = `screenshot_${Date.now()}${ext}`;
  fs.writeFileSync(path.join(filesDir, filename), sourceBuffer);
  return { filename, relativePath: `./${scenarioName}_files/${filename}` };
}

function resolveScreenshotPath(scenarioPath: string, filename: string): string | null {
  try {
    assertJsonExtension(scenarioPath);
    assertSafeFilename(filename);
    assertImageExtension(filename);
  } catch {
    return null;
  }
  const { filesDir } = getScenarioFilesDir(scenarioPath);
  const resolvedPath = path.resolve(filesDir, filename);
  if (!resolvedPath.startsWith(path.resolve(filesDir))) return null;
  if (!fs.existsSync(resolvedPath)) return null;
  return resolvedPath;
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;

function saveWindowBounds() {
  if (!mainWindow) return;
  const settings = loadSettings();
  const maximized = mainWindow.isMaximized();
  const bounds = maximized ? (settings.windowBounds || mainWindow.getBounds()) : mainWindow.getBounds();
  settings.windowBounds = { ...bounds, maximized };
  settingsStore.saveSettings(settings);
}

function createWindow() {
  Menu.setApplicationMenu(null);

  const settings = loadSettings();
  const saved = settings.windowBounds;
  const usesSaved = saved && isVisibleOnAnyDisplay(saved);

  mainWindow = new BrowserWindow({
    width: usesSaved ? saved.width : 1280,
    height: usesSaved ? saved.height : 800,
    x: usesSaved ? saved.x : undefined,
    y: usesSaved ? saved.y : undefined,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  if (usesSaved && saved.maximized) {
    mainWindow.maximize();
  }

  mainWindow.on('close', saveWindowBounds);
  mainWindow.on('resize', saveWindowBounds);
  mainWindow.on('move', saveWindowBounds);

  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' as const }));

  if (!IS_DEV) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const isDevToolsShortcut =
        input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i');
      if (isDevToolsShortcut) event.preventDefault();
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (IS_DEV) mainWindow?.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Renderer failed to load:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
}

function setupSecurityPolicies() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = IS_DEV
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 ws://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173; style-src 'self' 'unsafe-inline' http://localhost:5173; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws://localhost:5173 http://localhost:5173"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'";

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle('get-settings', () => {
  const s = loadSettings();
  return {
    ...s,
    youtrack: { ...s.youtrack, token: s.youtrack.token ? '***' : '' },
  };
});

ipcMain.handle('update-settings', (_event, partial: Parameters<typeof updateSettings>[0]) => {
  const current = loadSettings();
  if (partial.youtrack?.token === '***' || partial.youtrack?.token === '') {
    if (partial.youtrack) partial.youtrack.token = current.youtrack.token;
  }
  const updated = updateSettings(partial);
  return {
    ...updated,
    youtrack: { ...updated.youtrack, token: updated.youtrack.token ? '***' : '' },
  };
});

ipcMain.handle('get-app-info', () => ({
  version: app.getVersion(),
  scenariosDir: SCENARIOS_DIR,
}));

ipcMain.handle('list-saved-scenarios', () => listSavedScenarios());

ipcMain.handle('open-scenarios-dir', () => {
  if (!fs.existsSync(SCENARIOS_DIR)) {
    fs.mkdirSync(SCENARIOS_DIR, { recursive: true });
  }
  shell.openPath(SCENARIOS_DIR);
});

ipcMain.handle('open-external-url', async (_event, url: string) => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    await shell.openExternal(url);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('open-scenario', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'QA Scenario', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const readResult = readScenarioFile(filePath);
  if ('error' in readResult) return readResult;
  addRecentFile(filePath);
  return readResult;
});

ipcMain.handle('read-scenario', async (_event, filePath: string) => {
  const readResult = readScenarioFile(filePath);
  if ('error' in readResult) return readResult;
  addRecentFile(filePath);
  return readResult;
});

ipcMain.handle('list-templates', () => {
  const templatesDir = getTemplatesDir();
  return listJsonFiles(templatesDir);
});

ipcMain.handle('read-template', (_event, relativePath: string) => {
  try {
    assertSafeRelativePath(relativePath);
    assertJsonExtension(relativePath);
    const fullPath = path.join(getTemplatesDir(), relativePath);
    const readResult = readScenarioFile(fullPath);
    if ('error' in readResult) return readResult;
    return readResult.content;
  } catch {
    return { error: 'read_failed' as const };
  }
});

ipcMain.handle('save-scenario', async (
  _event,
  { filePath, data, autoSave }: { filePath: string | null; data: unknown; autoSave?: boolean },
) => {
  const migrated = migrateScenario(data);
  if (!migrated) return null;

  let targetPath = filePath;
  if (!targetPath) {
    if (autoSave) {
      targetPath = getAutoSavePath(migrated.meta.title);
    } else {
      const result = await dialog.showSaveDialog(mainWindow!, {
        filters: [{ name: 'QA Scenario', extensions: ['json'] }],
      });
      if (result.canceled || !result.filePath) return null;
      targetPath = result.filePath;
    }
  }
  assertJsonExtension(targetPath);
  fs.writeFileSync(targetPath, JSON.stringify(migrated, null, 2), 'utf-8');
  addRecentFile(targetPath);
  return targetPath;
});

ipcMain.handle('export-markdown', async (_event, { markdown, defaultName }: { markdown: string; defaultName: string }) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    defaultPath: defaultName,
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, markdown, 'utf-8');
  return result.filePath;
});

ipcMain.handle('copy-screenshot', async (_event, { scenarioPath }: { scenarioPath: string }) => {
  assertJsonExtension(scenarioPath);

  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const sourcePath = result.filePaths[0];
  const ext = path.extname(sourcePath);
  const buffer = fs.readFileSync(sourcePath);
  return saveScreenshotToDir(scenarioPath, buffer, ext);
});

ipcMain.handle('paste-screenshot', async (_event, { scenarioPath }: { scenarioPath: string }) => {
  const image = clipboard.readImage();
  if (image.isEmpty()) return null;
  const png = image.toPNG();
  return saveScreenshotToDir(scenarioPath, png, '.png');
});

ipcMain.handle('read-screenshot', async (_event, { scenarioPath, filename }: { scenarioPath: string; filename: string }) => {
  const resolvedPath = resolveScreenshotPath(scenarioPath, filename);
  if (!resolvedPath) return null;

  const data = fs.readFileSync(resolvedPath);
  const mimeMap: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  };
  const mime = mimeMap[path.extname(filename).toLowerCase()] || 'image/png';
  return `data:${mime};base64,${data.toString('base64')}`;
});

ipcMain.handle('delete-screenshot', async (_event, { scenarioPath, filename }: { scenarioPath: string; filename: string }) => {
  const resolvedPath = resolveScreenshotPath(scenarioPath, filename);
  if (!resolvedPath) return false;
  try {
    fs.unlinkSync(resolvedPath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('import-excel', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const filePath = result.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  const { parseExcelToScenario } = await import('./excel-import');
  const parsed = await parseExcelToScenario(buffer, path.basename(filePath));
  if ('error' in parsed) return parsed;
  return parsed;
});

ipcMain.handle('youtrack-test-connection', async () => {
  const settings = loadSettings();
  return testYouTrackConnection(settings.youtrack);
});

ipcMain.handle('youtrack-search-issues', async (_event, query: string) => {
  const settings = loadSettings();
  return searchYouTrackIssues(settings.youtrack, query);
});

ipcMain.handle('youtrack-create-issue', async (_event, payload: {
  summary: string;
  description: string;
  environment?: string;
  buildVersion?: string;
  scenarioPath?: string;
  attachments?: { filename: string }[];
}) => {
  const settings = loadSettings();
  const result = await createYouTrackIssue(settings.youtrack, payload);
  if ('error' in result) return result;

  if (payload.scenarioPath && payload.attachments?.length) {
    for (const att of payload.attachments) {
      const resolved = resolveScreenshotPath(payload.scenarioPath, att.filename);
      if (resolved) {
        const buffer = fs.readFileSync(resolved);
        await uploadYouTrackAttachment(settings.youtrack, result.id, att.filename, buffer);
      }
    }
  }

  return result;
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  setupSecurityPolicies();
  createWindow();
});
app.on('window-all-closed', () => app.quit());
