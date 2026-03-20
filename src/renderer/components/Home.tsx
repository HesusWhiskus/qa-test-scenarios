import { useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import { FilePlus, FolderOpen, Clock, FileText, LayoutTemplate, ArrowRight } from 'lucide-react';
import { builtinTemplates } from '../lib/templates';

const templateColors = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',
];

export function Home() {
  const { openScenario, newScenario, loadFromTemplate, openRecentFile, recentFiles } = useScenario();
  const [title, setTitle] = useState('');
  const [showNew, setShowNew] = useState(false);

  const handleCreate = () => {
    if (title.trim()) {
      newScenario(title.trim());
      setTitle('');
      setShowNew(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5">QA Test Scenarios</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Zarządzaj scenariuszami testowymi, wykonuj testy, eksportuj raporty
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-10">
        <button
          onClick={() => setShowNew(true)}
          className="group flex flex-col items-center gap-2.5 p-5 rounded-xl bg-white dark:bg-slate-900 shadow-card hover:shadow-elevated border border-slate-200/60 dark:border-slate-800 transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FilePlus size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nowy scenariusz</span>
        </button>
        <button
          onClick={openScenario}
          className="group flex flex-col items-center gap-2.5 p-5 rounded-xl bg-white dark:bg-slate-900 shadow-card hover:shadow-elevated border border-slate-200/60 dark:border-slate-800 transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FolderOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Otwórz plik</span>
        </button>
      </div>

      {showNew && (
        <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200/60 dark:border-slate-800 animate-fade-in">
          <label className="block text-xs font-medium mb-2 text-slate-500">Nazwa scenariusza</label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="np. Profil Agenta - testy regresyjne"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Utwórz
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              Anuluj
            </button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
          <LayoutTemplate size={14} /> Szablony
        </h2>
        <div className="space-y-2">
          {builtinTemplates.map((tpl, i) => (
            <button
              key={tpl.id}
              onClick={() => loadFromTemplate(tpl.scenario)}
              className="group w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 transition-all duration-200 text-left"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${templateColors[i % templateColors.length]} flex items-center justify-center flex-shrink-0`}>
                <LayoutTemplate size={14} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{tpl.title}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tpl.description}</div>
              </div>
              <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {recentFiles.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
            <Clock size={14} /> Ostatnio otwierane
          </h2>
          <div className="space-y-1">
            {recentFiles.map(filePath => (
              <button
                key={filePath}
                onClick={() => openRecentFile(filePath)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-900 hover:shadow-xs transition-all duration-150 text-left"
              >
                <FileText size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate text-slate-700 dark:text-slate-300">{filePath.split(/[/\\]/).pop()}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-600 truncate">{filePath}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
