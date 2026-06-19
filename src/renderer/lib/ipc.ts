import type { Scenario } from '../types/schema';

function getApi() {
  if (!window.electronAPI) {
    throw new Error('Brak połączenia z Electron (electronAPI). Uruchom aplikację przez npm start.');
  }
  return window.electronAPI;
}

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

export interface TesterProfile {
  defaultTester: string;
  defaultEnvironment: string;
  defaultBuildVersion: string;
  environments: string[];
  failNoteTemplate: string;
}

export interface YouTrackCustomFieldMap {
  environment?: string;
  build?: string;
  type?: string;
}

export interface YouTrackConfig {
  baseUrl: string;
  token: string;
  projectId: string;
  defaultIssueType: string;
  customFields: YouTrackCustomFieldMap;
}

export interface AppSettings {
  recentFiles: string[];
  profile: TesterProfile;
  youtrack: YouTrackConfig;
}

export interface YouTrackIssue {
  id: string;
  idReadable: string;
  summary: string;
  url: string;
}

export async function openScenario(): Promise<OpenScenarioResult> {
  const result = await getApi().openScenario();
  if (!result) return null;
  if ('error' in result) return { error: result.error };
  return { filePath: result.filePath, scenario: result.content as Scenario };
}

export async function readScenario(filePath: string): Promise<OpenScenarioResult> {
  const result = await getApi().readScenario(filePath);
  if (!result) return null;
  if ('error' in result) return { error: result.error };
  return { filePath: result.filePath, scenario: result.content as Scenario };
}

export async function saveScenario(
  filePath: string | null,
  scenario: Scenario,
  options?: { autoSave?: boolean },
): Promise<string | null> {
  return getApi().saveScenario({ filePath, data: scenario, autoSave: options?.autoSave });
}

export async function exportMarkdown(markdown: string, defaultName: string): Promise<string | null> {
  return getApi().exportMarkdown({ markdown, defaultName });
}

export async function copyScreenshot(scenarioPath: string): Promise<{ filename: string; relativePath: string } | null> {
  return getApi().copyScreenshot({ scenarioPath });
}

export async function pasteScreenshot(scenarioPath: string): Promise<{ filename: string; relativePath: string } | null> {
  return getApi().pasteScreenshot({ scenarioPath });
}

export async function readScreenshot(scenarioPath: string, filename: string): Promise<string | null> {
  return getApi().readScreenshot({ scenarioPath, filename });
}

export async function deleteScreenshot(scenarioPath: string, filename: string): Promise<boolean> {
  return getApi().deleteScreenshot({ scenarioPath, filename });
}

export async function openExternalUrl(url: string): Promise<boolean> {
  return getApi().openExternalUrl(url);
}

export async function getSettings(): Promise<AppSettings> {
  return getApi().getSettings();
}

export async function updateSettings(partial: Partial<AppSettings> & {
  profile?: Partial<TesterProfile>;
  youtrack?: Partial<YouTrackConfig>;
}): Promise<AppSettings> {
  return getApi().updateSettings(partial);
}

export async function getRecentFiles(): Promise<string[]> {
  const settings = await getApi().getSettings();
  return settings?.recentFiles || [];
}

export async function getAppInfo(): Promise<AppInfo> {
  return getApi().getAppInfo();
}

export async function listSavedScenarios(): Promise<SavedScenarioSummary[]> {
  return getApi().listSavedScenarios();
}

export async function openScenariosDir(): Promise<void> {
  await getApi().openScenariosDir();
}

export async function listTemplates(): Promise<string[]> {
  return getApi().listTemplates();
}

export async function readTemplate(relativePath: string): Promise<Scenario | null> {
  const result = await getApi().readTemplate(relativePath);
  if (!result || typeof result !== 'object' || 'error' in result) return null;
  return result as Scenario;
}

export async function importExcel(): Promise<Scenario | { error: string } | null> {
  const result = await getApi().importExcel();
  if (!result) return null;
  if ('error' in result) return result;
  return result as Scenario;
}

export async function youtrackTestConnection(): Promise<{ ok: true } | { ok: false; error: string }> {
  return getApi().youtrackTestConnection();
}

export async function youtrackSearchIssues(query: string): Promise<YouTrackIssue[] | { error: string }> {
  return getApi().youtrackSearchIssues(query);
}

export async function youtrackCreateIssue(payload: {
  summary: string;
  description: string;
  environment?: string;
  buildVersion?: string;
  scenarioPath?: string;
  attachments?: { filename: string }[];
}): Promise<YouTrackIssue | { error: string }> {
  return getApi().youtrackCreateIssue(payload);
}
