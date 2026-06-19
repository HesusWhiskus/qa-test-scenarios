import type { Scenario } from '../renderer/types/schema';

const BDD_KEYWORDS = new Set(['given', 'when', 'then', 'and']);

function isBddRow(colA: string): boolean {
  return BDD_KEYWORDS.has(colA.trim().toLowerCase());
}

export async function parseExcelToScenario(buffer: Buffer, fileName: string): Promise<Scenario | { error: string }> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { error: 'Plik Excel nie zawiera arkuszy.' };

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' }) as unknown[][];
    const title = String(rows[0]?.[0] ?? '').trim() || fileName.replace(/\.[^.]+$/, '');
    const steps: { text: string; notes: string }[] = [];
    let isFirstBdd = true;
    let scenarioNote = '';

    for (const row of rows) {
      const colA = String(row[0] ?? '').trim();
      const stepText = String(row[1] ?? row[0] ?? '').trim();
      const notes = String(row[2] ?? '').trim();

      if (isBddRow(colA)) {
        if (!stepText) continue;
        if (isFirstBdd && notes.length > 80) {
          scenarioNote = notes;
          isFirstBdd = false;
          steps.push({ text: stepText, notes: '' });
          continue;
        }
        isFirstBdd = false;
        steps.push({ text: stepText, notes });
        continue;
      }

      if (!isBddRow(colA) && stepText && colA && !colA.toLowerCase().includes('user story')) {
        steps.push({ text: stepText || colA, notes });
      }
    }

    if (steps.length === 0) {
      for (const row of rows) {
        const text = String(row[0] ?? '').trim();
        if (text && text.length > 2) steps.push({ text, notes: '' });
      }
    }

    if (steps.length === 0) return { error: 'Nie znaleziono kroków testowych w pliku.' };

    const now = new Date().toISOString();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);

    return {
      version: 2,
      meta: {
        title,
        description: scenarioNote || `Zaimportowano z: ${fileName}`,
        tags: ['import'],
        createdAt: now,
        updatedAt: now,
      },
      sections: [{
        id: `sec-import-${slug}`,
        title: 'Kroki testowe',
        level: 1,
        visibilityTags: ['full'],
        items: steps.map((s, i) => ({
          id: `import-step-${String(i + 1).padStart(3, '0')}`,
          title: s.notes ? `${s.text} — ${s.notes}` : s.text,
          link: '',
          testCaseId: '',
          preconditions: '',
          expectedResult: '',
        })),
      }],
      runs: [],
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Nie udało się odczytać pliku Excel.' };
  }
}
