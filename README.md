# QA Test Scenarios

Desktopowa aplikacja do zarządzania scenariuszami testowymi QA — checklisty, notatki, screenshoty i eksport do Markdown (YouTrack).

## Instalacja

Pobierz najnowszą wersję z [GitHub Releases](https://github.com/HesusWhiskus/qa-test-scenarios/releases):

| System  | Plik |
|---------|------|
| Windows | `QA-Test-Scenarios-Setup.exe` |
| macOS   | `QA-Test-Scenarios.dmg` |

### Windows

1. Pobierz `QA-Test-Scenarios-Setup.exe`.
2. Uruchom instalator. Przy pierwszym uruchomieniu Windows może wyświetlić ostrzeżenie "Nieznany wydawca" — kliknij **Więcej informacji** → **Uruchom mimo to**.
3. Aplikacja zainstaluje się do `%LocalAppData%\QATestScenarios`.

### macOS

1. Pobierz `QA-Test-Scenarios.dmg`.
2. Otwórz plik DMG i przeciągnij aplikację do folderu Applications.
3. Przy pierwszym uruchomieniu macOS może zablokować aplikację (Gatekeeper). Kliknij prawym przyciskiem → **Otwórz** → **Otwórz** w oknie dialogowym.

## Rozwój

```bash
# Instalacja zależności
npm install

# Uruchomienie w trybie deweloperskim
npm start

# Budowanie instalatora dla bieżącej platformy
npm run make
```

## Wydawanie nowej wersji

1. Zaktualizuj `version` w `package.json`.
2. Scommituj zmiany.
3. Utwórz tag i wypchnij go:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions automatycznie zbuduje instalatory dla Windows i macOS i opublikuje je w [Releases](https://github.com/HesusWhiskus/qa-test-scenarios/releases).
