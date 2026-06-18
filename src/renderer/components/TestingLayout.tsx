import { useScenario } from '../hooks/useScenario';
import {
  List, History, ClipboardCheck, FileDown, HelpCircle, SlidersHorizontal,
  FlaskConical, ArrowLeft, FileEdit, ScrollText,
} from 'lucide-react';
import { AppVersionFooter } from './AppVersionFooter';
import type { View } from '../hooks/useScenario';

const testingNav: { view: View; icon: typeof List; label: string; needsScenario: boolean; needsRun?: boolean; title?: string }[] = [
  { view: 'picker', icon: List, label: 'Scenariusze', needsScenario: false },
  { view: 'runs', icon: History, label: 'Sesje testowe', needsScenario: true },
  { view: 'runner', icon: ClipboardCheck, label: 'Checklista', needsScenario: true, needsRun: true },
  { view: 'export', icon: FileDown, label: 'Raport', needsScenario: true, needsRun: true },
];

export function TestingLayout({ children }: { children: React.ReactNode }) {
  const ctx = useScenario();
  const run = ctx.getCurrentRun();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="w-56 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xs">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FlaskConical size={15} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Centrum testów</span>
          </div>
          {ctx.scenario && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={ctx.scenario.meta.title}>
              {ctx.scenario.meta.title}
            </div>
          )}
          {run && (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5">
              {run.meta.name || 'Bieżąca sesja'}
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {testingNav.map(({ view, icon: Icon, label, needsScenario, needsRun }) => {
            const disabled = needsScenario && !ctx.scenario;
            const runMissing = needsRun && !ctx.currentRunId;
            const active = ctx.currentView === view;

            return (
              <button
                key={view}
                onClick={() => !disabled && !runMissing && ctx.navigate(view)}
                disabled={disabled || runMissing}
                title={runMissing ? 'Najpierw utwórz lub wybierz sesję testową' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  active
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium shadow-xs'
                    : disabled || runMissing
                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="p-2 space-y-0.5 border-t border-slate-100 dark:border-slate-800">
          {ctx.scenario && (
            <button
              onClick={ctx.switchToLibraryForEdit}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <FileEdit size={14} /> Edytuj w Bibliotece
            </button>
          )}
          <button onClick={() => ctx.navigate('help')} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <HelpCircle size={15} /> Pomoc
          </button>
          <button onClick={() => ctx.navigate('changelog')} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <ScrollText size={15} /> Historia zmian
          </button>
          <button onClick={() => ctx.navigate('settings')} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <SlidersHorizontal size={15} /> Ustawienia
          </button>
          <button onClick={ctx.returnToHub} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 mt-1">
            <ArrowLeft size={15} /> Powrót do Start
          </button>
          <AppVersionFooter className="pt-2" onOpenChangelog={() => ctx.navigate('changelog')} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col">
        {ctx.flashMessage && (
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-sm text-amber-800 dark:text-amber-200">
            {ctx.flashMessage}
          </div>
        )}
        {ctx.completedRunId && ctx.currentView === 'runs' && (
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-4">
            <span className="text-sm text-emerald-800 dark:text-emerald-200">Sesja zakończona. Wyeksportuj raport do YouTrack?</span>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { ctx.navigate('export', ctx.completedRunId); ctx.dismissCompletedBanner(); }}
                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                Eksportuj raport
              </button>
              <button onClick={ctx.dismissCompletedBanner} className="px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300 hover:underline">
                Później
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
