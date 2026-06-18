import { app, BrowserWindow, ipcMain, dialog, Menu, session, screen, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ScenarioSchema } from '../renderer/types/schema';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const IS_DEV = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

// Stable userData path independent of Squirrel version subdirectories
app.setAppLogsPath();
const USER_DATA_DIR = app.getPath('userData');
const SETTINGS_PATH = path.join(USER_DATA_DIR, 'settings.json');
const SCENARIOS_DIR = path.join(USER_DATA_DIR, 'scenarios');

// ---------------------------------------------------------------------------
// Path validation — prevents path traversal attacks from renderer
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

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

interface AppSettings {
  recentFiles: string[];
  windowBounds?: WindowBounds;
}

function loadSettings(): AppSettings {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return { recentFiles: [] };
  }
}

function isVisibleOnAnyDisplay(bounds: WindowBounds): boolean {
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

function saveSettings(settings: AppSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

function addRecentFile(filePath: string): void {
  const settings = loadSettings();
  settings.recentFiles = [filePath, ...settings.recentFiles.filter(f => f !== filePath)].slice(0, 10);
  saveSettings(settings);
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
    const validated = ScenarioSchema.safeParse(parsed);
    if (!validated.success) return { error: 'invalid_schema' };
    return { filePath, content: validated.data };
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
  saveSettings(settings);
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

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
}

// ---------------------------------------------------------------------------
// Security policies (CSP, permissions)
// ---------------------------------------------------------------------------

function setupSecurityPolicies() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = IS_DEV
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws:"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'";

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

ipcMain.handle('get-settings', () => loadSettings());

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
  const parsed = ScenarioSchema.safeParse(data);
  if (!parsed.success) return null;

  let targetPath = filePath;
  if (!targetPath) {
    if (autoSave) {
      targetPath = getAutoSavePath(parsed.data.meta.title);
    } else {
      const result = await dialog.showSaveDialog(mainWindow!, {
        filters: [{ name: 'QA Scenario', extensions: ['json'] }],
      });
      if (result.canceled || !result.filePath) return null;
      targetPath = result.filePath;
    }
  }
  assertJsonExtension(targetPath);
  fs.writeFileSync(targetPath, JSON.stringify(parsed.data, null, 2), 'utf-8');
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
  const scenarioDir = path.dirname(scenarioPath);
  const scenarioName = path.basename(scenarioPath, '.json');
  const filesDir = path.join(scenarioDir, `${scenarioName}_files`);

  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }

  const ext = path.extname(sourcePath);
  const filename = `screenshot_${Date.now()}${ext}`;
  fs.copyFileSync(sourcePath, path.join(filesDir, filename));

  return { filename, relativePath: `./${scenarioName}_files/${filename}` };
});

ipcMain.handle('read-screenshot', async (_event, { scenarioPath, filename }: { scenarioPath: string; filename: string }) => {
  try {
    assertJsonExtension(scenarioPath);
    assertSafeFilename(filename);
    assertImageExtension(filename);
  } catch {
    return null;
  }

  const scenarioDir = path.dirname(scenarioPath);
  const scenarioName = path.basename(scenarioPath, '.json');
  const resolvedPath = path.resolve(scenarioDir, `${scenarioName}_files`, filename);
  const expectedDir = path.resolve(scenarioDir, `${scenarioName}_files`);

  if (!resolvedPath.startsWith(expectedDir)) return null;
  if (!fs.existsSync(resolvedPath)) return null;

  const data = fs.readFileSync(resolvedPath);
  const mimeMap: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  };
  const mime = mimeMap[path.extname(filename).toLowerCase()] || 'image/png';
  return `data:${mime};base64,${data.toString('base64')}`;
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  setupSecurityPolicies();
  createWindow();
});
app.on('window-all-closed', () => app.quit());
