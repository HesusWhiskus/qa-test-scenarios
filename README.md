# QA Test Scenarios

Desktopowa aplikacja do zarządzania scenariuszami testowymi. Twórz scenariusze, przeprowadzaj przebiegi testowe z checklistą, dodawaj notatki i screenshoty, a potem eksportuj raport do Markdown — gotowy do wklejenia w YouTrack.

## Funkcje

- **Scenariusze testowe** — definiuj sekcje i kroki testowe, oznaczaj widoczność (regression/full), importuj i eksportuj jako `.json`.
- **Przebiegi testowe** — uruchamiaj wielokrotne przebiegi tego samego scenariusza. Każdy przebieg zachowuje niezależne statusy, notatki i screenshoty.
- **Statusy kroków** — pass, fail, blocked, skipped, pending — szybki wybór z klawiatury lub dropdown.
- **Notatki i screenshoty** — przypisuj notatki i zrzuty ekranu do konkretnych kroków testowych.
- **Eksport Markdown** — generuj raport w formacie `.md` kompatybilnym z YouTrack, z tabelą wyników i statystykami.
- **Szablony** — wbudowane szablony scenariuszy (Profil Agenta, Strefa Agenta, iBooster, CRM, Synchronizacja) do szybkiego startu.
- **Tryb ciemny** — przełączanie między jasnym a ciemnym motywem.

## Pobieranie

Pobierz najnowszą wersję ze strony [Releases](https://github.com/HesusWhiskus/qa-test-scenarios/releases):

| System  | Plik | Typ |
|---------|------|-----|
| Windows | `QA-Test-Scenarios-Setup.exe` | Instalator |
| macOS   | `QA-Test-Scenarios.dmg` | Instalator |

Dostępne są również przenośne wersje `.zip` dla obu platform.

## Instalacja

### Windows

1. Pobierz `QA-Test-Scenarios-Setup.exe` ze strony Releases.
2. Uruchom instalator. Windows może wyświetlić ostrzeżenie "Nieznany wydawca" — kliknij **Więcej informacji**, a następnie **Uruchom mimo to**.
3. Aplikacja zainstaluje się automatycznie i będzie dostępna z menu Start.

### macOS

1. Pobierz `QA-Test-Scenarios.dmg` ze strony Releases.
2. Otwórz plik `.dmg` i przeciągnij ikonę aplikacji do folderu **Applications**.
3. Przy pierwszym uruchomieniu macOS może zablokować aplikację. Kliknij prawym przyciskiem na ikonę aplikacji → **Otwórz** → potwierdź **Otwórz** w oknie dialogowym.

## Skróty klawiszowe

| Skrót | Akcja |
|-------|-------|
| `P` | Oznacz krok jako pass |
| `F` | Oznacz krok jako fail |
| `B` | Oznacz krok jako blocked |
| `S` | Oznacz krok jako skipped |
| `↑` / `↓` | Nawigacja między krokami |
| `N` | Focus na pole notatki |

## Stos technologiczny

Electron · React · TypeScript · Tailwind CSS · Vite
