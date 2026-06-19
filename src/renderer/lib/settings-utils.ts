export const DEFAULT_FAIL_NOTE_TEMPLATE = `Kroki reprodukcji:
1. 

Oczekiwany rezultat:

Rzeczywisty rezultat:

Środowisko: {{environment}} | Build: {{build}}`;

export function applyFailNoteTemplate(
  template: string,
  vars: { environment: string; build: string; expectedResult?: string },
): string {
  return template
    .replace(/\{\{environment\}\}/g, vars.environment || '—')
    .replace(/\{\{build\}\}/g, vars.build || '—')
    .replace(/\{\{expectedResult\}\}/g, vars.expectedResult || '—');
}
