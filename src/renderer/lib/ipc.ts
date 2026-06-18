import type { Scenario } from '../types/schema';

const api = window.electronAPI;

export type ScenarioReadError = 'read_failed' | 'invalid_schema';

export type OpenScenarioResult =
  | { filePath: string; scenario: Scenario }
  | { error: ScenarioReadError }
  | null;

export interface SavedRunSummary {
  id: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  progress: { done: number; total: number };
}

export interface SavedScenarioSummary {
  filePath: string;
  title: string;
  updatedAt: string;
  runCount: number;
  activeRunCount: number;
  lastRun: SavedRunSummary | null;
}

export interface AppInfo {
  version: string;
  scenariosDir: string;
}

export async function openScenario(): Promise<OpenScenarioResult> {
  const result = await api.openScenario();
  if (!result) return null;
  if ('error' in result) return { error: result.error };
  return { filePath: result.filePath, scenario: result.content as Scenario };
}

export async function readScenario(filePath: string): Promise<OpenScenarioResult> {
  const result = await api.readScenario(filePath);
  if (!result) return null;
  if ('error' in result) return { error: result.error };
  return { filePath: result.filePath, scenario: result.content as Scenario };
}

export async function saveScenario(
  filePath: string | null,
  scenario: Scenario,
  options?: { autoSave?: boolean },
): Promise<string | null> {
  return api.saveScenario({ filePath, data: scenario, autoSave: options?.autoSave });
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

export async function getAppInfo(): Promise<AppInfo> {
  return api.getAppInfo();
}

export async function listSavedScenarios(): Promise<SavedScenarioSummary[]> {
  return api.listSavedScenarios();
}

export async function openScenariosDir(): Promise<void> {
  await api.openScenariosDir();
}

export async function listTemplates(): Promise<string[]> {
  return api.listTemplates();
}

export async function readTemplate(relativePath: string): Promise<Scenario | null> {
  const result = await api.readTemplate(relativePath);
  if (!result || typeof result !== 'object' || 'error' in result) return null;
  return result as Scenario;
}
