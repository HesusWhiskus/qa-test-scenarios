import { useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import { getRunStats, getAllItems } from '../types/schema';
import { ProgressBar } from './shared/ProgressBar';
import { Plus, Play, FileDown, Trash2, CheckCircle, FileText } from 'lucide-react';

export function RunList() {
  const { scenario, filePath, navigate, createNewRun, deleteRun, completeRun } = useScenario();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', environment: '', buildVersion: '', tester: '' });

  if (!scenario) return null;

  const handleCreate = () => {
    createNewRun(form);
    setShowNew(false);
    setForm({ name: '', environment: '', buildVersion: '', tester: '' });
  };

  const runs = [...scenario.runs].reverse();
  const totalItems = getAllItems(scenario).length;
  const totalSections = scenario.sections.length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{scenario.meta.title}</h2>
            {scenario.meta.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{scenario.meta.description}</p>
            )}
            <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-400">
              <span>{totalSections} {totalSections === 1 ? 'sekcja' : totalSections < 5 ? 'sekcje' : 'sekcji'}</span>
              <span>{totalItems} {totalItems === 1 ? 'krok' : totalItems < 5 ? 'kroki' : 'kroków'}</span>
              {filePath && <span className="truncate max-w-xs" title={filePath}>{filePath.split(/[/\\]/).pop()}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex-shrink-0 font-medium shadow-xs transition-colors"
          >
            <Plus size={15} /> Nowy przebieg
          </button>
        </div>
      </div>

      {showNew && (
        <div className="mb-6 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-800">
          <h3 className="font-semibold text-sm mb-3 text-slate-800 dark:text-slate-200">Nowy przebieg</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { key: 'name', label: 'Nazwa (opcjonalnie)', placeholder: 'np. Regresja sprint 42' },
              { key: 'environment', label: 'Środowisko', placeholder: 'np. staging, production' },
              { key: 'buildVersion', label: 'Wersja buildu', placeholder: 'np. 2.4.1' },
              { key: 'tester', label: 'Tester', placeholder: 'np. Jan Kowalski' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-[11px] font-medium mb-1 text-slate-400">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">Rozpocznij przebieg</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-sm transition-colors">Anuluj</button>
          </div>
        </div>
      )}

      {runs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Play size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Brak przebiegów. Utwórz pierwszy przebieg, aby rozpocząć testowanie.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {runs.map(run => {
            const stats = getRunStats(run, scenario);
            const isComplete = !!run.meta.completedAt;
            return (
              <div key={run.id} className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-800 hover:shadow-card transition-shadow">
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {run.meta.name || `Przebieg ${new Date(run.meta.startedAt).toLocaleString('pl-PL')}`}
                    </h3>
                    <div className="text-[11px] text-slate-400 flex gap-3 mt-0.5">
                      {run.meta.environment && <span>Env: {run.meta.environment}</span>}
                      {run.meta.buildVersion && <span>Build: {run.meta.buildVersion}</span>}
                      {run.meta.tester && <span>Tester: {run.meta.tester}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isComplete && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mr-1">
                        <CheckCircle size={13} /> Zakończony
                      </span>
                    )}
                    <button
                      onClick={() => navigate('runner', run.id)}
                      className="px-2.5 py-1 text-[13px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/60 font-medium transition-colors"
                    >
                      <Play size={13} className="inline mr-1" />{isComplete ? 'Podgląd' : 'Kontynuuj'}
                    </button>
                    <button
                      onClick={() => navigate('export', run.id)}
                      className="px-2.5 py-1 text-[13px] bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <FileDown size={13} className="inline mr-1" />Eksport
                    </button>
                    {!isComplete && (
                      <button
                        onClick={() => completeRun(run.id)}
                        className="px-2.5 py-1 text-[13px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors"
                      >
                        Zakończ
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Usunąć ten przebieg?')) deleteRun(run.id); }}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <ProgressBar {...stats} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
