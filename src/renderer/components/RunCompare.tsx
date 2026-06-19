import { useMemo, useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import { compareRuns, getDiffSummary, generateDiffMarkdown } from '../lib/run-diff';
import { formatRunDuration } from '../types/schema';
import { GitCompare, Copy, Check } from 'lucide-react';

export function RunCompare() {
  const { scenario } = useScenario();
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const [copied, setCopied] = useState(false);

  const runs = scenario?.runs || [];
  const runA = runs.find(r => r.id === runAId);
  const runB = runs.find(r => r.id === runBId);

  const diff = useMemo(() => {
    if (!scenario || !runA || !runB) return [];
    return compareRuns(scenario, runA, runB);
  }, [scenario, runA, runB]);

  const summary = useMemo(() => getDiffSummary(diff), [diff]);
  const interesting = diff.filter(e => e.category !== 'unchanged');

  if (!scenario || runs.length < 2) return null;

  const label = (r: typeof runs[0]) =>
    `${r.meta.name || new Date(r.meta.startedAt).toLocaleString('pl-PL')}${r.meta.completedAt ? '' : ' (w toku)'}`;

  const handleCopy = async () => {
    if (!runA || !runB) return;
    const md = generateDiffMarkdown(scenario, runA, runB, diff);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-800">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
        <GitCompare size={16} /> Porównaj sesje
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <select
          value={runAId}
          onChange={e => setRunAId(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">Sesja A (starsza)</option>
          {runs.map(r => <option key={r.id} value={r.id}>{label(r)}</option>)}
        </select>
        <select
          value={runBId}
          onChange={e => setRunBId(e.target.value)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-slate-50 dark:bg-slate-800"
        >
          <option value="">Sesja B (nowsza)</option>
          {runs.map(r => <option key={r.id} value={r.id}>{label(r)}</option>)}
        </select>
      </div>

      {runA && runB && runAId === runBId && (
        <p className="text-xs text-amber-600 mb-2">Wybierz dwie różne sesje.</p>
      )}

      {runA && runB && runAId !== runBId && (
        <>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mb-3">
            <span className="text-red-600">Regresje: {summary.regression}</span>
            <span className="text-emerald-600">Naprawione: {summary.fixed}</span>
            <span className="text-orange-600">Nowe fail: {summary.newFail}</span>
            <span>Inne zmiany: {summary.other}</span>
            {formatRunDuration(runB) && <span>Czas B: {formatRunDuration(runB)}</span>}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="mb-3 flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'Skopiowano diff' : 'Kopiuj diff jako Markdown'}
          </button>
          {interesting.length === 0 ? (
            <p className="text-sm text-slate-400">Brak różnic w statusach.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
              {interesting.map(entry => (
                <div key={entry.item.id} className="flex gap-2 py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className={`font-medium w-20 flex-shrink-0 ${
                    entry.category === 'regression' ? 'text-red-600' :
                    entry.category === 'fixed' ? 'text-emerald-600' :
                    entry.category === 'new_fail' ? 'text-orange-600' : 'text-slate-500'
                  }`}>
                    {entry.runAStatus}→{entry.runBStatus}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    {entry.sectionTitle} — {entry.item.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
