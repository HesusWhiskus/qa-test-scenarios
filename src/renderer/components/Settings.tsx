import { useEffect, useState } from 'react';
import { useTheme, type FontSize, type Density } from '../hooks/useTheme';
import { useScenario } from '../hooks/useScenario';
import { Moon, Sun, Type, Rows3, Info, ScrollText } from 'lucide-react';
import * as ipc from '../lib/ipc';

const fontSizeOptions: { value: FontSize; label: string; desc: string }[] = [
  { value: 'small', label: 'Mały', desc: '13px' },
  { value: 'default', label: 'Domyślny', desc: '14px' },
  { value: 'large', label: 'Duży', desc: '16px' },
];

const densityOptions: { value: Density; label: string; desc: string }[] = [
  { value: 'compact', label: 'Kompaktowy', desc: 'Mniejsze odstępy, więcej treści na ekranie' },
  { value: 'comfortable', label: 'Wygodny', desc: 'Standardowe odstępy, lepsza czytelność' },
];

export function Settings() {
  const { dark, toggle, fontSize, setFontSize, density, setDensity } = useTheme();
  const { navigate } = useScenario();
  const [version, setVersion] = useState('…');

  useEffect(() => {
    ipc.getAppInfo().then(info => setVersion(info.version));
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Ustawienia</h1>

      <div className="space-y-6">
        <Section title="O aplikacji" icon={<Info size={16} />}>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            <strong className="text-slate-800 dark:text-slate-200">QA Test Scenarios</strong> v{version}
          </p>
          <p className="text-xs text-slate-400 mb-3">
            Aplikacja desktopowa do scenariuszy testowych QA (Windows i macOS).
          </p>
          <button
            type="button"
            onClick={() => navigate('changelog')}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ScrollText size={15} /> Historia zmian
          </button>
        </Section>

        <Section title="Motyw" icon={<Sun size={16} />}>
          <div className="flex gap-2">
            <OptionButton
              active={!dark}
              onClick={() => dark && toggle()}
              label="Jasny"
              icon={<Sun size={14} />}
            />
            <OptionButton
              active={dark}
              onClick={() => !dark && toggle()}
              label="Ciemny"
              icon={<Moon size={14} />}
            />
          </div>
        </Section>

        <Section title="Rozmiar tekstu" icon={<Type size={16} />}>
          <div className="flex gap-2">
            {fontSizeOptions.map(opt => (
              <OptionButton
                key={opt.value}
                active={fontSize === opt.value}
                onClick={() => setFontSize(opt.value)}
                label={opt.label}
                desc={opt.desc}
              />
            ))}
          </div>
        </Section>

        <Section title="Gęstość interfejsu" icon={<Rows3 size={16} />}>
          <div className="flex gap-2">
            {densityOptions.map(opt => (
              <OptionButton
                key={opt.value}
                active={density === opt.value}
                onClick={() => setDensity(opt.value)}
                label={opt.label}
                desc={opt.desc}
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 shadow-xs p-4">
      <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function OptionButton({
  active, onClick, label, desc, icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
        active
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {desc && <span className="text-[11px] text-slate-400 dark:text-slate-500">{desc}</span>}
    </button>
  );
}
