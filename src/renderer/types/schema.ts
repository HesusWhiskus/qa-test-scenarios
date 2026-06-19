import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const StatusEnum = z.enum(['pending', 'pass', 'fail', 'blocked', 'skipped']);
export type Status = z.infer<typeof StatusEnum>;

export const ScreenshotSchema = z.object({
  filename: z.string(),
  relativePath: z.string().optional(),
  caption: z.string().default(''),
});
export type Screenshot = z.infer<typeof ScreenshotSchema>;

export const ItemResultSchema = z.object({
  status: StatusEnum.default('pending'),
  notes: z.string().default(''),
  screenshots: z.array(ScreenshotSchema).default([]),
  testedAt: z.string().optional(),
});
export type ItemResult = z.infer<typeof ItemResultSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string().default(''),
  testCaseId: z.string().default(''),
  preconditions: z.string().default(''),
  expectedResult: z.string().default(''),
});
export type Item = z.infer<typeof ItemSchema>;

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.number().min(1).max(2).default(1),
  visibilityTags: z.array(z.string()).default([]),
  items: z.array(ItemSchema).default([]),
});
export type Section = z.infer<typeof SectionSchema>;

export const RunMetaSchema = z.object({
  name: z.string().default(''),
  environment: z.string().default(''),
  buildVersion: z.string().default(''),
  tester: z.string().default(''),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  clonedFromRunId: z.string().optional(),
});
export type RunMeta = z.infer<typeof RunMetaSchema>;

export const RunSchema = z.object({
  id: z.string(),
  meta: RunMetaSchema,
  results: z.record(z.string(), ItemResultSchema).default({}),
});
export type Run = z.infer<typeof RunSchema>;

export const ScenarioMetaSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ScenarioMeta = z.infer<typeof ScenarioMetaSchema>;

export const ScenarioSchema = z.object({
  version: z.number().default(1),
  meta: ScenarioMetaSchema,
  sections: z.array(SectionSchema).default([]),
  runs: z.array(RunSchema).default([]),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export function createScenario(title: string): Scenario {
  const now = new Date().toISOString();
  return {
    version: 2,
    meta: { title, description: '', tags: [], createdAt: now, updatedAt: now },
    sections: [],
    runs: [],
  };
}

export function createSection(title: string, level: 1 | 2 = 1): Section {
  return { id: uuidv4(), title, level, visibilityTags: [], items: [] };
}

export function createItem(title: string): Item {
  return { id: uuidv4(), title, link: '', testCaseId: '', preconditions: '', expectedResult: '' };
}

export function createRun(meta: Partial<RunMeta> = {}): Run {
  return {
    id: uuidv4(),
    meta: {
      name: '',
      environment: '',
      buildVersion: '',
      tester: '',
      startedAt: new Date().toISOString(),
      ...meta,
    },
    results: {},
  };
}

export function getAllItems(scenario: Scenario): Item[] {
  return scenario.sections.flatMap(s => s.items);
}

export function getRunStats(run: Run, scenario: Scenario) {
  const allItems = getAllItems(scenario);
  const total = allItems.length;
  let pass = 0, fail = 0, blocked = 0, skipped = 0, pending = 0;
  for (const item of allItems) {
    const status = run.results[item.id]?.status || 'pending';
    switch (status) {
      case 'pass': pass++; break;
      case 'fail': fail++; break;
      case 'blocked': blocked++; break;
      case 'skipped': skipped++; break;
      default: pending++; break;
    }
  }
  return { total, pass, fail, blocked, skipped, pending, percent: total ? Math.round((pass / total) * 100) : 0 };
}

export function formatRunDuration(run: Run): string | null {
  if (!run.meta.completedAt) return null;
  const ms = new Date(run.meta.completedAt).getTime() - new Date(run.meta.startedAt).getTime();
  if (ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  if (mins > 0) return `${mins} min`;
  return `${Math.round(ms / 1000)} s`;
}

export function migrateScenario(data: unknown): Scenario | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  const version = typeof raw.version === 'number' ? raw.version : 1;

  if (version < 2 && Array.isArray(raw.sections)) {
    for (const section of raw.sections as Record<string, unknown>[]) {
      if (!Array.isArray(section.items)) continue;
      for (const item of section.items as Record<string, unknown>[]) {
        if (item.testCaseId === undefined) item.testCaseId = '';
        if (item.preconditions === undefined) item.preconditions = '';
        if (item.expectedResult === undefined) item.expectedResult = '';
      }
    }
    raw.version = 2;
  }

  const validated = ScenarioSchema.safeParse(raw);
  return validated.success ? validated.data : null;
}
