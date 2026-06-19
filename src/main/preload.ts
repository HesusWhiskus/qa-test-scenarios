import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (partial: unknown) => ipcRenderer.invoke('update-settings', partial),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  listSavedScenarios: () => ipcRenderer.invoke('list-saved-scenarios'),
  openScenariosDir: () => ipcRenderer.invoke('open-scenarios-dir'),
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url),
  openScenario: () => ipcRenderer.invoke('open-scenario'),
  readScenario: (filePath: string) => ipcRenderer.invoke('read-scenario', filePath),
  saveScenario: (args: { filePath: string | null; data: unknown; autoSave?: boolean }) =>
    ipcRenderer.invoke('save-scenario', args),
  exportMarkdown: (args: { markdown: string; defaultName: string }) => ipcRenderer.invoke('export-markdown', args),
  copyScreenshot: (args: { scenarioPath: string }) => ipcRenderer.invoke('copy-screenshot', args),
  pasteScreenshot: (args: { scenarioPath: string }) => ipcRenderer.invoke('paste-screenshot', args),
  readScreenshot: (args: { scenarioPath: string; filename: string }) => ipcRenderer.invoke('read-screenshot', args),
  deleteScreenshot: (args: { scenarioPath: string; filename: string }) => ipcRenderer.invoke('delete-screenshot', args),
  importExcel: () => ipcRenderer.invoke('import-excel'),
  listTemplates: () => ipcRenderer.invoke('list-templates'),
  readTemplate: (relativePath: string) => ipcRenderer.invoke('read-template', relativePath),
  youtrackTestConnection: () => ipcRenderer.invoke('youtrack-test-connection'),
  youtrackSearchIssues: (query: string) => ipcRenderer.invoke('youtrack-search-issues', query),
  youtrackCreateIssue: (payload: unknown) => ipcRenderer.invoke('youtrack-create-issue', payload),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
