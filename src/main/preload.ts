import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  listSavedScenarios: () => ipcRenderer.invoke('list-saved-scenarios'),
  openScenariosDir: () => ipcRenderer.invoke('open-scenarios-dir'),
  openScenario: () => ipcRenderer.invoke('open-scenario'),
  readScenario: (filePath: string) => ipcRenderer.invoke('read-scenario', filePath),
  saveScenario: (args: { filePath: string | null; data: unknown; autoSave?: boolean }) =>
    ipcRenderer.invoke('save-scenario', args),
  exportMarkdown: (args: { markdown: string; defaultName: string }) => ipcRenderer.invoke('export-markdown', args),
  copyScreenshot: (args: { scenarioPath: string }) => ipcRenderer.invoke('copy-screenshot', args),
  readScreenshot: (args: { scenarioPath: string; filename: string }) => ipcRenderer.invoke('read-screenshot', args),
  listTemplates: () => ipcRenderer.invoke('list-templates'),
  readTemplate: (relativePath: string) => ipcRenderer.invoke('read-template', relativePath),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
