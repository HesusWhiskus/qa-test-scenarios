import { useEffect, useState } from 'react';
import { History, Play, FolderOpen } from 'lucide-react';
import * as ipc from '../lib/ipc';
import type { SavedScenarioSummary } from '../lib/ipc';

interface SavedTestsPanelProps {
  onOpen: (filePath: string) => void;
  compact?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function runLabel(summary: SavedScenarioSummary): string {
  const run = summary.lastRun;
  if (!run) return 'Brak sesji';
  const name = run.name || formatDate(run.startedAt);
  const { done, total } = run.progress;
  if (total > 0) return `${name} — ${done}/${total} kroków`;
  return name;
}

export function SavedTestsPanel({ onOpen, compact }: SavedTestsPanelProps) {
  const [items, setItems] = useState<SavedScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ipc.listSavedScenarios()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-slate-400 py-4 text-center">Ładowanie zapisanych testów…</div>
    );
  }

  if (items.length === 0) return null;

  const withSessions = items.filter(i => i.runCount > 0);
  const display = withSessions.length > 0 ? withSessions : items;

  return (
    <div className={compact ? 'mb-6' : 'mb-8'}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
          <History size={14} /> Kontynuuj testowanie
        </h2>
        <button
          type="button"
          onClick={() => ipc.openScenariosDir()}
          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
          title="Otwórz folder z zapisanymi scenariuszami"
        >
          <FolderOpen size={12} /> Folder danych
        </button>
      </div>
      <div className="space-y-2">
        {display.map(item => {
          const inProgress = item.activeRunCount > 0;
          const completed = item.lastRun?.completedAt;
          return (
            <button
              key={item.filePath}
              type="button"
              onClick={() => onOpen(item.filePath)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                inProgress
                  ? 'bg-emerald-50 dark:bg-emerald-950/50'
                  : 'bg-slate-50 dark:bg-slate-800'
              }`}>
                <Play size={16} className={inProgress ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.title}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {runLabel(item)}
                  {item.runCount > 1 && ` · ${item.runCount} sesji`}
                </div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                inProgress
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : completed
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
              }`}>
                {inProgress ? 'W toku' : completed ? 'Zakończona' : 'Gotowy'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
