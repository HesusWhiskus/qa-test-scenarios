import { useScenario } from '../hooks/useScenario';
import { Play, FileEdit } from 'lucide-react';
import { SavedTestsPanel } from './SavedTestsPanel';
import { AppVersionFooter } from './AppVersionFooter';

export function Hub() {
  const { enterTestingMode, enterLibraryMode, openSavedScenario, navigate } = useScenario();

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight mb-1.5">QA Test Scenarios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Wybierz, co chcesz zrobić
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <button
              onClick={enterTestingMode}
              className="group flex flex-col items-start gap-3 p-6 rounded-xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <Play size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-800 dark:text-slate-100">Centrum testów</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Wykonuj testy, oznaczaj kroki, eksportuj raport do YouTrack
                </div>
              </div>
            </button>

            <button
              onClick={enterLibraryMode}
              className="group flex flex-col items-start gap-3 p-6 rounded-xl bg-white dark:bg-slate-900 shadow-xs hover:shadow-card border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                <FileEdit size={22} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-800 dark:text-slate-100">Biblioteka scenariuszy</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Twórz i edytuj strukturę scenariuszy, importuj i eksportuj JSON
                </div>
              </div>
            </button>
          </div>

          <SavedTestsPanel onOpen={openSavedScenario} compact />
        </div>
      </div>
      <AppVersionFooter
        className="py-4 border-t border-slate-200/60 dark:border-slate-800"
        onOpenChangelog={() => navigate('changelog')}
      />
    </div>
  );
}
