import { useScenario, type View } from '../hooks/useScenario';
import {
  Home, FileEdit, Play, History, FileDown,
  Save, FolderOpen, Copy, HelpCircle, FlaskConical, SlidersHorizontal,
} from 'lucide-react';

const navItems: { view: View; icon: typeof Home; label: string; needsScenario: boolean }[] = [
  { view: 'home', icon: Home, label: 'Start', needsScenario: false },
  { view: 'editor', icon: FileEdit, label: 'Edytor', needsScenario: true },
  { view: 'runs', icon: History, label: 'Przebiegi', needsScenario: true },
  { view: 'runner', icon: Play, label: 'Wykonanie', needsScenario: true },
  { view: 'export', icon: FileDown, label: 'Eksport', needsScenario: true },
  { view: 'help', icon: HelpCircle, label: 'Pomoc', needsScenario: false },
  { view: 'settings', icon: SlidersHorizontal, label: 'Ustawienia', needsScenario: false },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const ctx = useScenario();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="w-56 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xs">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <FlaskConical size={15} className="text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">QA Scenarios</span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ view, icon: Icon, label, needsScenario }) => {
            const disabled = needsScenario && !ctx.scenario;
            const needsRun = view === 'runner' || view === 'export';
            const runMissing = needsRun && !ctx.currentRunId;
            const active = ctx.currentView === view;

            return (
              <button
                key={view}
                onClick={() => !disabled && !runMissing && ctx.navigate(view)}
                disabled={disabled || runMissing}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium shadow-xs'
                    : disabled || runMissing
                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>

        {ctx.scenario && (
          <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
            <button onClick={ctx.saveScenario} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors">
              <Save size={15} /> Zapisz {ctx.isDirty && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </button>
            <button onClick={ctx.saveAsScenario} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors">
              <FolderOpen size={15} /> Zapisz jako...
            </button>
            <button onClick={ctx.duplicateScenario} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 transition-colors">
              <Copy size={15} /> Duplikuj
            </button>
          </div>
        )}

      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
