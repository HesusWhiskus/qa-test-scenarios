import type { YouTrackConfig } from './settings';

export interface YouTrackIssue {
  id: string;
  idReadable: string;
  summary: string;
  url: string;
}

export interface CreateIssuePayload {
  summary: string;
  description: string;
  environment?: string;
  buildVersion?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function testYouTrackConnection(
  config: YouTrackConfig,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!config.baseUrl || !config.token) {
    return { ok: false, error: 'Uzupełnij URL i token YouTrack w Ustawieniach.' };
  }
  try {
    const url = `${normalizeBaseUrl(config.baseUrl)}/api/admin/projects?fields=id,shortName,name&$top=1`;
    const res = await fetch(url, { headers: authHeaders(config.token) });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Nieprawidłowy token lub brak uprawnień.' };
    }
    if (!res.ok) {
      return { ok: false, error: `YouTrack zwrócił błąd HTTP ${res.status}.` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Błąd połączenia z YouTrack.' };
  }
}

function buildCustomFields(config: YouTrackConfig, payload: CreateIssuePayload): unknown[] {
  const fields: unknown[] = [];

  if (config.defaultIssueType) {
    fields.push({
      name: config.customFields.type || 'Type',
      $type: 'SingleEnumIssueCustomField',
      value: { name: config.defaultIssueType },
    });
  }

  if (payload.environment && config.customFields.environment) {
    fields.push({
      name: config.customFields.environment,
      $type: 'SingleEnumIssueCustomField',
      value: { name: payload.environment },
    });
  }

  if (payload.buildVersion && config.customFields.build) {
    fields.push({
      name: config.customFields.build,
      $type: 'SimpleIssueCustomField',
      value: payload.buildVersion,
    });
  }

  return fields;
}

export async function createYouTrackIssue(
  config: YouTrackConfig,
  payload: CreateIssuePayload,
): Promise<YouTrackIssue | { error: string }> {
  if (!config.baseUrl || !config.token || !config.projectId) {
    return { error: 'Skonfiguruj URL, token i ID projektu YouTrack w Ustawieniach.' };
  }

  const base = normalizeBaseUrl(config.baseUrl);
  const body: Record<string, unknown> = {
    project: { id: config.projectId },
    summary: payload.summary.slice(0, 255),
    description: payload.description,
  };

  const customFields = buildCustomFields(config, payload);
  if (customFields.length > 0) body.customFields = customFields;

  try {
    const res = await fetch(`${base}/api/issues?fields=id,idReadable,summary`, {
      method: 'POST',
      headers: authHeaders(config.token),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `Nie udało się utworzyć issue (HTTP ${res.status}): ${text.slice(0, 200)}` };
    }

    const data = await res.json() as { id: string; idReadable: string; summary: string };
    return {
      id: data.id,
      idReadable: data.idReadable,
      summary: data.summary,
      url: `${base}/issue/${data.idReadable}`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Błąd tworzenia issue.' };
  }
}

export async function uploadYouTrackAttachment(
  config: YouTrackConfig,
  issueId: string,
  filename: string,
  buffer: Buffer,
): Promise<boolean> {
  const base = normalizeBaseUrl(config.baseUrl);
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(buffer)]), filename);

  try {
    const res = await fetch(`${base}/api/issues/${issueId}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' },
      body: form,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function searchYouTrackIssues(
  config: YouTrackConfig,
  query: string,
): Promise<YouTrackIssue[] | { error: string }> {
  if (!config.baseUrl || !config.token) {
    return { error: 'Skonfiguruj YouTrack w Ustawieniach.' };
  }

  const base = normalizeBaseUrl(config.baseUrl);
  const q = query.trim();
  if (!q) return [];

  const searchQuery = q.includes('-') || /^\d+$/.test(q) ? `id: ${q}` : `summary: {${q}}`;

  try {
    const url = `${base}/api/issues?query=${encodeURIComponent(searchQuery)}&fields=id,idReadable,summary&$top=10`;
    const res = await fetch(url, { headers: authHeaders(config.token) });
    if (!res.ok) return { error: `Wyszukiwanie nie powiodło się (HTTP ${res.status}).` };

    const data = await res.json() as { id: string; idReadable: string; summary: string }[];
    return data.map(item => ({
      id: item.id,
      idReadable: item.idReadable,
      summary: item.summary,
      url: `${base}/issue/${item.idReadable}`,
    }));
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Błąd wyszukiwania.' };
  }
}
