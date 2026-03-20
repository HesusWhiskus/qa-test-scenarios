import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

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
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
}

ipcMain.handle('get-settings', () => loadSettings());

ipcMain.handle('open-scenario', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'QA Scenario', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  addRecentFile(filePath);
  return { filePath, content: JSON.parse(content) };
});

ipcMain.handle('read-scenario', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    addRecentFile(filePath);
    return { filePath, content: JSON.parse(content) };
  } catch {
    return null;
  }
});

ipcMain.handle('save-scenario', async (_event, { filePath, data }: { filePath: string | null; data: unknown }) => {
  let targetPath = filePath;
  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow!, {
      filters: [{ name: 'QA Scenario', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return null;
    targetPath = result.filePath;
  }
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');
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
  const scenarioDir = path.dirname(scenarioPath);
  const scenarioName = path.basename(scenarioPath, '.json');
  const filePath = path.join(scenarioDir, `${scenarioName}_files`, filename);

  if (!fs.existsSync(filePath)) return null;

  const data = fs.readFileSync(filePath);
  const mimeMap: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
  };
  const mime = mimeMap[path.extname(filename).toLowerCase()] || 'image/png';
  return `data:${mime};base64,${data.toString('base64')}`;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
