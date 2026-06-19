import type { Scenario, Run, Item, Status } from '../types/schema';
import { getAllItems } from '../types/schema';

export type DiffCategory = 'regression' | 'fixed' | 'new_fail' | 'unchanged' | 'other';

export interface RunDiffEntry {
  item: Item;
  sectionTitle: string;
  runAStatus: Status;
  runBStatus: Status;
  category: DiffCategory;
}

function categorizeDiff(prev: Status, next: Status): DiffCategory {
  if (prev === next) return 'unchanged';
  if (prev === 'pass' && (next === 'fail' || next === 'blocked')) return 'regression';
  if ((prev === 'fail' || prev === 'blocked') && next === 'pass') return 'fixed';
  if (prev === 'pending' && (next === 'fail' || next === 'blocked')) return 'new_fail';
  return 'other';
}

export function compareRuns(scenario: Scenario, runA: Run, runB: Run): RunDiffEntry[] {
  const entries: RunDiffEntry[] = [];

  for (const section of scenario.sections) {
    for (const item of section.items) {
      const runAStatus = runA.results[item.id]?.status || 'pending';
      const runBStatus = runB.results[item.id]?.status || 'pending';
      const category = categorizeDiff(runAStatus, runBStatus);
      entries.push({ item, sectionTitle: section.title, runAStatus, runBStatus, category });
    }
  }

  return entries;
}

export function getDiffSummary(entries: RunDiffEntry[]) {
  return {
    regression: entries.filter(e => e.category === 'regression').length,
    fixed: entries.filter(e => e.category === 'fixed').length,
    newFail: entries.filter(e => e.category === 'new_fail').length,
    unchanged: entries.filter(e => e.category === 'unchanged').length,
    other: entries.filter(e => e.category === 'other').length,
  };
}

export function generateDiffMarkdown(
  scenario: Scenario,
  runA: Run,
  runB: Run,
  entries: RunDiffEntry[],
): string {
  const summary = getDiffSummary(entries);
  const lines: string[] = [];

  lines.push(`# Porównanie sesji: ${scenario.meta.title}`);
  lines.push('');
  lines.push(`- **Sesja A:** ${runA.meta.name || runA.meta.startedAt}`);
  lines.push(`- **Sesja B:** ${runB.meta.name || runB.meta.startedAt}`);
  lines.push(`- **Regresje:** ${summary.regression} · **Naprawione:** ${summary.fixed} · **Nowe fail:** ${summary.newFail}`);
  lines.push('');

  const interesting = entries.filter(e => e.category !== 'unchanged');
  if (interesting.length === 0) {
    lines.push('Brak różnic w statusach.');
    return lines.join('\n');
  }

  for (const entry of interesting) {
    const label = {
      regression: 'REGRESJA',
      fixed: 'NAPRAWIONE',
      new_fail: 'NOWY FAIL',
      other: 'ZMIANA',
      unchanged: '',
    }[entry.category];
    lines.push(`- **${label}** [${entry.runAStatus} → ${entry.runBStatus}] ${entry.sectionTitle} — ${entry.item.title}`);
  }

  return lines.join('\n');
}

export function buildRetestResults(
  scenario: Scenario,
  sourceRun: Run,
  onlyFailed: boolean,
): Record<string, { status: Status; notes: string; screenshots: never[] }> {
  const results: Record<string, { status: Status; notes: string; screenshots: never[] }> = {};
  for (const item of getAllItems(scenario)) {
    const prev = sourceRun.results[item.id];
    const prevStatus = prev?.status || 'pending';
    if (onlyFailed) {
      results[item.id] = {
        status: prevStatus === 'fail' || prevStatus === 'blocked' ? 'pending' : prevStatus,
        notes: '',
        screenshots: [],
      };
    } else if (prevStatus === 'pass' || prevStatus === 'skipped') {
      results[item.id] = { status: prevStatus, notes: '', screenshots: [] };
    } else {
      results[item.id] = { status: 'pending', notes: '', screenshots: [] };
    }
  }
  return results;
}
