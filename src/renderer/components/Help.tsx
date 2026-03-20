import { BookOpen, FileEdit, Play, Download, Keyboard, FolderOpen, LayoutTemplate } from 'lucide-react';

const sections = [
  {
    icon: LayoutTemplate,
    title: '1. Tworzenie scenariusza',
    content: [
      'Na ekranie Start kliknij „Nowy scenariusz" i podaj nazwę, lub wybierz jeden z gotowych szablonów domenowych (Profil Agenta, Strefa Agenta, iBooster, CRM, Synchronizacja).',
      'Szablon tworzy kopię z pełną strukturą sekcji i kroków — możesz go dowolnie edytować.',
      'Możesz też otworzyć wcześniej zapisany plik .json przyciskiem „Otwórz plik" lub z listy ostatnich plików.',
    ],
  },
  {
    icon: FileEdit,
    title: '2. Edycja struktury',
    content: [
      'W zakładce Edytor definiujesz strukturę scenariusza: sekcje (nagłówki) i kroki testowe (pozycje).',
      'Każda sekcja może mieć tagi widoczności: „regression" (testy regresyjne) lub „full" (pełny zakres). Filtrowanie w Runnerze uwzględnia te tagi.',
      'Do każdego kroku możesz przypisać link do zadania w YouTrack (pole „Link").',
      'Sekcje i kroki możesz przenosić w górę/dół strzałkami, usuwać przyciskiem ×.',
    ],
  },
  {
    icon: Play,
    title: '3. Rozpoczęcie przebiegu testowego',
    content: [
      'Przejdź do zakładki Przebiegi i kliknij „Nowy przebieg".',
      'Podaj opcjonalne metadane: nazwę sesji, środowisko (np. staging, prod), wersję buildu, testera.',
      'Po utworzeniu automatycznie przejdziesz do widoku Wykonanie.',
    ],
  },
  {
    icon: BookOpen,
    title: '4. Wykonywanie testów',
    content: [
      'Każdy krok ma status: — (oczekujący), PASS, FAIL, BLOCK, SKIP.',
      'Kliknij główną część badge\'a, aby szybko przełączyć pass/pending. Kliknij strzałkę (▼), aby wybrać dowolny status z listy.',
      'Pod każdym krokiem możesz rozwinąć notatki (ikona >) i wpisać obserwacje.',
      'Przycisk aparatu pozwala dołączyć screenshot z dysku.',
      'Filtry u góry pozwalają wyświetlić: wszystkie, niezakończone, nieudane lub tylko regresję.',
    ],
  },
  {
    icon: Keyboard,
    title: '5. Skróty klawiszowe',
    content: [
      '↑ / ↓ lub K / J — nawigacja między krokami',
      'P — ustaw status PASS (i przejdź do następnego)',
      'F — ustaw status FAIL',
      'B — ustaw status BLOCKED',
      'S — ustaw status SKIP (i przejdź do następnego)',
      'N — rozwiń/zwiń notatki dla aktualnego kroku',
    ],
  },
  {
    icon: Download,
    title: '6. Eksport raportu do YouTrack',
    content: [
      'Przejdź do zakładki Eksport, aby wygenerować raport Markdown.',
      'Raport zawiera: tytuł scenariusza, metadane przebiegu, statystyki, sekcje z checkboxami (✓/✗), notatki (cytaty) i linki do screenshotów.',
      'Kliknij „Kopiuj do schowka", aby wkleić bezpośrednio do YouTrack, lub „Zapisz jako .md" aby pobrać plik.',
    ],
  },
  {
    icon: FolderOpen,
    title: '7. Zarządzanie plikami',
    content: [
      'Scenariusz zapisywany jest jako plik .json. Auto-zapis następuje 2 sekundy po ostatniej zmianie.',
      '„Zapisz jako..." tworzy nowy plik w wybranej lokalizacji.',
      '„Duplikuj" tworzy kopię scenariusza bez przebiegów testowych — przydatne do nowej rundy testów.',
      'Screenshoty są kopiowane do folderu [nazwa]_files obok pliku .json.',
      'Gdy otwierasz plik z istniejącymi przebiegami, aplikacja zapyta czy chcesz edytować strukturę, przejść do przebiegów, czy rozpocząć nowy przebieg.',
    ],
  },
];

export function Help() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-xl font-bold tracking-tight mb-6 text-slate-900 dark:text-slate-100">Instrukcja obsługi</h2>
      <div className="space-y-4">
        {sections.map(({ icon: Icon, title, content }) => (
          <div key={title} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200/60 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-800/50">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</h3>
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
    </div>
  );
}
