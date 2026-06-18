import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'public', 'templates');
const XLSX_PATH = path.join(
  ROOT,
  '..',
  'Przypadki testowe',
  'Integracja iBooster - CRM_',
  'Przypadki testowe - integracja iBooster z CRM (Berg) v.1.1 AW.xlsx',
);

const BDD_KEYWORDS = new Set(['given', 'when', 'then', 'and']);
const NOW = new Date().toISOString();

const SHEET_CONFIG = {
  TC1: {
    file: 'integracja-ibooster-crm/tc1-nowy-klient-pojazd-polis.json',
    shortTitle: 'TC1 — Nowy klient, pojazd i polisa w CRM',
    stepCol: 1,
    notesCol: 2,
    ignoreCols: [],
  },
  TC2: {
    file: 'integracja-ibooster-crm/tc2-wyszukanie-pesel-crm.json',
    shortTitle: 'TC2 — Wyszukanie klienta i pojazdu po PESEL z CRM',
    stepCol: 1,
    notesCol: 3,
    ignoreCols: [2],
  },
  TC3: {
    file: 'integracja-ibooster-crm/tc3-powrot-do-kalkulacji.json',
    shortTitle: 'TC3 — Powrót z CRM do kalkulacji',
    stepCol: 1,
    notesCol: 2,
    ignoreCols: [],
  },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeScenario(relativePath, scenario) {
  const fullPath = path.join(TEMPLATES_DIR, relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, JSON.stringify(scenario, null, 2), 'utf-8');
  return fullPath;
}

function createStub(title, description, tags, sectionTitle) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    version: 1,
    meta: { title, description, tags, createdAt: NOW, updatedAt: NOW },
    sections: [
      {
        id: `sec-${slug}`,
        title: sectionTitle,
        level: 1,
        visibilityTags: ['full'],
        items: [{ id: 'placeholder', title: 'Scenariusze do uzupełnienia', link: '' }],
      },
    ],
    runs: [],
  };
}

function isBddRow(colA) {
  return BDD_KEYWORDS.has(String(colA).trim().toLowerCase());
}

function parseSheet(sheet, sheetName) {
  const config = SHEET_CONFIG[sheetName];
  if (!config) throw new Error(`Brak konfiguracji dla arkusza: ${sheetName}`);

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const userStory = String(rows[0]?.[0] ?? '').trim();

  let scenarioNote = '';
  const steps = [];
  let isFirstBdd = true;

  for (const row of rows) {
    const colA = String(row[0] ?? '').trim();
    const stepText = String(row[config.stepCol] ?? '').trim();
    const notes = String(row[config.notesCol] ?? '').trim();

    if (!isBddRow(colA) || !stepText) continue;

    if (isFirstBdd && notes.length > 80) {
      scenarioNote = notes;
      isFirstBdd = false;
      steps.push({ text: stepText, notes: '' });
      continue;
    }

    isFirstBdd = false;
    steps.push({ text: stepText, notes });
  }

  const descriptionParts = [
    userStory,
    scenarioNote,
    'Źródło: Przypadki testowe — integracja iBooster z CRM (Berg) v.1.1 AW.',
  ].filter(Boolean);

  return {
    version: 1,
    meta: {
      title: config.shortTitle,
      description: descriptionParts.join('\n\n'),
      tags: ['integracja', 'ibooster', 'crm', 'berg'],
      createdAt: NOW,
      updatedAt: NOW,
    },
    sections: [
      {
        id: `sec-${sheetName.toLowerCase()}`,
        title: 'Kroki testowe',
        level: 1,
        visibilityTags: ['full'],
        items: steps.map((s, i) => {
          let title = s.text;
          if (s.notes) {
            title = `${s.text} — ${s.notes}`;
          }
          return {
            id: `${sheetName.toLowerCase()}-step-${String(i + 1).padStart(3, '0')}`,
            title,
            link: '',
          };
        }),
      },
    ],
    runs: [],
  };
}

function generateFromXlsx() {
  const workbook = XLSX.readFile(XLSX_PATH);
  const written = [];

  for (const [sheet, config] of Object.entries(SHEET_CONFIG)) {
    const ws = workbook.Sheets[sheet];
    if (!ws) {
      console.warn(`Pominięto brakujący arkusz: ${sheet}`);
      continue;
    }
    const scenario = parseSheet(ws, sheet);
    writeScenario(config.file, scenario);
    written.push({ file: config.file, steps: scenario.sections[0].items.length, title: scenario.meta.title });
  }

  return written;
}

function generateStubs() {
  const stubs = [
    ['direct/_kategoria.json', 'Direct', 'Scenariusze testowe modułu Direct.', ['direct'], 'Direct'],
    ['profil-agenta/_kategoria.json', 'Profil Agenta', 'Scenariusze testowe modułu Profil Agenta (kategoria firmowa).', ['profil-agenta'], 'Profil Agenta'],
    ['ibooster/01-rodo-idd.json', 'iBooster — 1. RODO - IDD', 'Scenariusze testowe procesu RODO i IDD w iBooster.', ['ibooster', 'rodo', 'idd'], '1. RODO - IDD'],
    ['ibooster/02-apk.json', 'iBooster — 2. APK', 'Scenariusze testowe Analizy Potrzeb Klienta (APK).', ['ibooster', 'apk'], '2. APK'],
    ['ibooster/03-formularz.json', 'iBooster — 3. Formularz', 'Scenariusze testowe formularza danych w iBooster.', ['ibooster', 'formularz'], '3. Formularz'],
    ['ibooster/04-kalkulacja.json', 'iBooster — 4. Kalkulacja', 'Scenariusze testowe kalkulacji ofert.', ['ibooster', 'kalkulacja'], '4. Kalkulacja'],
    ['ibooster/05-polisowanie.json', 'iBooster — 5. Polisowanie', 'Scenariusze testowe procesu polisowania.', ['ibooster', 'polisowanie'], '5. Polisowanie'],
    ['ibooster/06-schowek.json', 'iBooster — 6. Schowek', 'Scenariusze testowe modułu Schowek.', ['ibooster', 'schowek'], '6. Schowek'],
    ['ibooster/07-integracje-z-tu.json', 'iBooster — 7. Integracje z TU', 'Scenariusze testowe integracji z Towarzystwami Ubezpieczeniowymi.', ['ibooster', 'integracje', 'tu'], '7. Integracje z TU'],
    ['ibooster/08-panel-administracyjny.json', 'iBooster — 8. Panel Administracyjny', 'Scenariusze testowe Panelu Administracyjnego iBooster.', ['ibooster', 'panel-admin'], '8. Panel Administracyjny'],
  ];

  for (const [file, title, description, tags, section] of stubs) {
    writeScenario(file, createStub(title, description, tags, section));
  }
  return stubs.length;
}

console.log('Generowanie scenariuszy...');
const xlsxResults = generateFromXlsx();
const stubCount = generateStubs();

console.log('\nZ Excela:');
for (const r of xlsxResults) {
  console.log(`  ${r.title} — ${r.steps} kroków → ${r.file}`);
}
console.log(`\nStuby kategorii: ${stubCount} plików`);
