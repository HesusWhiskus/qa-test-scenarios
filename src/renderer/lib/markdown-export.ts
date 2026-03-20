import type { Scenario, Run } from '../types/schema';
import { getRunStats } from '../types/schema';

export function generateMarkdown(scenario: Scenario, run: Run): string {
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
    const heading = section.level === 1 ? '##' : '###';
    lines.push(`${heading} ${section.title}`);
    lines.push('');

    for (const item of section.items) {
      const result = run.results[item.id];
      const status = result?.status || 'pending';
      const checked = status === 'pass' ? 'x' : ' ';

      let statusLabel = '';
      if (status === 'fail') statusLabel = ' **FAIL**';
      else if (status === 'blocked') statusLabel = ' **BLOCKED**';
      else if (status === 'skipped') statusLabel = ' ~~SKIPPED~~';

      lines.push(`- [${checked}]${statusLabel} ${item.title}`);

      if (result?.notes) {
        for (const noteLine of result.notes.split('\n')) {
          lines.push(`  > ${noteLine}`);
        }
      }
      if (result?.screenshots?.length) {
        for (const ss of result.screenshots) {
          const caption = ss.caption || ss.filename;
          lines.push(`  > ![${caption}](${ss.filename})`);
        }
      }
      if (item.link) {
        lines.push(`  > Issue: [${item.link}](${item.link})`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
