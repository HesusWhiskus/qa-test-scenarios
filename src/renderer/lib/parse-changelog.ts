export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogRelease {
  version: string;
  date?: string;
  sections: ChangelogSection[];
}

const SECTION_LABELS: Record<string, string> = {
  Added: 'Dodano',
  Changed: 'Zmieniono',
  Fixed: 'Naprawiono',
  Removed: 'Usunięto',
  Deprecated: 'Wycofano',
  Security: 'Bezpieczeństwo',
};

export function parseChangelog(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  const lines = markdown.split('\n');
  let current: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;

  for (const line of lines) {
    const versionMatch = line.match(/^##\s+\[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/);
    if (versionMatch) {
      if (current) releases.push(current);
      current = { version: versionMatch[1], date: versionMatch[2], sections: [] };
      currentSection = null;
      continue;
    }

    const sectionMatch = line.match(/^###\s+(\w+)/);
    if (sectionMatch && current) {
      const title = SECTION_LABELS[sectionMatch[1]] || sectionMatch[1];
      currentSection = { title, items: [] };
      current.sections.push(currentSection);
      continue;
    }

    const itemMatch = line.match(/^-\s+(.+)/);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1].trim());
    }
  }

  if (current) releases.push(current);
  return releases;
}
