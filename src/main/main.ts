import { app, BrowserWindow, ipcMain, dialog, Menu, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ScenarioSchema } from '../renderer/types/schema';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const IS_DEV = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

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

interface AppSettings {
  recentFiles: string[];
}

function loadSettings(): AppSettings {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'));
  } catch {
    return { recentFiles: [] };
  }
}

function saveSettings(settings: AppSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

function addRecentFile(filePath: string): void {
  const settings = loadSettings();
  settings.recentFiles = [filePath, ...settings.recentFiles.filter(f => f !== filePath)].slice(0, 10);
  saveSettings(settings);
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
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

  // Block navigation away from the app
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' as const }));

  // Block DevTools in production
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

ipcMain.handle('open-scenario', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'QA Scenario', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    addRecentFile(filePath);
    return { filePath, content };
  } catch {
    return null;
  }
});

ipcMain.handle('read-scenario', async (_event, filePath: string) => {
  try {
    assertJsonExtension(filePath);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    addRecentFile(filePath);
    return { filePath, content };
  } catch {
    return null;
  }
});

ipcMain.handle('save-scenario', async (_event, { filePath, data }: { filePath: string | null; data: unknown }) => {
  const parsed = ScenarioSchema.safeParse(data);
  if (!parsed.success) return null;

  let targetPath = filePath;
  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: [{ name: 'QA Scenario', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return null;
    targetPath = result.filePath;
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
