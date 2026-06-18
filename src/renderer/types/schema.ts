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
});
export type ItemResult = z.infer<typeof ItemResultSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string().default(''),
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
    version: 1,
    meta: { title, description: '', tags: [], createdAt: now, updatedAt: now },
    sections: [],
    runs: [],
  };
}

export function createSection(title: string, level: 1 | 2 = 1): Section {
  return { id: uuidv4(), title, level, visibilityTags: [], items: [] };
}

export function createItem(title: string): Item {
  return { id: uuidv4(), title, link: '' };
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
