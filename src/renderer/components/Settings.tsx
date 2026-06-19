import { useEffect, useState } from 'react';
import { useTheme, type FontSize, type Density } from '../hooks/useTheme';
import { useScenario } from '../hooks/useScenario';
import { DEFAULT_FAIL_NOTE_TEMPLATE } from '../lib/settings-utils';
import { Moon, Sun, Type, Rows3, Info, ScrollText, User, Link2, Check, AlertCircle } from 'lucide-react';
import * as ipc from '../lib/ipc';
import type { TesterProfile, YouTrackConfig } from '../lib/ipc';
import { ProfileForm } from './ProfileForm';

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
  const { navigate, refreshSettings } = useScenario();
  const [version, setVersion] = useState('…');
  const [profile, setProfile] = useState<TesterProfile>({
    defaultTester: '', defaultEnvironment: '', defaultBuildVersion: '',
    environments: ['dev', 'staging', 'UAT', 'production'],
    failNoteTemplate: DEFAULT_FAIL_NOTE_TEMPLATE,
  });
  const [youtrack, setYoutrack] = useState<YouTrackConfig>({
    baseUrl: '', token: '', projectId: '', defaultIssueType: 'Bug', customFields: {},
  });
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    ipc.getAppInfo().then(info => setVersion(info.version));
    ipc.getSettings().then(s => {
      setProfile(s.profile);
      setYoutrack(s.youtrack);
    });
  }, []);

  const saveProfile = async () => {
    await ipc.updateSettings({ profile });
    await refreshSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveYouTrack = async () => {
    await ipc.updateSettings({ youtrack });
    await refreshSettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    await ipc.updateSettings({ youtrack });
    const result = await ipc.youtrackTestConnection();
    setTestResult(result.ok
      ? { ok: true, message: 'Połączenie działa.' }
      : { ok: false, message: result.error });
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Ustawienia</h1>

      {saved && (
        <div className="mb-4 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
          <Check size={14} /> Zapisano
        </div>
      )}

      <div className="space-y-6">
        <Section title="O aplikacji" icon={<Info size={16} />}>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            <strong className="text-slate-800 dark:text-slate-200">QA Test Scenarios</strong> v{version}
          </p>
          <button
            type="button"
            onClick={() => navigate('changelog')}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ScrollText size={15} /> Historia zmian
          </button>
        </Section>

        <Section title="Profil testera" icon={<User size={16} />}>
          <ProfileForm profile={profile} onChange={setProfile} mode="full" />
          <button type="button" onClick={saveProfile} className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Zapisz profil
          </button>
        </Section>

        <Section title="YouTrack" icon={<Link2 size={16} />}>
          <p className="text-xs text-slate-400 mb-3">
            Integracja REST API. Szczegóły konfiguracji: plik <code className="text-slate-500">YOUTRACK_SETUP.md</code> w repozytorium.
          </p>
          <div className="space-y-3">
            <Field label="URL instancji" value={youtrack.baseUrl} onChange={v => setYoutrack(y => ({ ...y, baseUrl: v }))} placeholder="https://firma.myjetbrains.com/youtrack" />
            <Field label="Token (Permanent)" value={youtrack.token} onChange={v => setYoutrack(y => ({ ...y, token: v }))} placeholder="perm:…" type="password" />
            <Field label="ID projektu" value={youtrack.projectId} onChange={v => setYoutrack(y => ({ ...y, projectId: v }))} placeholder="np. 0-0 lub shortName" />
            <Field label="Domyślny typ issue" value={youtrack.defaultIssueType} onChange={v => setYoutrack(y => ({ ...y, defaultIssueType: v }))} placeholder="Bug" />
            <Field label="Pole custom: Environment" value={youtrack.customFields.environment || ''} onChange={v => setYoutrack(y => ({ ...y, customFields: { ...y.customFields, environment: v } }))} placeholder="np. Environment" />
            <Field label="Pole custom: Build" value={youtrack.customFields.build || ''} onChange={v => setYoutrack(y => ({ ...y, customFields: { ...y.customFields, build: v } }))} placeholder="np. Build version" />
            <Field label="Pole custom: Type (nazwa)" value={youtrack.customFields.type || ''} onChange={v => setYoutrack(y => ({ ...y, customFields: { ...y.customFields, type: v } }))} placeholder="Type (domyślnie)" />
            <div className="flex gap-2">
              <button type="button" onClick={saveYouTrack} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Zapisz YouTrack</button>
              <button type="button" onClick={testConnection} className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Test połączenia</button>
            </div>
            {testResult && (
              <p className={`text-xs flex items-center gap-1 ${testResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                {testResult.ok ? <Check size={12} /> : <AlertCircle size={12} />}
                {testResult.message}
              </p>
            )}
          </div>
        </Section>

        <Section title="Motyw" icon={<Sun size={16} />}>
          <div className="flex gap-2">
            <OptionButton active={!dark} onClick={() => dark && toggle()} label="Jasny" icon={<Sun size={14} />} />
            <OptionButton active={dark} onClick={() => !dark && toggle()} label="Ciemny" icon={<Moon size={14} />} />
          </div>
        </Section>

        <Section title="Rozmiar tekstu" icon={<Type size={16} />}>
          <div className="flex gap-2">
            {fontSizeOptions.map(opt => (
              <OptionButton key={opt.value} active={fontSize === opt.value} onClick={() => setFontSize(opt.value)} label={opt.label} desc={opt.desc} />
            ))}
          </div>
        </Section>

        <Section title="Gęstość interfejsu" icon={<Rows3 size={16} />}>
          <div className="flex gap-2">
            {densityOptions.map(opt => (
              <OptionButton key={opt.value} active={density === opt.value} onClick={() => setDensity(opt.value)} label={opt.label} desc={opt.desc} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1 text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
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

function OptionButton({ active, onClick, label, desc, icon }: {
  active: boolean; onClick: () => void; label: string; desc?: string; icon?: React.ReactNode;
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
      <span className="flex items-center gap-1.5">{icon}{label}</span>
      {desc && <span className="text-[11px] text-slate-400 dark:text-slate-500">{desc}</span>}
    </button>
  );
}
