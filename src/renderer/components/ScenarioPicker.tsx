import { useEffect, useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import { FolderOpen, LayoutTemplate, ArrowRight, ListChecks } from 'lucide-react';
import { loadCatalogEntries, groupByFolder, formatFolderName, type CatalogEntry } from '../lib/scenario-catalog';
import { SavedTestsPanel } from './SavedTestsPanel';

const templateColors = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',
];

function CatalogCard({ entry, colorIndex, onSelect }: { entry: CatalogEntry; colorIndex: number; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group w-full flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 transition-shadow text-left"
    >
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${templateColors[colorIndex % templateColors.length]} flex items-center justify-center flex-shrink-0`}>
        <LayoutTemplate size={14} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{entry.title}</div>
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
          {entry.description && <span className="truncate">{entry.description}</span>}
          <span className="flex-shrink-0 flex items-center gap-1">
            <ListChecks size={11} /> {entry.stepCount} {entry.stepCount === 1 ? 'krok' : entry.stepCount < 5 ? 'kroki' : 'kroków'}
          </span>
        </div>
      </div>
      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </button>
  );
}

export function ScenarioPicker() {
  const { loadFromTemplate, openScenario, openSavedScenario } = useScenario();
  const [grouped, setGrouped] = useState<Record<string, CatalogEntry[]>>({});

  useEffect(() => {
    loadCatalogEntries({ includeStubs: false }).then(entries => {
      setGrouped(groupByFolder(entries));
    });
  }, []);

  const folderKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'builtin') return -1;
    if (b === 'builtin') return 1;
    return formatFolderName(a).localeCompare(formatFolderName(b), 'pl');
  });

  let colorIdx = 0;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Wybierz scenariusz</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kontynuuj zapisany test lub wybierz nowy scenariusz z katalogu
        </p>
      </div>

      <SavedTestsPanel onOpen={openSavedScenario} />

      {folderKeys.map(folder => (
        <div key={folder} className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
            <LayoutTemplate size={14} />
            {folder === 'builtin' ? 'Szablony' : formatFolderName(folder)}
          </h2>
          <div className="space-y-2">
            {grouped[folder].map(entry => (
              <CatalogCard
                key={entry.id}
                entry={entry}
                colorIndex={colorIdx++}
                onSelect={() => loadFromTemplate(entry.scenario)}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={openScenario}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <FolderOpen size={15} />
        Importuj plik z dysku…
      </button>
    </div>
  );
}
