import { useScenario } from '../hooks/useScenario';
import { History, Play, X } from 'lucide-react';

export function OpenDialog() {
  const { pendingOpen, confirmOpen, confirmOpenNewRun, cancelOpen, appMode } = useScenario();

  if (!pendingOpen || appMode !== 'testing') return null;

  const { scenario } = pendingOpen;
  const runCount = scenario.runs?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-float w-full max-w-md mx-4 overflow-hidden border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{scenario.meta.title}</h2>
          <button onClick={cancelOpen} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Ten scenariusz ma {runCount} {runCount === 1 ? 'sesję' : runCount < 5 ? 'sesje' : 'sesji'} testowych. Co chcesz zrobić?
          </p>

          <div className="space-y-2">
            <button
              onClick={() => confirmOpen('runs')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                <History size={17} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-slate-700 dark:text-slate-300">Przejdź do sesji</div>
                <div className="text-[11px] text-slate-400">Kontynuuj testowanie lub zobacz historię</div>
              </div>
            </button>

            <button
              onClick={confirmOpenNewRun}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                <Play size={17} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="font-medium text-sm text-slate-700 dark:text-slate-300">Nowa sesja testowa</div>
                <div className="text-[11px] text-slate-400">Rozpocznij nową rundę testów</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
