import { useEffect, useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import { FilePlus, FolderOpen, LayoutTemplate, ArrowRight, ListChecks, Search, FileSpreadsheet } from 'lucide-react';
import { loadCatalogEntries, groupByFolder, formatFolderName, type CatalogEntry } from '../lib/scenario-catalog';
import { filterCatalogEntries } from '../lib/catalog-filter';

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
          {entry.isStub ? (
            <span className="text-amber-600 dark:text-amber-400">W przygotowaniu</span>
          ) : (
            <span className="flex items-center gap-1">
              <ListChecks size={11} /> {entry.stepCount} {entry.stepCount === 1 ? 'krok' : entry.stepCount < 5 ? 'kroki' : 'kroków'}
            </span>
          )}
        </div>
      </div>
      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 flex-shrink-0" />
    </button>
  );
}

export function LibraryCatalog() {
  const { newScenario, loadFromTemplate, openScenario, importExcelScenario } = useScenario();
  const [readyEntries, setReadyEntries] = useState<CatalogEntry[]>([]);
  const [stubEntries, setStubEntries] = useState<CatalogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    Promise.all([
      loadCatalogEntries({ includeStubs: false }),
      loadCatalogEntries({ includeStubs: true }),
    ]).then(([allReady, allWithStubs]) => {
      setReadyEntries(allReady);
      setStubEntries(allWithStubs.filter(e => e.isStub));
    });
  }, []);

  const ready = groupByFolder(filterCatalogEntries(readyEntries, search));
  const stubs = groupByFolder(filterCatalogEntries(stubEntries, search));

  const handleCreate = () => {
    if (title.trim()) {
      newScenario(title.trim());
      setTitle('');
      setShowNew(false);
    }
  };

  const renderFolders = (grouped: Record<string, CatalogEntry[]>, startIdx: number) => {
    const keys = Object.keys(grouped).sort((a, b) => formatFolderName(a).localeCompare(formatFolderName(b), 'pl'));
    let idx = startIdx;
    return keys.map(folder => (
      <div key={folder} className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
          <LayoutTemplate size={14} /> {formatFolderName(folder)}
        </h2>
        <div className="space-y-2">
          {grouped[folder].map(entry => (
            <CatalogCard
              key={entry.id}
              entry={entry}
              colorIndex={idx++}
              onSelect={() => loadFromTemplate(entry.scenario)}
            />
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight">Katalog scenariuszy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Twórz, edytuj i importuj scenariusze testowe
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => setShowNew(true)}
          className="flex flex-col items-center gap-2 p-5 rounded-lg bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
            <FilePlus size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium">Nowy scenariusz</span>
        </button>
        <button
          onClick={openScenario}
          className="flex flex-col items-center gap-2 p-5 rounded-lg bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
            <FolderOpen size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-medium">Importuj JSON</span>
        </button>
        <button
          onClick={importExcelScenario}
          className="flex flex-col items-center gap-2 p-5 rounded-lg bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
            <FileSpreadsheet size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-sm font-medium">Importuj Excel</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj scenariuszy…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {showNew && (
        <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-800">
          <label className="block text-xs font-medium mb-2 text-slate-500">Nazwa scenariusza</label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="np. Profil Agenta - testy regresyjne"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Utwórz</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">Anuluj</button>
          </div>
        </div>
      )}

      {renderFolders(ready, 0)}

      {Object.keys(stubs).length > 0 && (
        <div className="mt-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-4">
            Kategorie w przygotowaniu
          </h2>
          {renderFolders(stubs, 20)}
        </div>
      )}
    </div>
  );
}
