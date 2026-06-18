import { useMemo, useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import { generateMarkdown } from '../lib/markdown-export';
import * as ipc from '../lib/ipc';
import { Download, Copy, Check } from 'lucide-react';

export function ExportView() {
  const { scenario, getCurrentRun } = useScenario();
  const run = getCurrentRun();
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => {
    if (!scenario || !run) return '';
    return generateMarkdown(scenario, run);
  }, [scenario, run]);

  if (!scenario || !run) {
    return <div className="p-8 text-center text-slate-400">Nie wybrano przebiegu do eksportu.</div>;
  }

  const handleExport = async () => {
    const safeName = scenario.meta.title.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ _-]/g, '_');
    await ipc.exportMarkdown(markdown, `${safeName}_report.md`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Raport Markdown</h2>
        <div className="flex gap-2">
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
            <Download size={15} /> Zapisz plik .md
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
