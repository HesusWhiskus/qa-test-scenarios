import { useState, useEffect, useMemo, useRef } from 'react';
import { useScenario } from '../hooks/useScenario';
import type { Status, Section, Item } from '../types/schema';
import { getRunStats, formatRunDuration } from '../types/schema';
import { StatusSelector } from './shared/StatusBadge';
import { ProgressBar } from './shared/ProgressBar';
import { ScreenshotGallery } from './ScreenshotGallery';
import * as ipc from '../lib/ipc';
import {
  Search, Camera, ChevronDown, ChevronRight, Clipboard,
  RotateCcw, CheckCheck, Keyboard, ExternalLink, Bug,
} from 'lucide-react';

type FilterMode = 'all' | 'incomplete' | 'failed' | 'regression';

export function Runner() {
  const {
    scenario, filePath, currentRunId,
    setItemStatus, updateResult, addScreenshot, pasteScreenshot,
    removeScreenshot, updateScreenshotCaption,
    resetSection, bulkSetSection, getCurrentRun, selectRun, navigate,
    createYouTrackIssue, appSettings,
  } = useScenario();

  const [filter, setFilter] = useState<FilterMode>('all');
  const [search, setSearch] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [expandedExpected, setExpandedExpected] = useState<Set<string>>(new Set());
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [creatingIssue, setCreatingIssue] = useState<string | null>(null);

  const run = getCurrentRun();
  const youtrackConfigured = !!(appSettings?.youtrack.baseUrl && appSettings?.youtrack.projectId);

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
        if (search) {
          const q = search.toLowerCase();
          const hay = [item.title, item.testCaseId, item.expectedResult].join(' ').toLowerCase();
          if (!hay.includes(q)) continue;
        }
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
          setExpandedNotes(prev => new Set(prev).add(currentItem.item.id));
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

  const handleOpenLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url) ipc.openExternalUrl(url);
  };

  const handleYouTrack = async (e: React.MouseEvent, sectionId: string, itemId: string) => {
    e.stopPropagation();
    if (!run) return;
    setCreatingIssue(itemId);
    try {
      await createYouTrackIssue(run.id, sectionId, itemId);
    } finally {
      setCreatingIssue(null);
    }
  };

  if (!scenario || !run) {
    return <div className="p-8 text-center text-slate-400">Nie wybrano sesji. Przejdź do zakładki Sesje testowe.</div>;
  }

  const stats = getRunStats(run, scenario);
  const runs = [...scenario.runs].reverse();
  const duration = formatRunDuration(run);

  const formatRunLabel = (r: typeof run) =>
    r.meta.name || `Sesja ${new Date(r.meta.startedAt).toLocaleString('pl-PL')}`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{scenario.meta.title}</h2>
          {runs.length > 1 ? (
            <select
              value={currentRunId || ''}
              onChange={e => selectRun(e.target.value)}
              className="mt-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 max-w-full"
            >
              {runs.map(r => (
                <option key={r.id} value={r.id}>{formatRunLabel(r)}{r.meta.completedAt ? ' (zakończona)' : ''}</option>
              ))}
            </select>
          ) : (
            run.meta.name && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{run.meta.name}</p>
          )}
          <div className="text-[11px] text-slate-400 mt-1 flex gap-3 flex-wrap">
            {run.meta.environment && <span>Env: {run.meta.environment}</span>}
            {run.meta.buildVersion && <span>Build: {run.meta.buildVersion}</span>}
            {duration && <span>Czas: {duration}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => navigate('runs')}
            className="text-[12px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Sesje
          </button>
          <button
            onClick={() => setShowShortcuts(s => !s)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Skróty klawiszowe"
          >
            <Keyboard size={18} />
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm space-y-1 border border-blue-100 dark:border-blue-900">
          <p className="font-medium mb-1 text-blue-700 dark:text-blue-300">Skróty klawiszowe:</p>
          <p className="text-blue-600 dark:text-blue-400"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">↑↓</kbd> lub <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">K/J</kbd> nawigacja</p>
          <p className="text-blue-600 dark:text-blue-400"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">P</kbd> pass · <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">F</kbd> fail · <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">B</kbd> blocked · <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">S</kbd> skip</p>
          <p className="text-blue-600 dark:text-blue-400"><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono shadow-xs">N</kbd> toggle notatki · Ctrl+V wklej screenshot</p>
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
                  const showExpected = expandedExpected.has(item.id);

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
                        <div className="flex-1 min-w-0">
                          {item.testCaseId && (
                            <span className="text-[10px] font-mono text-slate-400 mr-1.5">{item.testCaseId}</span>
                          )}
                          <span className={`text-sm ${status === 'pass' ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.title}
                          </span>
                          {item.expectedResult && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setExpandedExpected(prev => {
                                  const next = new Set(prev);
                                  next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                                  return next;
                                });
                              }}
                              className="block text-[11px] text-slate-400 hover:text-slate-600 truncate max-w-full text-left"
                            >
                              Oczekiwany: {showExpected ? item.expectedResult : `${item.expectedResult.slice(0, 60)}${item.expectedResult.length > 60 ? '…' : ''}`}
                            </button>
                          )}
                        </div>
                        {item.link && (
                          <button
                            type="button"
                            onClick={e => handleOpenLink(e, item.link)}
                            className="text-[11px] text-blue-500 hover:underline font-mono flex items-center gap-0.5 flex-shrink-0"
                            title="Otwórz w YouTrack"
                          >
                            <ExternalLink size={11} /> issue
                          </button>
                        )}
                        {(status === 'fail' || status === 'blocked') && youtrackConfigured && !item.link && (
                          <button
                            type="button"
                            onClick={e => handleYouTrack(e, section.id, item.id)}
                            disabled={creatingIssue === item.id}
                            className="p-1 text-orange-400 hover:text-orange-600 transition-colors"
                            title="Utwórz w YouTrack"
                          >
                            <Bug size={14} />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); addScreenshot(run.id, item.id); }}
                          className="p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                          title="Dodaj screenshot z pliku"
                        >
                          <Camera size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); pasteScreenshot(run.id, item.id); }}
                          className="p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                          title="Wklej screenshot ze schowka"
                        >
                          <Clipboard size={14} />
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
                        <div className="mt-2 ml-16 space-y-2" onPaste={e => {
                          if (e.clipboardData.types.includes('Files') || e.clipboardData.types.includes('image/png')) {
                            e.preventDefault();
                            pasteScreenshot(run.id, item.id);
                          }
                        }}>
                          <textarea
                            value={notes}
                            onChange={e => updateResult(run.id, item.id, { notes: e.target.value })}
                            placeholder="Notatki do tego kroku..."
                            className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none transition-shadow"
                            rows={4}
                            onClick={e => e.stopPropagation()}
                          />
                          <ScreenshotGallery
                            scenarioPath={filePath}
                            screenshots={screenshots}
                            onRemove={filename => removeScreenshot(run.id, item.id, filename)}
                            onCaptionChange={(filename, caption) => updateScreenshotCaption(run.id, item.id, filename, caption)}
                          />
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
