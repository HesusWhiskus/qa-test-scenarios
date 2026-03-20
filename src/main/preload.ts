import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  openScenario: () => ipcRenderer.invoke('open-scenario'),
  readScenario: (filePath: string) => ipcRenderer.invoke('read-scenario', filePath),
  saveScenario: (args: { filePath: string | null; data: unknown }) => ipcRenderer.invoke('save-scenario', args),
  exportMarkdown: (args: { markdown: string; defaultName: string }) => ipcRenderer.invoke('export-markdown', args),
  copyScreenshot: (args: { scenarioPath: string }) => ipcRenderer.invoke('copy-screenshot', args),
  readScreenshot: (args: { scenarioPath: string; filename: string }) => ipcRenderer.invoke('read-screenshot', args),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
