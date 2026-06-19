import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { Scenario, Section, Item, Run, RunMeta, ItemResult, Status, Screenshot } from '../types/schema';
import { createScenario, createSection, createItem, createRun } from '../types/schema';
import { applyFailNoteTemplate } from '../lib/settings-utils';
import { buildRetestResults } from '../lib/run-diff';
import { buildYouTrackDescription } from '../lib/markdown-export';
import * as ipc from '../lib/ipc';
import type { AppSettings, TesterProfile } from '../lib/ipc';

export type AppMode = 'startup' | 'hub' | 'testing' | 'library';
export type View = 'hub' | 'picker' | 'catalog' | 'editor' | 'runs' | 'runner' | 'export' | 'help' | 'settings' | 'changelog';

interface PendingOpen {
  scenario: Scenario;
  filePath: string;
}

interface ScenarioState {
  appMode: AppMode;
  scenario: Scenario | null;
  filePath: string | null;
  currentView: View;
  currentRunId: string | null;
  isDirty: boolean;
  recentFiles: string[];
  pendingOpen: PendingOpen | null;
  flashMessage: string | null;
  completedRunId: string | null;
  appSettings: AppSettings | null;
}

interface ScenarioContextType extends ScenarioState {
  navigate: (view: View, runId?: string | null) => void;
  enterTestingMode: () => void;
  enterLibraryMode: () => void;
  returnToHub: () => void;
  switchToLibraryForEdit: () => void;
  dismissCompletedBanner: () => void;
  newScenario: (title: string) => void;
  loadFromTemplate: (scenario: Scenario) => Promise<void>;
  openScenario: () => Promise<void>;
  openRecentFile: (path: string, preferMode?: AppMode) => Promise<void>;
  openSavedScenario: (filePath: string) => Promise<void>;
  confirmOpen: (view: View) => void;
  confirmOpenNewRun: () => void;
  cancelOpen: () => void;
  showFlash: (message: string) => void;
  saveScenario: () => Promise<void>;
  saveAsScenario: () => Promise<string | null>;
  ensureScenarioSaved: () => Promise<string | null>;
  duplicateScenario: () => Promise<void>;
  updateMeta: (meta: Partial<Scenario['meta']>) => void;
  addSection: (title: string, level?: 1 | 2) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, direction: 'up' | 'down') => void;
  addItem: (sectionId: string, title: string) => void;
  updateItem: (sectionId: string, itemId: string, updates: Partial<Item>) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  moveItem: (sectionId: string, itemId: string, direction: 'up' | 'down') => void;
  createNewRun: (meta: Partial<RunMeta>) => string;
  completeRun: (runId: string) => void;
  deleteRun: (runId: string) => void;
  selectRun: (runId: string) => void;
  updateResult: (runId: string, itemId: string, updates: Partial<ItemResult>) => void;
  setItemStatus: (runId: string, itemId: string, status: Status) => void;
  addScreenshot: (runId: string, itemId: string) => Promise<void>;
  pasteScreenshot: (runId: string, itemId: string) => Promise<void>;
  removeScreenshot: (runId: string, itemId: string, filename: string) => Promise<void>;
  updateScreenshotCaption: (runId: string, itemId: string, filename: string, caption: string) => void;
  resetSection: (runId: string, sectionId: string) => void;
  bulkSetSection: (runId: string, sectionId: string, status: Status) => void;
  cloneRetestRun: (sourceRunId: string, onlyFailed?: boolean) => string;
  importExcelScenario: () => Promise<void>;
  createYouTrackIssue: (runId: string, sectionId: string, itemId: string) => Promise<string | null>;
  refreshSettings: () => Promise<void>;
  completeStartup: (profile: TesterProfile) => Promise<void>;
  getCurrentRun: () => Run | null;
}

const ScenarioContext = createContext<ScenarioContextType | null>(null);

function cloneFreshScenario(scenario: Scenario): Scenario {
  const now = new Date().toISOString();
  return {
    ...JSON.parse(JSON.stringify(scenario)),
    meta: { ...scenario.meta, createdAt: now, updatedAt: now },
    runs: [],
  };
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScenarioState>({
    appMode: 'startup',
    scenario: null,
    filePath: null,
    currentView: 'hub',
    currentRunId: null,
    isDirty: false,
    recentFiles: [],
    pendingOpen: null,
    flashMessage: null,
    completedRunId: null,
    appSettings: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showFlash = useCallback((message: string) => {
    clearTimeout(flashTimer.current);
    setState(s => ({ ...s, flashMessage: message }));
    flashTimer.current = setTimeout(() => {
      setState(s => ({ ...s, flashMessage: null }));
    }, 5000);
  }, []);

  const refreshSettings = useCallback(async () => {
    const settings = await ipc.getSettings();
    setState(s => ({ ...s, appSettings: settings }));
  }, []);

  const completeStartup = useCallback(async (profile: TesterProfile) => {
    const settings = await ipc.updateSettings({ profile });
    setState(s => ({
      ...s,
      appSettings: settings,
      appMode: 'hub',
      currentView: 'hub',
    }));
  }, []);

  useEffect(() => {
    Promise.all([ipc.getRecentFiles(), ipc.getSettings()]).then(([files, settings]) => {
      setState(s => ({ ...s, recentFiles: files, appSettings: settings }));
    });
  }, []);

  useEffect(() => {
    if (state.isDirty && state.filePath && state.scenario) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        const s = stateRef.current;
        if (s.filePath && s.scenario) {
          ipc.saveScenario(s.filePath, s.scenario).then(savedPath => {
            if (savedPath) {
              setState(prev => ({ ...prev, isDirty: false }));
            }
          });
        }
      }, 2000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [state.isDirty, state.filePath, state.scenario]);

  const updateScenario = useCallback((updater: (s: Scenario) => Scenario) => {
    setState(prev => {
      if (!prev.scenario) return prev;
      const updated = updater(prev.scenario);
      updated.meta.updatedAt = new Date().toISOString();
      return { ...prev, scenario: updated, isDirty: true };
    });
  }, []);

  const navigate = useCallback((view: View, runId?: string | null) => {
    setState(s => ({ ...s, currentView: view, currentRunId: runId !== undefined ? runId : s.currentRunId }));
  }, []);

  const enterTestingMode = useCallback(() => {
    setState(s => ({
      ...s,
      appMode: 'testing',
      currentView: 'picker',
      scenario: null,
      filePath: null,
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
      completedRunId: null,
    }));
  }, []);

  const enterLibraryMode = useCallback(() => {
    setState(s => ({
      ...s,
      appMode: 'library',
      currentView: 'catalog',
      scenario: null,
      filePath: null,
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
      completedRunId: null,
    }));
  }, []);

  const returnToHub = useCallback(() => {
    setState(s => ({
      ...s,
      appMode: 'hub',
      currentView: 'hub',
      scenario: null,
      filePath: null,
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
      completedRunId: null,
    }));
  }, []);

  const switchToLibraryForEdit = useCallback(() => {
    setState(s => ({
      ...s,
      appMode: 'library',
      currentView: 'editor',
      currentRunId: null,
      completedRunId: null,
    }));
  }, []);

  const dismissCompletedBanner = useCallback(() => {
    setState(s => ({ ...s, completedRunId: null }));
  }, []);

  const newScenario = useCallback((title: string) => {
    setState(s => ({
      ...s,
      scenario: createScenario(title),
      filePath: null,
      currentView: 'editor',
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
    }));
  }, []);

  const loadFromTemplate = useCallback(async (scenario: Scenario) => {
    const fresh = cloneFreshScenario(scenario);
    const mode = stateRef.current.appMode;
    if (mode === 'library') {
      setState(s => ({
        ...s,
        scenario: fresh,
        filePath: null,
        currentView: 'editor',
        currentRunId: null,
        isDirty: false,
        pendingOpen: null,
      }));
      return;
    }

    const savedPath = await ipc.saveScenario(null, fresh, { autoSave: true });
    if (!savedPath) {
      showFlash('Nie udało się zapisać scenariusza na dysku.');
    }
    const recentFiles = savedPath ? await ipc.getRecentFiles() : stateRef.current.recentFiles;

    setState(s => ({
      ...s,
      appMode: 'testing',
      scenario: fresh,
      filePath: savedPath,
      currentView: 'runs',
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
      recentFiles,
    }));
  }, [showFlash]);

  const applyOpenedFile = useCallback((
    result: { filePath: string; scenario: Scenario },
    mode: AppMode,
    recentFiles: string[],
  ) => {
    const hasRuns = result.scenario.runs && result.scenario.runs.length > 0;

    if (mode === 'library') {
      setState(s => ({
        ...s,
        appMode: 'library',
        scenario: result.scenario,
        filePath: result.filePath,
        currentView: 'editor',
        currentRunId: null,
        isDirty: false,
        recentFiles,
        pendingOpen: null,
      }));
      return;
    }

    if (hasRuns) {
      setState(s => ({
        ...s,
        appMode: 'testing',
        pendingOpen: { scenario: result.scenario, filePath: result.filePath },
        recentFiles,
      }));
    } else {
      setState(s => ({
        ...s,
        appMode: 'testing',
        scenario: result.scenario,
        filePath: result.filePath,
        currentView: 'runs',
        currentRunId: null,
        isDirty: false,
        recentFiles,
        pendingOpen: null,
      }));
    }
  }, []);

  const handleOpenError = useCallback((error: ipc.ScenarioReadError) => {
    const message =
      error === 'invalid_schema'
        ? 'Nieprawidłowy format pliku scenariusza.'
        : 'Nie udało się odczytać pliku scenariusza.';
    showFlash(message);
  }, [showFlash]);

  const openScenarioAction = useCallback(async () => {
    const result = await ipc.openScenario();
    if (!result) return;
    if ('error' in result) {
      handleOpenError(result.error);
      return;
    }
    const recentFiles = await ipc.getRecentFiles();
    const mode = stateRef.current.appMode === 'library' ? 'library' : 'testing';
    applyOpenedFile(result, mode, recentFiles);
  }, [applyOpenedFile, handleOpenError]);

  const openRecentFile = useCallback(async (path: string, preferMode: AppMode = 'testing') => {
    const result = await ipc.readScenario(path);
    if (!result) return;
    if ('error' in result) {
      handleOpenError(result.error);
      return;
    }
    const recentFiles = await ipc.getRecentFiles();
    applyOpenedFile(result, preferMode, recentFiles);
  }, [applyOpenedFile, handleOpenError]);

  const openSavedScenario = useCallback(async (filePath: string) => {
    const result = await ipc.readScenario(filePath);
    if (!result) return;
    if ('error' in result) {
      handleOpenError(result.error);
      return;
    }
    const recentFiles = await ipc.getRecentFiles();
    applyOpenedFile(result, 'testing', recentFiles);
  }, [applyOpenedFile, handleOpenError]);

  const confirmOpen = useCallback((view: View) => {
    const pending = stateRef.current.pendingOpen;
    if (!pending) return;
    setState(s => ({
      ...s,
      scenario: pending.scenario,
      filePath: pending.filePath,
      currentView: view,
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
    }));
  }, []);

  const confirmOpenNewRun = useCallback(() => {
    const pending = stateRef.current.pendingOpen;
    if (!pending) return;
    const run = createRun();
    const scenarioWithRun: Scenario = {
      ...pending.scenario,
      runs: [...pending.scenario.runs, run],
    };
    setState(s => ({
      ...s,
      scenario: scenarioWithRun,
      filePath: pending.filePath,
      currentView: 'runner',
      currentRunId: run.id,
      isDirty: true,
      pendingOpen: null,
    }));
  }, []);

  const cancelOpen = useCallback(() => {
    setState(s => ({ ...s, pendingOpen: null, currentView: 'picker' }));
  }, []);

  const saveScenarioAction = useCallback(async () => {
    const s = stateRef.current;
    if (!s.scenario) return;
    const savedPath = await ipc.saveScenario(s.filePath, s.scenario);
    if (savedPath) {
      const recentFiles = await ipc.getRecentFiles();
      setState(prev => ({ ...prev, filePath: savedPath, isDirty: false, recentFiles }));
    }
  }, []);

  const saveAsScenario = useCallback(async (): Promise<string | null> => {
    const s = stateRef.current;
    if (!s.scenario) return null;
    const savedPath = await ipc.saveScenario(null, s.scenario);
    if (savedPath) {
      const recentFiles = await ipc.getRecentFiles();
      setState(prev => ({ ...prev, filePath: savedPath, isDirty: false, recentFiles }));
    }
    return savedPath;
  }, []);

  const ensureScenarioSaved = useCallback(async (): Promise<string | null> => {
    const s = stateRef.current;
    if (!s.scenario) return null;
    if (s.filePath) return s.filePath;
    const savedPath = await ipc.saveScenario(null, s.scenario, { autoSave: true });
    if (savedPath) {
      const recentFiles = await ipc.getRecentFiles();
      setState(prev => ({ ...prev, filePath: savedPath, isDirty: false, recentFiles }));
    }
    return savedPath;
  }, []);

  const duplicateScenario = useCallback(async () => {
    const s = stateRef.current;
    if (!s.scenario) return;
    const now = new Date().toISOString();
    const dup: Scenario = {
      ...s.scenario,
      meta: { ...s.scenario.meta, title: `${s.scenario.meta.title} (kopia)`, createdAt: now, updatedAt: now },
      runs: [],
    };
    const savedPath = await ipc.saveScenario(null, dup);
    if (savedPath) {
      const recentFiles = await ipc.getRecentFiles();
      setState(prev => ({ ...prev, scenario: dup, filePath: savedPath, isDirty: false, currentRunId: null, recentFiles }));
    }
  }, []);

  const updateMeta = useCallback((meta: Partial<Scenario['meta']>) => {
    updateScenario(s => ({ ...s, meta: { ...s.meta, ...meta } }));
  }, [updateScenario]);

  const addSection = useCallback((title: string, level: 1 | 2 = 1) => {
    updateScenario(s => ({ ...s, sections: [...s.sections, createSection(title, level)] }));
  }, [updateScenario]);

  const updateSection = useCallback((id: string, updates: Partial<Section>) => {
    updateScenario(s => ({
      ...s,
      sections: s.sections.map(sec => sec.id === id ? { ...sec, ...updates } : sec),
    }));
  }, [updateScenario]);

  const removeSection = useCallback((id: string) => {
    updateScenario(s => ({ ...s, sections: s.sections.filter(sec => sec.id !== id) }));
  }, [updateScenario]);

  const moveSection = useCallback((id: string, direction: 'up' | 'down') => {
    updateScenario(s => {
      const idx = s.sections.findIndex(sec => sec.id === id);
      if (idx < 0) return s;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= s.sections.length) return s;
      const sections = [...s.sections];
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return { ...s, sections };
    });
  }, [updateScenario]);

  const addItem = useCallback((sectionId: string, title: string) => {
    updateScenario(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, items: [...sec.items, createItem(title)] } : sec
      ),
    }));
  }, [updateScenario]);

  const updateItem = useCallback((sectionId: string, itemId: string, updates: Partial<Item>) => {
    updateScenario(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId
          ? { ...sec, items: sec.items.map(it => it.id === itemId ? { ...it, ...updates } : it) }
          : sec
      ),
    }));
  }, [updateScenario]);

  const removeItem = useCallback((sectionId: string, itemId: string) => {
    updateScenario(s => ({
      ...s,
      sections: s.sections.map(sec =>
        sec.id === sectionId ? { ...sec, items: sec.items.filter(it => it.id !== itemId) } : sec
      ),
    }));
  }, [updateScenario]);

  const moveItem = useCallback((sectionId: string, itemId: string, direction: 'up' | 'down') => {
    updateScenario(s => ({
      ...s,
      sections: s.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        const idx = sec.items.findIndex(it => it.id === itemId);
        if (idx < 0) return sec;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= sec.items.length) return sec;
        const items = [...sec.items];
        [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
        return { ...sec, items };
      }),
    }));
  }, [updateScenario]);

  const createNewRun = useCallback((meta: Partial<RunMeta>): string => {
    const run = createRun(meta);
    updateScenario(s => ({ ...s, runs: [...s.runs, run] }));
    setState(s => ({ ...s, currentRunId: run.id, currentView: 'runner', completedRunId: null }));
    return run.id;
  }, [updateScenario]);

  const completeRun = useCallback((runId: string) => {
    updateScenario(s => ({
      ...s,
      runs: s.runs.map(r =>
        r.id === runId ? { ...r, meta: { ...r.meta, completedAt: new Date().toISOString() } } : r
      ),
    }));
    setState(s => ({ ...s, completedRunId: runId, currentRunId: runId }));
  }, [updateScenario]);

  const deleteRun = useCallback((runId: string) => {
    updateScenario(s => ({ ...s, runs: s.runs.filter(r => r.id !== runId) }));
    setState(s => s.currentRunId === runId
      ? { ...s, currentRunId: null, currentView: 'runs', completedRunId: null }
      : s);
  }, [updateScenario]);

  const selectRun = useCallback((runId: string) => {
    setState(s => ({ ...s, currentRunId: runId }));
  }, []);

  const updateResult = useCallback((runId: string, itemId: string, updates: Partial<ItemResult>) => {
    updateScenario(s => ({
      ...s,
      runs: s.runs.map(r => {
        if (r.id !== runId) return r;
        const existing = r.results[itemId] || { status: 'pending' as const, notes: '', screenshots: [] };
        return { ...r, results: { ...r.results, [itemId]: { ...existing, ...updates } } };
      }),
    }));
  }, [updateScenario]);

  const setItemStatus = useCallback((runId: string, itemId: string, status: Status) => {
    const s = stateRef.current;
    const run = s.scenario?.runs.find(r => r.id === runId);
    const existing = run?.results[itemId];
    const now = new Date().toISOString();

    if (status === 'fail' && !existing?.notes?.trim() && s.appSettings?.profile.failNoteTemplate) {
      const item = s.scenario?.sections.flatMap(sec => sec.items).find(i => i.id === itemId);
      const notes = applyFailNoteTemplate(s.appSettings.profile.failNoteTemplate, {
        environment: run?.meta.environment || s.appSettings.profile.defaultEnvironment,
        build: run?.meta.buildVersion || s.appSettings.profile.defaultBuildVersion,
        expectedResult: item?.expectedResult,
      });
      updateResult(runId, itemId, { status, notes, testedAt: now });
      return;
    }

    updateResult(runId, itemId, { status, testedAt: now });
  }, [updateResult]);

  const attachScreenshot = useCallback((runId: string, itemId: string, result: { filename: string; relativePath: string }) => {
    updateScenario(sc => ({
      ...sc,
      runs: sc.runs.map(r => {
        if (r.id !== runId) return r;
        const existing = r.results[itemId] || { status: 'pending' as const, notes: '', screenshots: [] };
        return {
          ...r,
          results: {
            ...r.results,
            [itemId]: {
              ...existing,
              screenshots: [...existing.screenshots, { filename: result.filename, relativePath: result.relativePath, caption: '' }],
            },
          },
        };
      }),
    }));
  }, [updateScenario]);

  const addScreenshot = useCallback(async (runId: string, itemId: string) => {
    const s = stateRef.current;
    let currentPath = s.filePath;
    if (!currentPath) {
      currentPath = await ipc.saveScenario(null, s.scenario!);
      if (!currentPath) {
        showFlash('Zapisz scenariusz na dysku, aby dołączyć screenshoty.');
        return;
      }
      setState(prev => ({ ...prev, filePath: currentPath }));
    }
    const result = await ipc.copyScreenshot(currentPath);
    if (!result) return;
    attachScreenshot(runId, itemId, result);
  }, [attachScreenshot, showFlash]);

  const pasteScreenshotAction = useCallback(async (runId: string, itemId: string) => {
    const s = stateRef.current;
    let currentPath = s.filePath;
    if (!currentPath) {
      currentPath = await ipc.saveScenario(null, s.scenario!);
      if (!currentPath) {
        showFlash('Zapisz scenariusz na dysku, aby dołączyć screenshoty.');
        return;
      }
      setState(prev => ({ ...prev, filePath: currentPath }));
    }
    const result = await ipc.pasteScreenshot(currentPath);
    if (!result) {
      showFlash('Schowek nie zawiera obrazu.');
      return;
    }
    attachScreenshot(runId, itemId, result);
  }, [attachScreenshot, showFlash]);

  const removeScreenshot = useCallback(async (runId: string, itemId: string, filename: string) => {
    const s = stateRef.current;
    if (s.filePath) {
      await ipc.deleteScreenshot(s.filePath, filename);
    }
    updateScenario(sc => ({
      ...sc,
      runs: sc.runs.map(r => {
        if (r.id !== runId) return r;
        const existing = r.results[itemId];
        if (!existing) return r;
        return {
          ...r,
          results: {
            ...r.results,
            [itemId]: {
              ...existing,
              screenshots: existing.screenshots.filter(ss => ss.filename !== filename),
            },
          },
        };
      }),
    }));
  }, [updateScenario]);

  const updateScreenshotCaption = useCallback((runId: string, itemId: string, filename: string, caption: string) => {
    updateScenario(sc => ({
      ...sc,
      runs: sc.runs.map(r => {
        if (r.id !== runId) return r;
        const existing = r.results[itemId];
        if (!existing) return r;
        return {
          ...r,
          results: {
            ...r.results,
            [itemId]: {
              ...existing,
              screenshots: existing.screenshots.map((ss: Screenshot) =>
                ss.filename === filename ? { ...ss, caption } : ss
              ),
            },
          },
        };
      }),
    }));
  }, [updateScenario]);

  const resetSection = useCallback((runId: string, sectionId: string) => {
    const s = stateRef.current;
    const section = s.scenario?.sections.find(sec => sec.id === sectionId);
    if (!section) return;
    updateScenario(sc => ({
      ...sc,
      runs: sc.runs.map(r => {
        if (r.id !== runId) return r;
        const newResults = { ...r.results };
        for (const item of section.items) {
          newResults[item.id] = { status: 'pending', notes: '', screenshots: [] };
        }
        return { ...r, results: newResults };
      }),
    }));
  }, [updateScenario]);

  const bulkSetSection = useCallback((runId: string, sectionId: string, status: Status) => {
    const s = stateRef.current;
    const section = s.scenario?.sections.find(sec => sec.id === sectionId);
    if (!section) return;
    updateScenario(sc => ({
      ...sc,
      runs: sc.runs.map(r => {
        if (r.id !== runId) return r;
        const newResults = { ...r.results };
        for (const item of section.items) {
          const existing = newResults[item.id] || { status: 'pending' as const, notes: '', screenshots: [] };
          newResults[item.id] = { ...existing, status };
        }
        return { ...r, results: newResults };
      }),
    }));
  }, [updateScenario]);

  const cloneRetestRun = useCallback((sourceRunId: string, onlyFailed = false): string => {
    const s = stateRef.current;
    const source = s.scenario?.runs.find(r => r.id === sourceRunId);
    if (!s.scenario || !source) return '';

    const results = buildRetestResults(s.scenario, source, onlyFailed);
    const run = createRun({
      name: `${source.meta.name || 'Sesja'} — re-test`,
      environment: source.meta.environment,
      buildVersion: source.meta.buildVersion,
      tester: source.meta.tester,
      clonedFromRunId: sourceRunId,
    });
    run.results = results;

    updateScenario(sc => ({ ...sc, runs: [...sc.runs, run] }));
    setState(prev => ({ ...prev, currentRunId: run.id, currentView: 'runner', completedRunId: null }));
    return run.id;
  }, [updateScenario]);

  const importExcelScenario = useCallback(async () => {
    const result = await ipc.importExcel();
    if (!result) return;
    if ('error' in result) {
      showFlash(result.error);
      return;
    }
    setState(s => ({
      ...s,
      scenario: result,
      filePath: null,
      currentView: 'editor',
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
      appMode: 'library',
    }));
  }, [showFlash]);

  const createYouTrackIssueAction = useCallback(async (runId: string, sectionId: string, itemId: string): Promise<string | null> => {
    const s = stateRef.current;
    if (!s.scenario) return null;
    const run = s.scenario.runs.find(r => r.id === runId);
    const section = s.scenario.sections.find(sec => sec.id === sectionId);
    const item = section?.items.find(i => i.id === itemId);
    if (!run || !section || !item) return null;

    const prefix = item.testCaseId ? `[${item.testCaseId}] ` : '';
    const summary = `${prefix}${item.title}`.slice(0, 255);
    const description = buildYouTrackDescription(s.scenario, run, section, item);
    const result = run.results[itemId];
    const attachments = result?.screenshots?.map(ss => ({ filename: ss.filename })) || [];

    const issue = await ipc.youtrackCreateIssue({
      summary,
      description,
      environment: run.meta.environment,
      buildVersion: run.meta.buildVersion,
      scenarioPath: s.filePath || undefined,
      attachments,
    });

    if ('error' in issue) {
      showFlash(issue.error);
      return null;
    }

    updateItem(sectionId, itemId, { link: issue.url });
    showFlash(`Utworzono ${issue.idReadable} w YouTrack`);
    return issue.url;
  }, [showFlash, updateItem]);

  const getCurrentRun = useCallback((): Run | null => {
    const s = stateRef.current;
    if (!s.scenario || !s.currentRunId) return null;
    return s.scenario.runs.find(r => r.id === s.currentRunId) || null;
  }, []);

  const value: ScenarioContextType = {
    ...state,
    navigate,
    enterTestingMode,
    enterLibraryMode,
    returnToHub,
    switchToLibraryForEdit,
    dismissCompletedBanner,
    newScenario,
    loadFromTemplate,
    openScenario: openScenarioAction,
    openRecentFile,
    openSavedScenario,
    confirmOpen,
    confirmOpenNewRun,
    cancelOpen,
    showFlash,
    saveScenario: saveScenarioAction,
    saveAsScenario,
    ensureScenarioSaved,
    duplicateScenario,
    updateMeta,
    addSection,
    updateSection,
    removeSection,
    moveSection,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    createNewRun,
    completeRun,
    deleteRun,
    selectRun,
    updateResult,
    setItemStatus,
    addScreenshot,
    pasteScreenshot: pasteScreenshotAction,
    removeScreenshot,
    updateScreenshotCaption,
    resetSection,
    bulkSetSection,
    cloneRetestRun,
    importExcelScenario,
    createYouTrackIssue: createYouTrackIssueAction,
    refreshSettings,
    completeStartup,
    getCurrentRun,
  };

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider');
  return ctx;
}
