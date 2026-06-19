# QA Test Scenarios

Desktopowa aplikacja do zarządzania scenariuszami testowymi. Dwa tryby pracy: **Centrum testów** (wykonywanie checklist, raporty) i **Biblioteka scenariuszy** (tworzenie i edycja struktury).

## Tryby pracy

### Centrum testów
Wybierz scenariusz → utwórz sesję testową → przejdź checklistę krok po kroku → wyeksportuj raport Markdown do YouTrack.

### Biblioteka scenariuszy
Twórz nowe scenariusze, edytuj sekcje i kroki, importuj/eksportuj pliki `.json`, korzystaj z szablonów domenowych.

## Funkcje

- **Scenariusze testowe** — sekcje i kroki, tagi regresja/pełny zakres, import/eksport JSON
- **Sesje testowe** — wiele niezależnych rund tego samego scenariusza ze statusami, notatkami i screenshotami
- **Checklista** — pass, fail, blocked, skip, skróty klawiszowe, filtry, wyszukiwarka
- **Raport Markdown** — eksport do YouTrack (kopiuj lub zapisz `.md`)
- **Szablony** — wbudowane i z folderu `public/templates/` (iBooster, CRM, integracje…)
- **Tryb ciemny** — jasny/ciemny motyw, rozmiar czcionki, gęstość UI

- **Kontynuuj testowanie** — lista zapisanych scenariuszy i sesji w aplikacji (bez dialogu systemowego)
- **Historia zmian** — dostępna w Ustawieniach i menu bocznym (wbudowany changelog)

## Historia zmian

Pełna lista zmian: [`CHANGELOG.md`](CHANGELOG.md) w repozytorium lub **Ustawienia → Historia zmian** w aplikacji.

## Pobieranie

Pobierz najnowszą wersję ze strony [Releases](https://github.com/HesusWhiskus/qa-test-scenarios/releases).

Instalatory dla **Windows i macOS** budowane są automatycznie przez GitHub Actions przy każdym tagu `v*`.

| System  | Plik | Typ |
|---------|------|-----|
| Windows | `QA-Test-Scenarios-Setup.exe` | Instalator |
| Windows | `QA Test Scenarios-win32-x64-*.zip` | Wersja przenośna |
| macOS   | `QA-Test-Scenarios.dmg` | Instalator |
| macOS   | `QA.Test.Scenarios-darwin-arm64-*.zip` | Wersja przenośna |

### Windows

1. Pobierz `QA-Test-Scenarios-Setup.exe` i uruchom instalator.
2. Przy pierwszym uruchomieniu Windows może wyświetlić ostrzeżenie — kliknij **Więcej informacji** → **Uruchom mimo to**.

### macOS

1. Pobierz `QA-Test-Scenarios.dmg`.
2. Otwórz plik `.dmg` i przeciągnij aplikację do folderu **Applications**.
3. Przy pierwszym uruchomieniu: prawy przycisk na ikonie → **Otwórz** → potwierdź **Otwórz** (Gatekeeper).

## Skróty klawiszowe (checklista)

| Skrót | Akcja |
|-------|-------|
| `P` | Pass (i następny krok) |
| `F` | Fail |
| `B` | Blocked |
| `S` | Skip |
| `↑` / `↓` lub `K` / `J` | Nawigacja między krokami |
| `N` | Rozwiń/zwiń notatki |

## Scenariusze firmowe

Wygeneruj scenariusze z plików Excel w folderze `Przypadki testowe`:

```bash
npm run generate-scenarios
```

## Stos technologiczny

Electron · React · TypeScript · Tailwind CSS · Vite
