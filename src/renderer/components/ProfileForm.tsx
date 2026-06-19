import { useState } from 'react';
import type { TesterProfile } from '../lib/ipc';

interface ProfileFormProps {
  profile: TesterProfile;
  onChange: (profile: TesterProfile) => void;
  mode?: 'basic' | 'full';
}

export function ProfileForm({ profile, onChange, mode = 'full' }: ProfileFormProps) {
  const [envInput, setEnvInput] = useState('');

  const update = (partial: Partial<TesterProfile>) => {
    onChange({ ...profile, ...partial });
  };

  const addEnvironment = () => {
    const v = envInput.trim();
    if (!v || profile.environments.includes(v)) return;
    update({ environments: [...profile.environments, v] });
    setEnvInput('');
  };

  return (
    <div className="space-y-3">
      <Field
        label="Tester"
        value={profile.defaultTester}
        onChange={v => update({ defaultTester: v })}
        placeholder="Imię i nazwisko"
        required
      />

      {mode === 'basic' ? (
        <div>
          <label className="block text-[11px] font-medium mb-1 text-slate-400">Domyślne środowisko</label>
          <div className="flex gap-2">
            <select
              value={profile.environments.includes(profile.defaultEnvironment) ? profile.defaultEnvironment : ''}
              onChange={e => {
                if (e.target.value) update({ defaultEnvironment: e.target.value });
              }}
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">— wybierz —</option>
              {profile.environments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
            <input
              value={profile.defaultEnvironment}
              onChange={e => update({ defaultEnvironment: e.target.value })}
              placeholder="lub wpisz"
              className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>
      ) : (
        <Field
          label="Domyślne środowisko"
          value={profile.defaultEnvironment}
          onChange={v => update({ defaultEnvironment: v })}
        />
      )}

      <Field
        label="Domyślny build"
        value={profile.defaultBuildVersion}
        onChange={v => update({ defaultBuildVersion: v })}
        placeholder="np. 1.2.0"
      />

      {mode === 'full' && (
        <>
          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-400">Lista środowisk</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {profile.environments.map(env => (
                <span key={env} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                  {env}
                  <button
                    type="button"
                    onClick={() => update({ environments: profile.environments.filter(e => e !== env) })}
                    className="text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={envInput}
                onChange={e => setEnvInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEnvironment()}
                placeholder="Dodaj środowisko"
                className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
              />
              <button type="button" onClick={addEnvironment} className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 rounded-lg">
                Dodaj
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-400">Szablon notatki przy Fail</label>
            <textarea
              value={profile.failNoteTemplate}
              onChange={e => update({ failNoteTemplate: e.target.value })}
              rows={6}
              className="w-full text-xs font-mono p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
            />
            <p className="text-[10px] text-slate-400 mt-1">Zmienne: {'{{environment}}'}, {'{{build}}'}, {'{{expectedResult}}'}</p>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1 text-slate-400">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      />
    </div>
  );
}
