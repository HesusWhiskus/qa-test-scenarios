# Konfiguracja YouTrack

Integracja z YouTrack wymaga kilku danych z Waszej instancji. Uzupełnij je w **Ustawienia → YouTrack**.

## Wymagane

| Pole | Gdzie znaleźć | Przykład |
|------|---------------|----------|
| **URL instancji** | Adres w przeglądarce bez ścieżki issue | `https://firma.myjetbrains.com/youtrack` |
| **Token** | YouTrack → Profil → Security → New token… (scope: YouTrack) | `perm:abc123…` |
| **ID projektu** | Admin → Projects → wybierz projekt → ID w URL lub API | `0-12` lub shortName jak `QA` |

## Opcjonalne — mapowanie pól custom

Nazwy pól muszą **dokładnie** odpowiadać polom w Waszym projekcie YouTrack. Jeśli nie są ustawione, issue tworzy się bez tych pól (summary + description wystarczą).

| Pole w aplikacji | Co wpisać | Uwagi |
|------------------|-----------|-------|
| Domyślny typ issue | `Bug`, `Task`, `Story`… | Musi istnieć w projekcie |
| Pole custom: Environment | np. `Environment`, `Środowisko` | Enum lub string — zależy od konfiguracji YT |
| Pole custom: Build | np. `Build version`, `Wersja` | Zwykle pole tekstowe |
| Pole custom: Type (nazwa) | Domyślnie `Type` | Zmień jeśli pole typu ma inną nazwę |

## Co jeszcze może być potrzebne (do ustalenia z adminem YT)

- **Wartości enum** dla Environment (staging, UAT, prod) — muszą być zdefiniowane w YouTrack, inaczej API odrzuci issue
- **ID projektu vs shortName** — aplikacja wysyła `{ "project": { "id": "…" } }`; jeśli shortName nie działa, użyj wewnętrznego ID (`0-XX`)
- **Uprawnienia tokena** — token musi mieć prawo tworzenia issue i załączników w danym projekcie
- **Workflow** — aplikacja nie zmienia statusów issue; tylko tworzy i zapisuje link w kroku scenariusza
- **Pola obowiązkowe** — jeśli projekt wymaga np. Priority, Component, Assignee przy każdym issue, trzeba je dodać do `youtrack-client.ts` (customFields)

## Test połączenia

Po zapisaniu ustawień kliknij **Test połączenia**. Sprawdza token i dostęp do API (`/api/admin/projects`).

## Użycie w aplikacji

1. **Pojedynczy ticket** — przy kroku ze statusem Fail/Blocked kliknij ikonę buga (gdy YouTrack skonfigurowany)
2. **Zbiorczo** — w widoku Raport → **Tickety YouTrack** (tworzy issue dla wszystkich fail/blocked bez linku)
3. **Ręcznie** — eksport Markdown (pełny lub tylko problemy) i wklejenie do YouTrack

## Bezpieczeństwo

Token jest przechowywany lokalnie w `%APPDATA%/QA Test Scenarios/settings.json` (Windows). Nie trafia do plików scenariuszy JSON ani do raportów Markdown.
