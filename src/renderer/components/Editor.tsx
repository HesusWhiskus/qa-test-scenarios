import { useState } from 'react';
import { useScenario } from '../hooks/useScenario';
import {
  Plus, Trash2, ChevronUp, ChevronDown, GripVertical,
  Tag, ChevronRight,
} from 'lucide-react';

export function Editor() {
  const {
    scenario, updateMeta,
    addSection, updateSection, removeSection, moveSection,
    addItem, updateItem, removeItem, moveItem,
  } = useScenario();

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionLevel, setNewSectionLevel] = useState<1 | 2>(1);
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());

  if (!scenario) return null;

  const toggleExpand = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    addSection(newSectionTitle.trim(), newSectionLevel);
    setNewSectionTitle('');
  };

  const handleAddItem = (sectionId: string) => {
    const title = newItemInputs[sectionId]?.trim();
    if (!title) return;
    addItem(sectionId, title);
    setNewItemInputs(prev => ({ ...prev, [sectionId]: '' }));
  };

  const toggleTag = (sectionId: string, tag: string) => {
    const section = scenario.sections.find(s => s.id === sectionId);
    if (!section) return;
    const tags = section.visibilityTags.includes(tag)
      ? section.visibilityTags.filter(t => t !== tag)
      : [...section.visibilityTags, tag];
    updateSection(sectionId, { visibilityTags: tags });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <input
          value={scenario.meta.title}
          onChange={e => updateMeta({ title: e.target.value })}
          className="text-2xl font-bold tracking-tight w-full bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-1 mb-3 text-slate-900 dark:text-slate-100"
          placeholder="Nazwa scenariusza"
        />
        <textarea
          value={scenario.meta.description}
          onChange={e => updateMeta({ description: e.target.value })}
          className="w-full bg-white dark:bg-slate-900 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 border border-slate-200 dark:border-slate-800 shadow-xs transition-shadow"
          rows={2}
          placeholder="Opis scenariusza (opcjonalnie)"
        />
      </div>

      <div className="space-y-3 mb-6">
        {scenario.sections.map((section, sIdx) => {
          const expanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-card border border-slate-200/60 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/50 dark:bg-slate-800/30">
                <button onClick={() => toggleExpand(section.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <ChevronRight size={16} className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
                </button>
                <GripVertical size={14} className="text-slate-300 dark:text-slate-700" />
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  section.level === 1
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                }`}>
                  H{section.level + 1}
                </span>
                <input
                  value={section.title}
                  onChange={e => updateSection(section.id, { title: e.target.value })}
                  className="flex-1 bg-transparent font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/40 rounded px-1 text-slate-800 dark:text-slate-200"
                />
                <span className="text-[11px] text-slate-400">{section.items.length} poz.</span>
                <button
                  onClick={() => toggleTag(section.id, 'regression')}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all duration-150 ${
                    section.visibilityTags.includes('regression')
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-orange-300 hover:text-orange-500'
                  }`}
                >
                  <Tag size={10} className="inline mr-0.5" />regresja
                </button>
                <button
                  onClick={() => toggleTag(section.id, 'full')}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all duration-150 ${
                    section.visibilityTags.includes('full')
                      ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-violet-300 hover:text-violet-500'
                  }`}
                >
                  <Tag size={10} className="inline mr-0.5" />pełny
                </button>
                <button onClick={() => moveSection(section.id, 'up')} disabled={sIdx === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronUp size={15} /></button>
                <button onClick={() => moveSection(section.id, 'down')} disabled={sIdx === scenario.sections.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronDown size={15} /></button>
                <button onClick={() => removeSection(section.id)} className="p-0.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
              </div>

              {expanded && (
                <div className="px-3 py-2.5 space-y-1 border-t border-slate-100 dark:border-slate-800/50">
                  {section.items.map((item, iIdx) => (
                    <div key={item.id} className="flex items-center gap-2 group py-0.5">
                      <GripVertical size={12} className="text-slate-200 dark:text-slate-700" />
                      <input
                        value={item.title}
                        onChange={e => updateItem(section.id, item.id, { title: e.target.value })}
                        className="flex-1 text-sm bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:outline-none py-1 text-slate-700 dark:text-slate-300"
                      />
                      <input
                        value={item.link || ''}
                        onChange={e => updateItem(section.id, item.id, { link: e.target.value })}
                        placeholder="Link/Issue"
                        className="w-28 text-[11px] bg-transparent border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:outline-none py-1 text-slate-400 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                      />
                      <button onClick={() => moveItem(section.id, item.id, 'up')} disabled={iIdx === 0} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 opacity-0 group-hover:opacity-100 transition-all"><ChevronUp size={13} /></button>
                      <button onClick={() => moveItem(section.id, item.id, 'down')} disabled={iIdx === section.items.length - 1} className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 opacity-0 group-hover:opacity-100 transition-all"><ChevronDown size={13} /></button>
                      <button onClick={() => removeItem(section.id, item.id)} className="p-0.5 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={13} /></button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <Plus size={12} className="text-slate-300" />
                    <input
                      value={newItemInputs[section.id] || ''}
                      onChange={e => setNewItemInputs(prev => ({ ...prev, [section.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddItem(section.id)}
                      placeholder="Dodaj pozycję..."
                      className="flex-1 text-sm bg-transparent border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-blue-400 focus:outline-none py-1 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 shadow-xs">
        <select
          value={newSectionLevel}
          onChange={e => setNewSectionLevel(Number(e.target.value) as 1 | 2)}
          className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value={1}>Sekcja (H2)</option>
          <option value={2}>Podsekcja (H3)</option>
        </select>
        <input
          value={newSectionTitle}
          onChange={e => setNewSectionTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSection()}
          placeholder="Nazwa nowej sekcji..."
          className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition-colors"
        />
        <button
          onClick={handleAddSection}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1 font-medium transition-colors"
        >
          <Plus size={15} /> Dodaj
        </button>
      </div>
    </div>
  );
}
