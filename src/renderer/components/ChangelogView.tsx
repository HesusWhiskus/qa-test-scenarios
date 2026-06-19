import { useMemo } from 'react';
import { useScenario } from '../hooks/useScenario';
import changelogRaw from '../../../CHANGELOG.md?raw';
import { parseChangelog } from '../lib/parse-changelog';
import { ScrollText, ArrowLeft } from 'lucide-react';

const releases = parseChangelog(changelogRaw);

export function ChangelogView() {
  const { navigate, appMode } = useScenario();
  const parsedReleases = useMemo(() => releases, []);

  const goBack = () => {
    if (appMode === 'hub') navigate('hub');
    else if (appMode === 'testing') navigate('picker');
    else navigate('catalog');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <button
        type="button"
        onClick={goBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
      >
        <ArrowLeft size={16} /> Wróć
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
          <ScrollText size={18} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Historia zmian</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Co nowego w QA Test Scenarios</p>
        </div>
      </div>

      <div className="space-y-6">
        {parsedReleases.map(release => (
          <div
            key={release.version}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-baseline gap-3">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                v{release.version}
              </h2>
              {release.date && (
                <span className="text-xs text-slate-400">{release.date}</span>
              )}
            </div>
            <div className="px-5 py-4 space-y-4">
              {release.sections.map(section => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {section.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-[13px] text-slate-600 dark:text-slate-400 flex gap-2 leading-relaxed">
                        <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
                        <span>{item.replace(/\*\*([^*]+)\*\*/g, '$1')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
