import { ThemeProvider } from './hooks/useTheme';
import { ScenarioProvider, useScenario } from './hooks/useScenario';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Editor } from './components/Editor';
import { RunList } from './components/RunList';
import { Runner } from './components/Runner';
import { ExportView } from './components/ExportView';
import { Help } from './components/Help';
import { OpenDialog } from './components/OpenDialog';

function AppContent() {
  const { currentView } = useScenario();
  switch (currentView) {
    case 'home': return <Home />;
    case 'editor': return <Editor />;
    case 'runs': return <RunList />;
    case 'runner': return <Runner />;
    case 'export': return <ExportView />;
    case 'help': return <Help />;
  }
}

export function App() {
  return (
    <ThemeProvider>
      <ScenarioProvider>
        <Layout>
          <AppContent />
        </Layout>
        <OpenDialog />
      </ScenarioProvider>
    </ThemeProvider>
  );
}
