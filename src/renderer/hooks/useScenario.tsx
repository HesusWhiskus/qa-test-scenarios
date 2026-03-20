import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { Scenario, Section, Item, Run, RunMeta, ItemResult, Status } from '../types/schema';
import { createScenario, createSection, createItem, createRun } from '../types/schema';
import * as ipc from '../lib/ipc';

export type View = 'home' | 'editor' | 'runs' | 'runner' | 'export' | 'help';

interface PendingOpen {
  scenario: Scenario;
  filePath: string;
}

interface ScenarioState {
  scenario: Scenario | null;
  filePath: string | null;
  currentView: View;
  currentRunId: string | null;
  isDirty: boolean;
  recentFiles: string[];
  pendingOpen: PendingOpen | null;
}

interface ScenarioContextType extends ScenarioState {
  navigate: (view: View, runId?: string | null) => void;
  newScenario: (title: string) => void;
  loadFromTemplate: (scenario: Scenario) => void;
  openScenario: () => Promise<void>;
  openRecentFile: (path: string) => Promise<void>;
  confirmOpen: (view: View) => void;
  cancelOpen: () => void;
  saveScenario: () => Promise<void>;
  saveAsScenario: () => Promise<void>;
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
  updateResult: (runId: string, itemId: string, updates: Partial<ItemResult>) => void;
  setItemStatus: (runId: string, itemId: string, status: Status) => void;
  addScreenshot: (runId: string, itemId: string) => Promise<void>;
  resetSection: (runId: string, sectionId: string) => void;
  bulkSetSection: (runId: string, sectionId: string, status: Status) => void;
  getCurrentRun: () => Run | null;
}

const ScenarioContext = createContext<ScenarioContextType | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScenarioState>({
    scenario: null,
    filePath: null,
    currentView: 'home',
    currentRunId: null,
    isDirty: false,
    recentFiles: [],
    pendingOpen: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    ipc.getRecentFiles().then(files => {
      setState(s => ({ ...s, recentFiles: files }));
    });
  }, []);

  useEffect(() => {
    if (state.isDirty && state.filePath && state.scenario) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        const s = stateRef.current;
        if (s.filePath && s.scenario) {
          ipc.saveScenario(s.filePath, s.scenario).then(() => {
            setState(prev => ({ ...prev, isDirty: false }));
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

  const loadFromTemplate = useCallback((scenario: Scenario) => {
    const now = new Date().toISOString();
    const fresh: Scenario = {
      ...JSON.parse(JSON.stringify(scenario)),
      meta: { ...scenario.meta, createdAt: now, updatedAt: now },
      runs: [],
    };
    setState(s => ({
      ...s,
      scenario: fresh,
      filePath: null,
      currentView: 'editor',
      currentRunId: null,
      isDirty: false,
      pendingOpen: null,
    }));
  }, []);

  const handleFileOpened = useCallback(async (result: { filePath: string; scenario: Scenario }) => {
    const recentFiles = await ipc.getRecentFiles();
    const hasRuns = result.scenario.runs && result.scenario.runs.length > 0;

    if (hasRuns) {
      setState(s => ({
        ...s,
        pendingOpen: { scenario: result.scenario, filePath: result.filePath },
        recentFiles,
      }));
    } else {
      setState(s => ({
        ...s,
        scenario: result.scenario,
        filePath: result.filePath,
        currentView: 'editor',
        currentRunId: null,
        isDirty: false,
        recentFiles,
        pendingOpen: null,
      }));
    }
  }, []);

  const openScenarioAction = useCallback(async () => {
    const result = await ipc.openScenario();
    if (!result) return;
    await handleFileOpened(result);
  }, [handleFileOpened]);

  const openRecentFile = useCallback(async (path: string) => {
    const result = await ipc.readScenario(path);
    if (!result) return;
    await handleFileOpened(result);
  }, [handleFileOpened]);

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

  const cancelOpen = useCallback(() => {
    setState(s => ({ ...s, pendingOpen: null }));
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

  const saveAsScenario = useCallback(async () => {
    const s = stateRef.current;
    if (!s.scenario) return;
    const savedPath = await ipc.saveScenario(null, s.scenario);
    if (savedPath) {
      const recentFiles = await ipc.getRecentFiles();
      setState(prev => ({ ...prev, filePath: savedPath, isDirty: false, recentFiles }));
    }
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
    setState(s => ({ ...s, currentRunId: run.id, currentView: 'runner' }));
    return run.id;
  }, [updateScenario]);

  const completeRun = useCallback((runId: string) => {
    updateScenario(s => ({
      ...s,
      runs: s.runs.map(r =>
        r.id === runId ? { ...r, meta: { ...r.meta, completedAt: new Date().toISOString() } } : r
      ),
    }));
  }, [updateScenario]);

  const deleteRun = useCallback((runId: string) => {
    updateScenario(s => ({ ...s, runs: s.runs.filter(r => r.id !== runId) }));
    setState(s => s.currentRunId === runId ? { ...s, currentRunId: null, currentView: 'runs' } : s);
  }, [updateScenario]);

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
    updateResult(runId, itemId, { status });
  }, [updateResult]);

  const addScreenshot = useCallback(async (runId: string, itemId: string) => {
    const s = stateRef.current;
    let currentPath = s.filePath;
    if (!currentPath) {
      currentPath = await ipc.saveScenario(null, s.scenario!);
      if (!currentPath) return;
      setState(prev => ({ ...prev, filePath: currentPath }));
    }
    const result = await ipc.copyScreenshot(currentPath);
    if (!result) return;

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
              screenshots: [...existing.screenshots, { filename: result.filename, caption: '' }],
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

  const getCurrentRun = useCallback((): Run | null => {
    const s = stateRef.current;
    if (!s.scenario || !s.currentRunId) return null;
    return s.scenario.runs.find(r => r.id === s.currentRunId) || null;
  }, []);

  const value: ScenarioContextType = {
    ...state,
    navigate,
    newScenario,
    loadFromTemplate,
    openScenario: openScenarioAction,
    openRecentFile,
    confirmOpen,
    cancelOpen,
    saveScenario: saveScenarioAction,
    saveAsScenario,
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
    updateResult,
    setItemStatus,
    addScreenshot,
    resetSection,
    bulkSetSection,
    getCurrentRun,
  };

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider');
  return ctx;
}
