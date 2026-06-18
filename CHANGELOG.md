# Changelog

Wszystkie istotne zmiany w projekcie są dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.1.0/).

## [1.1.0] - 2026-06-18

### Added
- Rozdzielenie interfejsu: **Centrum testów** i **Biblioteka scenariuszy**
- Ekran Start z wyborem trybu pracy
- Auto-zapis scenariuszy przy starcie testu (folder danych aplikacji, bez dialogu systemowego)
- Sekcja **Kontynuuj testowanie** — lista zapisanych scenariuszy i sesji w aplikacji
- Widoczna wersja aplikacji w interfejsie
- Historia zmian dostępna w aplikacji (Ustawienia, menu boczne)
- Scenariusze testowe z plików Excel (TC1–TC3) i szablony domenowe (iBooster, CRM, Direct…)
- Skrypt `npm run generate-scenarios` do generowania JSON z folderu „Przypadki testowe”

### Changed
- Nowe nazwy w menu: Sesje testowe, Checklista, Raport
- Dialog otwarcia pliku uproszczony do 2 opcji (tylko w Centrum testów)
- Import pliku z dysku przeniesiony na drugi plan (link „Importuj z dysku…”)

### Fixed
- Auto-zapis: `isDirty` zerowane dopiero po udanym zapisie
- Walidacja schematu JSON przy odczycie pliku
- Eksport screenshotów z poprawną ścieżką względną w Markdown
- „Nowa sesja” z dialogu otwarcia tworzy przebieg testowy

## [1.0.3] - 2026-03-20

### Added
- Pierwsza publiczna wersja desktopowa (Windows + macOS)
- Edytor scenariuszy, przebiegi testowe, checklista, eksport Markdown do YouTrack
- Szablony scenariuszy i tryb ciemny
