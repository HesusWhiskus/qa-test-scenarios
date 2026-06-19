import type { CatalogEntry } from './scenario-catalog';

export function filterCatalogEntries(entries: CatalogEntry[], query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;

  return entries.filter(entry => {
    if (entry.title.toLowerCase().includes(q)) return true;
    if (entry.description.toLowerCase().includes(q)) return true;
    if (entry.scenario.meta.tags.some(t => t.toLowerCase().includes(q))) return true;
    for (const section of entry.scenario.sections) {
      if (section.title.toLowerCase().includes(q)) return true;
      for (const item of section.items) {
        if (item.title.toLowerCase().includes(q)) return true;
        if (item.testCaseId?.toLowerCase().includes(q)) return true;
      }
    }
    return false;
  });
}
