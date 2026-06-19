import type { Scenario } from '../types/schema';

export interface Template {
  id: string;
  title: string;
  description: string;
  tags: string[];
  scenario: Scenario;
}

function sec(id: string, title: string, tags: string[], items: { id: string; title: string; link?: string }[], level: 1 | 2 = 1) {
  return {
    id,
    title,
    level,
    visibilityTags: tags,
    items: items.map(i => ({
      id: i.id,
      title: i.title,
      link: i.link || '',
      testCaseId: '',
      preconditions: '',
      expectedResult: '',
    })),
  };
}

const now = '2026-01-01T00:00:00.000Z';

const profilAgenta: Scenario = {
    version: 2,
  meta: {
    title: 'Profil Agenta',
    description: 'Zarządzanie użytkownikami, struktura partnerów, uprawnienia TU, integracja iBooster',
    tags: ['profil-agenta', 'regression'],
    createdAt: now,
    updatedAt: now,
  },
  sections: [
    sec('pa-s1', 'Logowanie i autoryzacja', ['regression'], [
      { id: 'pa-s1-i1', title: 'Logowanie przez Keycloak (prawidłowe dane)' },
      { id: 'pa-s1-i2', title: 'Logowanie — błędne hasło' },
      { id: 'pa-s1-i3', title: 'Reset hasła (link e-mail)' },
      { id: 'pa-s1-i4', title: 'Blokada konta po X nieudanych próbach' },
    ]),
    sec('pa-s2', 'Dane osobowe agenta', ['regression'], [
      { id: 'pa-s2-i1', title: 'Wyświetlanie danych osobowych (imię, nazwisko, PESEL, e-mail)' },
      { id: 'pa-s2-i2', title: 'Edycja danych kontaktowych (telefon, adres)' },
      { id: 'pa-s2-i3', title: 'Walidacja numeru PESEL' },
      { id: 'pa-s2-i4', title: 'Walidacja numeru RAU' },
    ]),
    sec('pa-s3', 'Struktura partnerów', ['regression'], [
      { id: 'pa-s3-i1', title: 'Wyświetlanie drzewa struktury organizacyjnej' },
      { id: 'pa-s3-i2', title: 'Dodawanie nowego agenta do struktury' },
      { id: 'pa-s3-i3', title: 'Przenoszenie agenta między gałęziami' },
      { id: 'pa-s3-i4', title: 'Dezaktywacja agenta w strukturze' },
    ]),
    sec('pa-s4', 'Uprawnienia TU', ['regression'], [
      { id: 'pa-s4-i1', title: 'Przypisanie loginu/hasła do TU' },
      { id: 'pa-s4-i2', title: 'Edycja numeru identyfikacyjnego TU' },
      { id: 'pa-s4-i3', title: 'Usunięcie uprawnień TU' },
      { id: 'pa-s4-i4', title: 'Weryfikacja uprawnień po synchronizacji z CRM' },
    ]),
    sec('pa-s5', 'Separacja organizacji', ['full'], [
      { id: 'pa-s5-i1', title: 'Agent widzi tylko swoją organizację' },
      { id: 'pa-s5-i2', title: 'OFWCA widzi podrzędnych agentów' },
      { id: 'pa-s5-i3', title: 'Brak dostępu do danych innej organizacji' },
    ]),
    sec('pa-s6', 'Flagi biznesowe', ['full'], [
      { id: 'pa-s6-i1', title: 'Ustawienie flagi „aktywny" / „nieaktywny"' },
      { id: 'pa-s6-i2', title: 'Flaga „szkolenie IDD" — wpływ na dostęp do iBooster' },
      { id: 'pa-s6-i3', title: 'Flaga „zgoda RODO" — walidacja przy sprzedaży' },
    ]),
    sec('pa-s7', 'Integracja z iBooster', ['regression'], [
      { id: 'pa-s7-i1', title: 'Przycisk „Przejdź do iBooster" — poprawne przekierowanie' },
      { id: 'pa-s7-i2', title: 'Przekazanie kontekstu agenta (SSO)' },
      { id: 'pa-s7-i3', title: 'Agent bez uprawnień — komunikat blokady' },
    ]),
  ],
  runs: [],
};

const strefaAgenta: Scenario = {
    version: 2,
  meta: {
    title: 'Strefa Agenta',
    description: 'Dashboard, nawigacja, szkolenia, dokumenty, baza wiedzy, konkursy',
    tags: ['strefa-agenta'],
    createdAt: now,
    updatedAt: now,
  },
  sections: [
    sec('sa-s1', 'Logowanie Keycloak', ['regression'], [
      { id: 'sa-s1-i1', title: 'Logowanie prawidłowe (agent)' },
      { id: 'sa-s1-i2', title: 'Logowanie prawidłowe (OFWCA)' },
      { id: 'sa-s1-i3', title: 'Logowanie — błędne dane' },
      { id: 'sa-s1-i4', title: 'Wygaśnięcie sesji — przekierowanie do logowania' },
    ]),
    sec('sa-s2', 'Dashboard', ['regression'], [
      { id: 'sa-s2-i1', title: 'Wyświetlanie kafelków (szkolenia, dokumenty, konkursy)' },
      { id: 'sa-s2-i2', title: 'Wyszukiwarka globalna — wyniki z różnych sekcji' },
      { id: 'sa-s2-i3', title: 'Przypięte wpisy — dodawanie i usuwanie' },
      { id: 'sa-s2-i4', title: 'Responsywność dashboardu' },
    ]),
    sec('sa-s3', 'Nawigacja menu', ['full'], [
      { id: 'sa-s3-i1', title: 'Szkolenia — lista, filtrowanie, szczegóły' },
      { id: 'sa-s3-i2', title: 'Baza wiedzy — kategorie, artykuły, wyszukiwanie' },
      { id: 'sa-s3-i3', title: 'Dokumenty — pobranie, podgląd, filtrowanie po TU' },
      { id: 'sa-s3-i4', title: 'Konkursy — aktywne, zakończone, ranking' },
    ]),
    sec('sa-s4', 'Przycisk „Nowa Oferta"', ['regression'], [
      { id: 'sa-s4-i1', title: 'Przekierowanie do iBooster' },
      { id: 'sa-s4-i2', title: 'Kontekst agenta przeniesiony poprawnie' },
    ]),
    sec('sa-s5', 'Przycisk „Twój CRM"', ['regression'], [
      { id: 'sa-s5-i1', title: 'Przekierowanie do CRM' },
      { id: 'sa-s5-i2', title: 'SSO — brak ponownego logowania' },
    ]),
    sec('sa-s6', 'Zaświadczenie IDD', ['full'], [
      { id: 'sa-s6-i1', title: 'Upload pliku zaświadczenia' },
      { id: 'sa-s6-i2', title: 'Walidacja formatu pliku' },
      { id: 'sa-s6-i3', title: 'Potwierdzenie przyjęcia dokumentu' },
    ]),
  ],
  runs: [],
};

const procesSprzedazy: Scenario = {
    version: 2,
  meta: {
    title: 'Proces sprzedaży iBooster',
    description: 'Pełna ścieżka: RODO/IDD → APK → Kalkulacja → Sprzedaż',
    tags: ['ibooster', 'sprzedaz'],
    createdAt: now,
    updatedAt: now,
  },
  sections: [
    sec('ps-s1', 'RODO i IDD', ['regression'], [
      { id: 'ps-s1-i1', title: 'Identyfikacja klienta po PESEL' },
      { id: 'ps-s1-i2', title: 'Wyświetlenie klauzuli RODO' },
      { id: 'ps-s1-i3', title: 'Podpis klienta — SMS' },
      { id: 'ps-s1-i4', title: 'Podpis klienta — papierowy' },
      { id: 'ps-s1-i5', title: 'Odmowa RODO — blokada procesu' },
    ]),
    sec('ps-s2', 'Analiza potrzeb klienta (APK)', ['regression'], [
      { id: 'ps-s2-i1', title: 'Formularz APK — pola obowiązkowe' },
      { id: 'ps-s2-i2', title: 'Walidacja formularza APK' },
      { id: 'ps-s2-i3', title: 'Podpis APK przez klienta' },
      { id: 'ps-s2-i4', title: 'Zapisanie APK — przejście do kalkulacji' },
    ]),
    sec('ps-s3', 'Kalkulacja', ['regression'], [
      { id: 'ps-s3-i1', title: 'Wariant minimalny — poprawna wycena' },
      { id: 'ps-s3-i2', title: 'Wariant optymalny — poprawna wycena' },
      { id: 'ps-s3-i3', title: 'Wariant maksymalny — poprawna wycena' },
      { id: 'ps-s3-i4', title: 'Porównanie ofert TU (tabela)' },
      { id: 'ps-s3-i5', title: 'Sortowanie ofert (cena, zakres)' },
      { id: 'ps-s3-i6', title: 'Dodanie oferty do koszyka' },
    ]),
    sec('ps-s4', 'Sprzedaż i wystawienie polisy', ['regression'], [
      { id: 'ps-s4-i1', title: 'Wybór oferty z koszyka' },
      { id: 'ps-s4-i2', title: 'Zgody klienta (OWU, informacja o agencie)' },
      { id: 'ps-s4-i3', title: 'Wystawienie polisy — sukces' },
      { id: 'ps-s4-i4', title: 'Przeniesienie polisy do CRM' },
    ]),
    sec('ps-s5', 'Edge cases i walidacje', ['full'], [
      { id: 'ps-s5-i1', title: 'Klient zagraniczny (brak PESEL)' },
      { id: 'ps-s5-i2', title: 'Wygaśnięcie sesji w trakcie kalkulacji' },
      { id: 'ps-s5-i3', title: 'Brak odpowiedzi TU — timeout' },
      { id: 'ps-s5-i4', title: 'Duplikat polisy — ostrzeżenie' },
      { id: 'ps-s5-i5', title: 'Cofnięcie do poprzedniego kroku — zachowanie danych' },
    ]),
  ],
  runs: [],
};

const crm: Scenario = {
    version: 2,
  meta: {
    title: 'CRM (Twój CRM)',
    description: 'Panel główny, kontakty, szanse sprzedaży, polisy, kalendarz, wznowienia',
    tags: ['crm'],
    createdAt: now,
    updatedAt: now,
  },
  sections: [
    sec('crm-s1', 'Panel główny', ['regression'], [
      { id: 'crm-s1-i1', title: 'Kafelki — wyświetlanie statystyk' },
      { id: 'crm-s1-i2', title: 'Konfiguracja panelu (ukrywanie kafelków)' },
      { id: 'crm-s1-i3', title: 'Szybki dostęp do ostatnich kontaktów' },
    ]),
    sec('crm-s2', 'Kontakty', ['regression'], [
      { id: 'crm-s2-i1', title: 'Dodanie nowego kontaktu' },
      { id: 'crm-s2-i2', title: 'Edycja istniejącego kontaktu' },
      { id: 'crm-s2-i3', title: 'Wyszukiwanie kontaktów (imię, nazwisko, PESEL)' },
      { id: 'crm-s2-i4', title: 'Usunięcie kontaktu' },
    ]),
    sec('crm-s3', 'Szanse sprzedaży', ['full'], [
      { id: 'crm-s3-i1', title: 'Tworzenie szansy sprzedaży' },
      { id: 'crm-s3-i2', title: 'Przypisanie szansy do kontaktu' },
      { id: 'crm-s3-i3', title: 'Zmiana statusu szansy' },
    ]),
    sec('crm-s4', 'Polisy', ['regression'], [
      { id: 'crm-s4-i1', title: 'Lista polis — wyświetlanie' },
      { id: 'crm-s4-i2', title: 'Filtrowanie polis (TU, status, data)' },
      { id: 'crm-s4-i3', title: 'Szczegóły polisy — poprawne dane' },
    ]),
    sec('crm-s5', 'Kalendarz', ['full'], [
      { id: 'crm-s5-i1', title: 'Widok miesiąca / tygodnia / dnia' },
      { id: 'crm-s5-i2', title: 'Dodanie wydarzenia' },
      { id: 'crm-s5-i3', title: 'Przypomnienia o wznowieniach w kalendarzu' },
    ]),
    sec('crm-s6', 'Wznowienia', ['regression'], [
      { id: 'crm-s6-i1', title: 'Oś czasu wznowień — wyświetlanie' },
      { id: 'crm-s6-i2', title: 'Przycisk „Wznów przez iBooster"' },
      { id: 'crm-s6-i3', title: 'Filtry wyszukiwania polis do wznowienia' },
      { id: 'crm-s6-i4', title: 'Sortowanie wznowień (data, TU, kwota)' },
    ]),
    sec('crm-s7', 'Integracja z iBooster', ['regression'], [
      { id: 'crm-s7-i1', title: 'Przycisk „Przejdź do iBooster" — przekierowanie' },
      { id: 'crm-s7-i2', title: 'Kontekst klienta przeniesiony do iBooster' },
    ]),
  ],
  runs: [],
};

const synchronizacja: Scenario = {
    version: 2,
  meta: {
    title: 'Synchronizacja Profil Agenta ↔ CRM',
    description: 'Spójność danych osobowych, uprawnień TU i struktury między systemami',
    tags: ['synchronizacja', 'profil-agenta', 'crm'],
    createdAt: now,
    updatedAt: now,
  },
  sections: [
    sec('sync-s1', 'Dane osobowe', ['regression'], [
      { id: 'sync-s1-i1', title: 'Imię i nazwisko — zgodność PA ↔ CRM' },
      { id: 'sync-s1-i2', title: 'E-mail — zgodność PA ↔ CRM' },
      { id: 'sync-s1-i3', title: 'PESEL — zgodność PA ↔ CRM' },
      { id: 'sync-s1-i4', title: 'Numer RAU — zgodność PA ↔ CRM' },
    ]),
    sec('sync-s2', 'Uprawnienia TU', ['regression'], [
      { id: 'sync-s2-i1', title: 'Loginy TU — zgodność PA ↔ CRM' },
      { id: 'sync-s2-i2', title: 'Numery identyfikacyjne TU — zgodność PA ↔ CRM' },
      { id: 'sync-s2-i3', title: 'Dodanie uprawnień w PA → pojawienie się w CRM' },
      { id: 'sync-s2-i4', title: 'Usunięcie uprawnień w PA → usunięcie z CRM' },
    ]),
    sec('sync-s3', 'Struktura organizacyjna', ['full'], [
      { id: 'sync-s3-i1', title: 'Struktura gałęzi — zgodność PA ↔ CRM' },
      { id: 'sync-s3-i2', title: 'Przeniesienie agenta w PA → aktualizacja w CRM' },
      { id: 'sync-s3-i3', title: 'Dezaktywacja agenta w PA → status w CRM' },
    ]),
    sec('sync-s4', 'Propagacja zmian', ['regression'], [
      { id: 'sync-s4-i1', title: 'Zmiana danych w PA → aktualizacja w CRM (czas)' },
      { id: 'sync-s4-i2', title: 'Zmiana danych w CRM → aktualizacja w PA (czas)' },
      { id: 'sync-s4-i3', title: 'Konflikt danych — który system wygrywa' },
      { id: 'sync-s4-i4', title: 'Logi synchronizacji — dostępność i czytelność' },
    ]),
  ],
  runs: [],
};

export const builtinTemplates: Template[] = [
  {
    id: 'profil-agenta',
    title: 'Profil Agenta',
    description: 'Użytkownicy, struktura, uprawnienia TU, integracja iBooster',
    tags: ['profil-agenta'],
    scenario: profilAgenta,
  },
  {
    id: 'strefa-agenta',
    title: 'Strefa Agenta',
    description: 'Dashboard, nawigacja, szkolenia, dokumenty, baza wiedzy',
    tags: ['strefa-agenta'],
    scenario: strefaAgenta,
  },
  {
    id: 'proces-sprzedazy',
    title: 'Proces sprzedaży iBooster',
    description: 'RODO/IDD → APK → Kalkulacja → Sprzedaż',
    tags: ['ibooster', 'sprzedaz'],
    scenario: procesSprzedazy,
  },
  {
    id: 'crm',
    title: 'CRM (Twój CRM)',
    description: 'Kontakty, polisy, wznowienia, kalendarz, integracja iBooster',
    tags: ['crm'],
    scenario: crm,
  },
  {
    id: 'synchronizacja',
    title: 'Synchronizacja PA ↔ CRM',
    description: 'Spójność danych osobowych, uprawnień i struktury',
    tags: ['synchronizacja'],
    scenario: synchronizacja,
  },
];
