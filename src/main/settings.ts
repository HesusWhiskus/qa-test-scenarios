import * as fs from 'fs';
import * as path from 'path';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
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
  windowBounds?: WindowBounds;
  profile: TesterProfile;
  youtrack: YouTrackConfig;
}

export const DEFAULT_FAIL_NOTE_TEMPLATE = `Kroki reprodukcji:
1. 

Oczekiwany rezultat:

Rzeczywisty rezultat:

Środowisko: {{environment}} | Build: {{build}}`;

export const DEFAULT_SETTINGS: AppSettings = {
  recentFiles: [],
  profile: {
    defaultTester: '',
    defaultEnvironment: '',
    defaultBuildVersion: '',
    environments: ['dev', 'staging', 'UAT', 'production'],
    failNoteTemplate: DEFAULT_FAIL_NOTE_TEMPLATE,
  },
  youtrack: {
    baseUrl: '',
    token: '',
    projectId: '',
    defaultIssueType: 'Bug',
    customFields: {},
  },
};

export function createSettingsStore(settingsPath: string) {
  function loadSettings(): AppSettings {
    try {
      const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return {
        ...DEFAULT_SETTINGS,
        ...raw,
        profile: { ...DEFAULT_SETTINGS.profile, ...raw.profile },
        youtrack: {
          ...DEFAULT_SETTINGS.youtrack,
          ...raw.youtrack,
          customFields: { ...DEFAULT_SETTINGS.youtrack.customFields, ...raw.youtrack?.customFields },
        },
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings: AppSettings): void {
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }

  function updateSettings(
    partial: Partial<AppSettings> & { profile?: Partial<TesterProfile>; youtrack?: Partial<YouTrackConfig> },
  ): AppSettings {
    const current = loadSettings();
    const next: AppSettings = {
      ...current,
      ...partial,
      profile: { ...current.profile, ...partial.profile },
      youtrack: {
        ...current.youtrack,
        ...partial.youtrack,
        customFields: { ...current.youtrack.customFields, ...partial.youtrack?.customFields },
      },
    };
    saveSettings(next);
    return next;
  }

  function addRecentFile(filePath: string): void {
    const settings = loadSettings();
    settings.recentFiles = [filePath, ...settings.recentFiles.filter(f => f !== filePath)].slice(0, 10);
    saveSettings(settings);
  }

  return { loadSettings, saveSettings, updateSettings, addRecentFile };
}

export function applyFailNoteTemplate(
  template: string,
  vars: { environment: string; build: string; expectedResult?: string },
): string {
  return template
    .replace(/\{\{environment\}\}/g, vars.environment || '—')
    .replace(/\{\{build\}\}/g, vars.build || '—')
    .replace(/\{\{expectedResult\}\}/g, vars.expectedResult || '—');
}
