import { ThemeProvider } from './hooks/useTheme';
import { ScenarioProvider, useScenario } from './hooks/useScenario';
import { Hub } from './components/Hub';
import { ScenarioPicker } from './components/ScenarioPicker';
import { LibraryCatalog } from './components/LibraryCatalog';
import { Editor } from './components/Editor';
import { RunList } from './components/RunList';
import { Runner } from './components/Runner';
import { ExportView } from './components/ExportView';
import { Help } from './components/Help';
import { Settings } from './components/Settings';
import { ChangelogView } from './components/ChangelogView';
import { OpenDialog } from './components/OpenDialog';
import { TestingLayout } from './components/TestingLayout';
import { LibraryLayout } from './components/LibraryLayout';

function TestingContent() {
  const { currentView } = useScenario();
  switch (currentView) {
    case 'picker': return <ScenarioPicker />;
    case 'runs': return <RunList />;
    case 'runner': return <Runner />;
    case 'export': return <ExportView />;
    case 'help': return <Help mode="testing" />;
    case 'settings': return <Settings />;
    case 'changelog': return <ChangelogView />;
    default: return <ScenarioPicker />;
  }
}

function LibraryContent() {
  const { currentView } = useScenario();
  switch (currentView) {
    case 'catalog': return <LibraryCatalog />;
    case 'editor': return <Editor />;
    case 'help': return <Help mode="library" />;
    case 'settings': return <Settings />;
    case 'changelog': return <ChangelogView />;
    default: return <LibraryCatalog />;
  }
}

function AppShell() {
  const { appMode, currentView, flashMessage } = useScenario();

  if (appMode === 'hub') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        {flashMessage && (
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 text-sm text-amber-800">
            {flashMessage}
          </div>
        )}
        {currentView === 'changelog' ? <ChangelogView /> : <Hub />}
      </div>
    );
  }

  if (appMode === 'testing') {
    return (
      <TestingLayout>
        <TestingContent />
      </TestingLayout>
    );
  }

  return (
    <LibraryLayout>
      <LibraryContent />
    </LibraryLayout>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ScenarioProvider>
        <AppShell />
        <OpenDialog />
      </ScenarioProvider>
    </ThemeProvider>
  );
}
