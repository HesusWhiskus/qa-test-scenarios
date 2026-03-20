import type { Scenario } from '../types/schema';

const api = window.electronAPI;

export async function openScenario(): Promise<{ filePath: string; scenario: Scenario } | null> {
  const result = await api.openScenario();
  if (!result) return null;
  return { filePath: result.filePath, scenario: result.content };
}

export async function readScenario(filePath: string): Promise<{ filePath: string; scenario: Scenario } | null> {
  const result = await api.readScenario(filePath);
  if (!result) return null;
  return { filePath: result.filePath, scenario: result.content };
}

export async function saveScenario(filePath: string | null, scenario: Scenario): Promise<string | null> {
  return api.saveScenario({ filePath, data: scenario });
}

export async function exportMarkdown(markdown: string, defaultName: string): Promise<string | null> {
  return api.exportMarkdown({ markdown, defaultName });
}

export async function copyScreenshot(scenarioPath: string): Promise<{ filename: string; relativePath: string } | null> {
  return api.copyScreenshot({ scenarioPath });
}

export async function getRecentFiles(): Promise<string[]> {
  const settings = await api.getSettings();
  return settings?.recentFiles || [];
}
