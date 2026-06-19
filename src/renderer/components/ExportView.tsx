import { useMemo, useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import { generateMarkdown, buildYouTrackDescription } from '../lib/markdown-export';
import type { ExportMode } from '../lib/markdown-export';
import { getAllItems } from '../types/schema';
import * as ipc from '../lib/ipc';
import { Download, Copy, Check, Bug } from 'lucide-react';

export function ExportView() {
  const { scenario, getCurrentRun, showFlash, appSettings, updateItem } = useScenario();
  const run = getCurrentRun();
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<ExportMode>('full');
  const [bulkProgress, setBulkProgress] = useState<string | null>(null);

  const markdown = useMemo(() => {
    if (!scenario || !run) return '';
    return generateMarkdown(scenario, run, mode);
  }, [scenario, run, mode]);

  if (!scenario || !run) {
    return <div className="p-8 text-center text-slate-400">Nie wybrano przebiegu do eksportu.</div>;
  }

  const youtrackConfigured = !!(appSettings?.youtrack.baseUrl && appSettings?.youtrack.projectId);

  const handleExport = async () => {
    const safeName = scenario.meta.title.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ _-]/g, '_');
    const suffix = mode === 'failuresOnly' ? '_failures' : '_report';
    await ipc.exportMarkdown(markdown, `${safeName}${suffix}.md`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBulkYouTrack = async () => {
    if (!youtrackConfigured) {
      showFlash('Skonfiguruj YouTrack w Ustawieniach.');
      return;
    }

    const items = getAllItems(scenario);
    const toCreate = items.filter(item => {
      const status = run.results[item.id]?.status;
      return (status === 'fail' || status === 'blocked') && !item.link;
    });

    if (toCreate.length === 0) {
      showFlash('Brak fail/blocked bez przypisanego issue.');
      return;
    }

    if (!confirm(`Utworzyć ${toCreate.length} ticketów w YouTrack?`)) return;

    let created = 0;
    for (const item of toCreate) {
      const section = scenario.sections.find(s => s.items.some(i => i.id === item.id));
      if (!section) continue;

      setBulkProgress(`${created + 1}/${toCreate.length}: ${item.title.slice(0, 40)}…`);
      const prefix = item.testCaseId ? `[${item.testCaseId}] ` : '';
      const result = run.results[item.id];
      const issue = await ipc.youtrackCreateIssue({
        summary: `${prefix}${item.title}`.slice(0, 255),
        description: buildYouTrackDescription(scenario, run, section, item),
        environment: run.meta.environment,
        buildVersion: run.meta.buildVersion,
        attachments: result?.screenshots?.map(ss => ({ filename: ss.filename })),
      });

      if (!('error' in issue)) {
        updateItem(section.id, item.id, { link: issue.url });
        created++;
      }
    }

    setBulkProgress(null);
    showFlash(`Utworzono ${created}/${toCreate.length} ticketów w YouTrack. Zapisz scenariusz, aby zachować linki.`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Raport Markdown</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
            <button
              onClick={() => setMode('full')}
              className={`px-3 py-1.5 ${mode === 'full' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'}`}
            >
              Pełny
            </button>
            <button
              onClick={() => setMode('failuresOnly')}
              className={`px-3 py-1.5 ${mode === 'failuresOnly' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500'}`}
            >
              Tylko problemy
            </button>
          </div>
          {youtrackConfigured && (
            <button
              onClick={handleBulkYouTrack}
              disabled={!!bulkProgress}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50"
            >
              <Bug size={15} /> {bulkProgress || 'Tickety YouTrack'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm shadow-xs transition-colors"
          >
            {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            {copied ? 'Skopiowano!' : 'Kopiuj'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm shadow-xs font-medium transition-colors"
          >
            <Download size={15} /> Zapisz .md
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200/60 dark:border-slate-800 p-5">
        <pre className="whitespace-pre-wrap text-[13px] font-mono leading-relaxed text-slate-600 dark:text-slate-400">
          {markdown}
        </pre>
      </div>
    </div>
  );
}
