import type { Scenario } from '../types/schema';
import { getAllItems } from '../types/schema';
import { builtinTemplates } from './templates';
import * as ipc from './ipc';

export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  stepCount: number;
  scenario: Scenario;
  isStub: boolean;
  folder: string;
  source: 'builtin' | 'file';
}

const FOLDER_LABELS: Record<string, string> = {
  direct: 'Direct',
  'profil-agenta': 'Profil Agenta',
  ibooster: 'iBooster',
  'integracja-ibooster-crm': 'Integracja iBooster – CRM',
  _root: 'Inne',
};

export function formatFolderName(folder: string): string {
  return FOLDER_LABELS[folder] ?? folder
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function firstLine(text: string, maxLen = 100): string {
  const line = text.split('\n')[0].trim();
  if (line.length <= maxLen) return line;
  return `${line.slice(0, maxLen - 1)}…`;
}

function isStubScenario(scenario: Scenario): boolean {
  const items = getAllItems(scenario);
  return items.length === 1 && items[0].id === 'placeholder';
}

export async function loadCatalogEntries(options: { includeStubs: boolean }): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];

  for (const tpl of builtinTemplates) {
    const stepCount = getAllItems(tpl.scenario).length;
    const stub = isStubScenario(tpl.scenario);
    if (!options.includeStubs && stub) continue;
    entries.push({
      id: `builtin:${tpl.id}`,
      title: tpl.title,
      description: firstLine(tpl.description),
      stepCount,
      scenario: tpl.scenario,
      isStub: stub,
      folder: 'builtin',
      source: 'builtin',
    });
  }

  const paths = await ipc.listTemplates();
  for (const relativePath of paths) {
    const scenario = await ipc.readTemplate(relativePath);
    if (!scenario) continue;
    const folder = relativePath.includes('/') ? relativePath.split('/')[0] : '_root';
    const stub = isStubScenario(scenario);
    if (!options.includeStubs && stub) continue;
    entries.push({
      id: `file:${relativePath}`,
      title: scenario.meta.title,
      description: firstLine(scenario.meta.description),
      stepCount: getAllItems(scenario).length,
      scenario,
      isStub: stub,
      folder,
      source: 'file',
    });
  }

  return entries;
}

export function groupByFolder(entries: CatalogEntry[]): Record<string, CatalogEntry[]> {
  const grouped: Record<string, CatalogEntry[]> = {};
  for (const entry of entries) {
    if (!grouped[entry.folder]) grouped[entry.folder] = [];
    grouped[entry.folder].push(entry);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.title.localeCompare(b.title, 'pl'));
  }
  return grouped;
}
