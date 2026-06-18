import { useScenario } from '../hooks/useScenario';
import {
  LayoutGrid, FileEdit, FolderOpen, Save, Copy, HelpCircle, SlidersHorizontal,
  FlaskConical, ArrowLeft, ScrollText,
} from 'lucide-react';
import { AppVersionFooter } from './AppVersionFooter';
import type { View } from '../hooks/useScenario';

const libraryNav: { view: View; icon: typeof LayoutGrid; label: string; needsScenario: boolean }[] = [
  { view: 'catalog', icon: LayoutGrid, label: 'Katalog', needsScenario: false },
  { view: 'editor', icon: FileEdit, label: 'Edytor struktury', needsScenario: true },
];

export function LibraryLayout({ children }: { children: React.ReactNode }) {
  const ctx = useScenario();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="w-56 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xs">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <FlaskConical size={15} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Biblioteka</span>
          </div>
          {ctx.scenario && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={ctx.scenario.meta.title}>
              {ctx.scenario.meta.title}
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {libraryNav.map(({ view, icon: Icon, label, needsScenario }) => {
            const disabled = needsScenario && !ctx.scenario;
            const active = ctx.currentView === view;

            return (
              <button
                key={view}
                onClick={() => !disabled && ctx.navigate(view)}
                disabled={disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium shadow-xs'
                    : disabled
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

        {ctx.scenario && (
          <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
            <button onClick={ctx.saveScenario} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <Save size={15} /> Zapisz {ctx.isDirty && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </button>
            <button onClick={ctx.saveAsScenario} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <FolderOpen size={15} /> Zapisz jako...
            </button>
            <button onClick={ctx.duplicateScenario} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <Copy size={15} /> Duplikuj
            </button>
          </div>
        )}

        <div className="p-2 space-y-0.5 border-t border-slate-100 dark:border-slate-800">
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
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
