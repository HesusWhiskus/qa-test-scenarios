import type { Scenario, Run, Item, Section } from '../types/schema';
import { getRunStats } from '../types/schema';

export type ExportMode = 'full' | 'failuresOnly';

export function generateMarkdown(scenario: Scenario, run: Run, mode: ExportMode = 'full'): string {
  const stats = getRunStats(run, scenario);
  const lines: string[] = [];

  lines.push(`# QA Report: ${scenario.meta.title}`);
  lines.push('');

  if (run.meta.environment) lines.push(`- **Środowisko:** ${run.meta.environment}`);
  if (run.meta.buildVersion) lines.push(`- **Build:** ${run.meta.buildVersion}`);
  if (run.meta.tester) lines.push(`- **Tester:** ${run.meta.tester}`);
  lines.push(`- **Data:** ${new Date(run.meta.startedAt).toLocaleDateString('pl-PL')}`);
  if (run.meta.completedAt) {
    lines.push(`- **Zakończono:** ${new Date(run.meta.completedAt).toLocaleDateString('pl-PL')}`);
  }

  const resultParts: string[] = [];
  if (stats.pass) resultParts.push(`${stats.pass} passed`);
  if (stats.fail) resultParts.push(`${stats.fail} failed`);
  if (stats.blocked) resultParts.push(`${stats.blocked} blocked`);
  if (stats.skipped) resultParts.push(`${stats.skipped} skipped`);
  if (stats.pending) resultParts.push(`${stats.pending} pending`);
  lines.push(`- **Wynik:** ${stats.pass}/${stats.total} passed (${resultParts.join(', ')})`);
  lines.push('');

  if (scenario.meta.description) {
    lines.push(scenario.meta.description);
    lines.push('');
  }

  for (const section of scenario.sections) {
    const sectionLines = renderSection(section, run, mode);
    if (sectionLines.length === 0) continue;
    lines.push(...sectionLines);
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function renderSection(section: Section, run: Run, mode: ExportMode): string[] {
  const lines: string[] = [];
  const itemLines: string[] = [];

  for (const item of section.items) {
    const block = renderItem(item, run, mode);
    if (block.length > 0) itemLines.push(...block);
  }

  if (itemLines.length === 0) return [];

  const heading = section.level === 1 ? '##' : '###';
  lines.push(`${heading} ${section.title}`);
  lines.push('');
  lines.push(...itemLines);
  return lines;
}

function renderItem(item: Item, run: Run, mode: ExportMode): string[] {
  const result = run.results[item.id];
  const status = result?.status || 'pending';

  if (mode === 'failuresOnly' && status !== 'fail' && status !== 'blocked') return [];

  const lines: string[] = [];
  const checked = status === 'pass' ? 'x' : ' ';

  let statusLabel = '';
  if (status === 'fail') statusLabel = ' **FAIL**';
  else if (status === 'blocked') statusLabel = ' **BLOCKED**';
  else if (status === 'skipped') statusLabel = ' ~~SKIPPED~~';

  const prefix = item.testCaseId ? `[${item.testCaseId}] ` : '';
  lines.push(`- [${checked}]${statusLabel} ${prefix}${item.title}`);

  if (item.preconditions) lines.push(`  > Warunki wstępne: ${item.preconditions}`);
  if (item.expectedResult) lines.push(`  > Oczekiwany rezultat: ${item.expectedResult}`);

  if (result?.notes) {
    for (const noteLine of result.notes.split('\n')) {
      lines.push(`  > ${noteLine}`);
    }
  }
  if (result?.screenshots?.length) {
    for (const ss of result.screenshots) {
      const caption = ss.caption || ss.filename;
      lines.push(`  > ![${caption}](${ss.relativePath || ss.filename})`);
    }
  }
  if (item.link) {
    lines.push(`  > Issue: [${item.link}](${item.link})`);
  }

  return lines;
}

export function buildYouTrackDescription(
  scenario: Scenario,
  run: Run,
  section: Section,
  item: Item,
): string {
  const result = run.results[item.id];
  const lines: string[] = [];

  lines.push(`**Scenariusz:** ${scenario.meta.title}`);
  lines.push(`**Sekcja:** ${section.title}`);
  lines.push(`**Krok:** ${item.title}`);
  if (item.testCaseId) lines.push(`**TC ID:** ${item.testCaseId}`);
  lines.push('');

  if (item.preconditions) {
    lines.push('**Warunki wstępne:**');
    lines.push(item.preconditions);
    lines.push('');
  }
  if (item.expectedResult) {
    lines.push('**Oczekiwany rezultat:**');
    lines.push(item.expectedResult);
    lines.push('');
  }
  if (result?.notes) {
    lines.push('**Notatki testera:**');
    lines.push(result.notes);
    lines.push('');
  }

  lines.push('**Metadane sesji:**');
  if (run.meta.tester) lines.push(`- Tester: ${run.meta.tester}`);
  if (run.meta.environment) lines.push(`- Środowisko: ${run.meta.environment}`);
  if (run.meta.buildVersion) lines.push(`- Build: ${run.meta.buildVersion}`);
  lines.push(`- Data: ${new Date(run.meta.startedAt).toLocaleString('pl-PL')}`);

  return lines.join('\n');
}
