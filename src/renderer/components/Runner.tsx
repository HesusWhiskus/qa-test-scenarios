import { useState, useEffect, useMemo, useRef } from 'react';
import { useScenario } from '../hooks/useScenario';
import type { Status, Section, Item } from '../types/schema';
import { getRunStats } from '../types/schema';
import { StatusSelector } from './shared/StatusBadge';
import { ProgressBar } from './shared/ProgressBar';
import {
  Search, Camera, ChevronDown, ChevronRight,
  RotateCcw, CheckCheck, Keyboard,
} from 'lucide-react';

type FilterMode = 'all' | 'incomplete' | 'failed' | 'regression';

export function Runner() {
  const {
    scenario, currentRunId,
    setItemStatus, updateResult, addScreenshot,
    resetSection, bulkSetSection, getCurrentRun,
  } = useScenario();

  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const run = getCurrentRun();

  const visibleItems = useMemo(() => {
    if (!scenario || !run) return [];
    const items: { section: Section; item: Item }[] = [];
    for (const section of scenario.sections) {
      if (filter === 'regression' && section.visibilityTags.includes('full')) continue;
      if (filter === 'regression' && !section.visibilityTags.includes('regression') && section.visibilityTags.length > 0) continue;
      for (const item of section.items) {
        const status = run.results[item.id]?.status || 'pending';
        if (filter === 'incomplete' && status !== 'pending') continue;
        if (filter === 'failed' && status !== 'fail') continue;
        if (search && !item.title.toLowerCase().includes(search.toLowerCase())) continue;
        items.push({ section, item });
      }
    }
    return items;
  }, [scenario, run, filter, search]);

  const groupedSections = useMemo(() => {
    const groups: { section: Section; items: { item: Item; flatIdx: number }[] }[] = [];
    for (let i = 0; i < visibleItems.length; i++) {
      const vi = visibleItems[i];
      const last = groups[groups.length - 1];
      if (last && last.section.id === vi.section.id) {
        last.items.push({ item: vi.item, flatIdx: i });
      } else {
        groups.push({ section: vi.section, items: [{ item: vi.item, flatIdx: i }] });
      }
    }
    return groups;
  }, [visibleItems]);

  const selectedIdxRef = useRef(selectedIdx);
  selectedIdxRef.current = selectedIdx;
  const visibleItemsRef = useRef(visibleItems);
  visibleItemsRef.current = visibleItems;

  useEffect(() => {
    if (!run) return;
    const runId = run.id;

    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const items = visibleItemsRef.current;
      const idx = selectedIdxRef.current;
      const currentItem = items[idx];
      if (!currentItem && !['arrowdown', 'arrowup', 'j', 'k'].includes(e.key.toLowerCase())) return;

      switch (e.key.toLowerCase()) {
        case 'arrowdown':
        case 'j':
          e.preventDefault();
          setSelectedIdx(i => Math.min(i + 1, items.length - 1));
          break;
        case 'arrowup':
        case 'k':
          e.preventDefault();
          setSelectedIdx(i => Math.max(i - 1, 0));
          break;
        case 'p':
          e.preventDefault();
          setItemStatus(runId, currentItem.item.id, 'pass');
          setSelectedIdx(i => Math.min(i + 1, items.length - 1));
          break;
        case 'f':
          e.preventDefault();
          setItemStatus(runId, currentItem.item.id, 'fail');
          break;
        case 'b':
          e.preventDefault();
          setItemStatus(runId, currentItem.item.id, 'blocked');
          break;
        case 's':
          e.preventDefault();
          setItemStatus(runId, currentItem.item.id, 'skipped');
          setSelectedIdx(i => Math.min(i + 1, items.length - 1));
          break;
        case 'n':
          e.preventDefault();
          toggleNotes(currentItem.item.id);
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [run?.id, setItemStatus]);

  useEffect(() => {
    const el = document.getElementById(`runner-item-${visibleItems[selectedIdx]?.item.id}`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIdx, visibleItems]);

  const toggleNotes = (itemId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  if (!scenario || !run) {
    return <div className="p-8 text-center text-slate-400">Nie wybrano przebiegu. Przejdź do zakładki Przebiegi.</div>;
  }

  const stats = getRunStats(run, scenario);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{scenario.meta.title}</h2>
          {run.meta.name && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{run.meta.name}</p>}
        </div>
        <button
          onClick={() => setShowShortcuts(s => !s)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Skróty klawiszowe"
        >
          <Keyboard size={18} />
        </button>
      </div>

      {showShortcuts && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm space-y-1 border border-blue-100 dark:border-blue-900">
          <p className="font-medium mb-1 text-blue-700 dark:text-blue-300">Skróty klawiszowe:</p>
          <p className="text-blue-600 dark:text-blue-400"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">↑↓</kbd> lub <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">K/J</kbd> nawigacja</p>
          <p className="text-blue-600 dark:text-blue-400"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">P</kbd> pass · <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">F</kbd> fail · <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">B</kbd> blocked · <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">S</kbd> skip</p>
          <p className="text-blue-600 dark:text-blue-400"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">N</kbd> toggle notatki</p>
        </div>
      )}

      <div className="mb-5">
        <ProgressBar {...stats} />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
            placeholder="Szukaj kroków..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 shadow-xs transition-shadow"
          />
        </div>
        {(['all', 'incomplete', 'failed', 'regression'] as FilterMode[]).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedIdx(0); }}
            className={`px-3 py-2 text-[13px] rounded-lg transition-all duration-150 whitespace-nowrap font-medium ${
              filter === f
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
            }`}
          >
            {{ all: 'Wszystkie', incomplete: 'Niezakończone', failed: 'Nieudane', regression: 'Regresja' }[f]}
          </button>
        ))}
      </div>

      <div className="space-y-6 runner-section-gap">
        {groupedSections.map(({ section, items }) => {
          const sectionAllItems = section.items;
          const sectionStats = {
            total: sectionAllItems.length,
            pass: sectionAllItems.filter(i => (run.results[i.id]?.status || 'pending') === 'pass').length,
            fail: sectionAllItems.filter(i => (run.results[i.id]?.status || 'pending') === 'fail').length,
            blocked: sectionAllItems.filter(i => (run.results[i.id]?.status || 'pending') === 'blocked').length,
            skipped: sectionAllItems.filter(i => (run.results[i.id]?.status || 'pending') === 'skipped').length,
          };

          return (
            <div key={section.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-semibold ${section.level === 1 ? 'text-base text-slate-800 dark:text-slate-200' : 'text-sm text-slate-500 dark:text-slate-400'}`}>
                  {section.title}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">{sectionStats.pass}/{sectionStats.total}</span>
                  <button onClick={() => bulkSetSection(run.id, section.id, 'pass')} className="p-1 text-slate-300 hover:text-emerald-600 transition-colors rounded" title="Wszystkie pass">
                    <CheckCheck size={15} />
                  </button>
                  <button onClick={() => resetSection(run.id, section.id)} className="p-1 text-slate-300 hover:text-amber-600 transition-colors rounded" title="Reset sekcji">
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>
              <div className="mb-2.5">
                <ProgressBar {...sectionStats} showLabel={false} />
              </div>
              <div className="space-y-px bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                {items.map(({ item, flatIdx }) => {
                  const result = run.results[item.id];
                  const status: Status = result?.status || 'pending';
                  const notes = result?.notes || '';
                  const screenshots = result?.screenshots || [];
                  const isSelected = flatIdx === selectedIdx;
                  const isNotesOpen = expandedNotes.has(item.id);

                  return (
                    <div
                      key={item.id}
                      id={`runner-item-${item.id}`}
                      onClick={() => setSelectedIdx(flatIdx)}
                      className={`runner-item px-3 py-2 transition-colors cursor-pointer border-l-2 ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/20 border-l-blue-500'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <StatusSelector
                          status={status}
                          onSelect={s => setItemStatus(run.id, item.id, s)}
                        />
                        <span className={`flex-1 text-sm ${status === 'pass' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.title}
                        </span>
                        {item.link && (
                          <span className="text-[11px] text-blue-500 font-mono">{item.link}</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); addScreenshot(run.id, item.id); }}
                          className="p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                          title="Dodaj screenshot"
                        >
                          <Camera size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleNotes(item.id); }}
                          className={`p-1 transition-colors ${isNotesOpen || notes ? 'text-blue-400' : 'text-slate-300 hover:text-slate-500 dark:hover:text-slate-400'}`}
                          title="Notatki"
                        >
                          {isNotesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>
                      {isNotesOpen && (
                        <div className="mt-2 ml-16 space-y-2">
                          <textarea
                            value={notes}
                            onChange={e => updateResult(run.id, item.id, { notes: e.target.value })}
                            placeholder="Notatki do tego kroku..."
                            className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none transition-shadow"
                            rows={3}
                            onClick={e => e.stopPropagation()}
                          />
                          {screenshots.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {screenshots.map((ss, i) => (
                                <div key={i} className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md flex items-center gap-1 text-slate-500">
                                  <Camera size={11} /> {ss.caption || ss.filename}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {visibleItems.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          Brak pozycji pasujących do filtrów.
        </div>
      )}
    </div>
  );
}
