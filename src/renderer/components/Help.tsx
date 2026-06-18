import { BookOpen, FileEdit, Play, Download, Keyboard, FolderOpen, LayoutTemplate, ClipboardCheck, ScrollText } from 'lucide-react';
import { useScenario } from '../hooks/useScenario';

const testingSections = [
  {
    icon: LayoutTemplate,
    title: '1. Wybór scenariusza',
    content: [
      'Na ekranie Start wybierz Centrum testów.',
      'W zakładce Scenariusze wybierz gotowy scenariusz z katalogu lub otwórz plik .json z dysku.',
      'Scenariusz zostanie załadowany do trybu testowego — bez edycji struktury.',
    ],
  },
  {
    icon: Play,
    title: '2. Sesja testowa',
    content: [
      'W zakładce Sesje testowe kliknij „Nowa sesja" i podaj opcjonalne metadane (nazwa, środowisko, build, tester).',
      'Przy pierwszym teście z szablonu aplikacja poprosi o zapisanie pliku scenariusza na dysku.',
      'Po utworzeniu sesji przejdziesz automatycznie do Checklisty.',
    ],
  },
  {
    icon: ClipboardCheck,
    title: '3. Checklista',
    content: [
      'Oznaczaj kroki: pass, fail, blocked, skip — skróty P, F, B, S.',
      'Dodawaj notatki i screenshoty do poszczególnych kroków.',
      'Filtr „Regresja" pokazuje tylko sekcje oznaczone tagiem regresji.',
      'Przełączaj sesje z listy rozwijanej w nagłówku, gdy masz wiele rund testowych.',
    ],
  },
  {
    icon: Download,
    title: '4. Raport do YouTrack',
    content: [
      'Po zakończeniu sesji użyj przycisku „Eksportuj raport" lub przejdź do zakładki Raport.',
      'Skopiuj Markdown do schowka lub zapisz plik .md.',
    ],
  },
  {
    icon: Keyboard,
    title: '5. Skróty klawiszowe',
    content: [
      '↑ / ↓ lub K / J — nawigacja między krokami',
      'P — pass (i następny krok) · F — fail · B — blocked · S — skip',
      'N — rozwiń/zwiń notatki',
    ],
  },
];

const librarySections = [
  {
    icon: LayoutTemplate,
    title: '1. Katalog scenariuszy',
    content: [
      'Na ekranie Start wybierz Bibliotekę scenariuszy.',
      'Twórz nowy scenariusz, importuj plik .json lub zacznij od szablonu domenowego.',
      'Kategorie „w przygotowaniu" to puste szablony do uzupełnienia.',
    ],
  },
  {
    icon: FileEdit,
    title: '2. Edytor struktury',
    content: [
      'Definiuj sekcje i kroki testowe.',
      'Tagi widoczności: regresja (szybki test) i pełny zakres.',
      'Do kroków możesz dodać link do zadania w YouTrack.',
    ],
  },
  {
    icon: FolderOpen,
    title: '3. Zapis i eksport',
    content: [
      'Scenariusz zapisywany jest jako plik .json.',
      'Auto-zapis następuje 2 sekundy po ostatniej zmianie (gdy plik ma ścieżkę).',
      '„Duplikuj" tworzy kopię bez sesji testowych.',
    ],
  },
];

export function Help({ mode }: { mode: 'testing' | 'library' }) {
  const { navigate } = useScenario();
  const sections = mode === 'testing' ? testingSections : librarySections;
  const title = mode === 'testing' ? 'Centrum testów — instrukcja' : 'Biblioteka scenariuszy — instrukcja';

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-xl font-bold tracking-tight mb-2 text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {mode === 'testing'
          ? 'Jak przeprowadzać testy i eksportować raporty.'
          : 'Jak tworzyć i edytować scenariusze testowe.'}
      </p>
      <div className="space-y-4">
        {sections.map(({ icon: Icon, title: sectionTitle, content }) => (
          <div key={sectionTitle} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200/60 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800/50">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{sectionTitle}</h3>
            </div>
            <ul className="px-5 py-4 space-y-2">
              {content.map((line, i) => (
                <li key={i} className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2.5">
                  <span className="text-slate-300 dark:text-slate-700 select-none mt-0.5">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400">
        <BookOpen size={16} className="inline mr-2 opacity-50" />
        Aplikacja ma dwa tryby: <strong>Centrum testów</strong> (wykonywanie) i <strong>Biblioteka scenariuszy</strong> (tworzenie).
        Przełącz tryb z menu „Powrót do Start" na ekranie głównym.
      </div>
      <button
        type="button"
        onClick={() => navigate('changelog')}
        className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <ScrollText size={15} /> Zobacz pełną historię zmian
      </button>
    </div>
  );
}
