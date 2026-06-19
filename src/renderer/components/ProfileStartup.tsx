import { useEffect, useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { useScenario } from '../hooks/useScenario';
import { DEFAULT_FAIL_NOTE_TEMPLATE } from '../lib/settings-utils';
import type { TesterProfile } from '../lib/ipc';
import { ProfileForm } from './ProfileForm';
import { AppVersionFooter } from './AppVersionFooter';

const DEFAULT_PROFILE: TesterProfile = {
  defaultTester: '',
  defaultEnvironment: '',
  defaultBuildVersion: '',
  environments: ['dev', 'staging', 'UAT', 'production'],
  failNoteTemplate: DEFAULT_FAIL_NOTE_TEMPLATE,
};

export function ProfileStartup() {
  const { appSettings, completeStartup } = useScenario();
  const [profile, setProfile] = useState<TesterProfile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appSettings?.profile) {
      setProfile(appSettings.profile);
    }
  }, [appSettings]);

  if (!appSettings) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-sm text-slate-400">Ładowanie…</p>
      </div>
    );
  }

  const canContinue = profile.defaultTester.trim().length > 0;

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    try {
      await completeStartup({
        ...appSettings.profile,
        ...profile,
        defaultTester: profile.defaultTester.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mx-auto mb-4">
              <User size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1.5">QA Test Scenarios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Uzupełnij profil przed rozpoczęciem pracy
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800 p-6 mb-6">
            <ProfileForm profile={profile} onChange={setProfile} mode="basic" />
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-xs transition-colors"
          >
            {saving ? 'Zapisywanie…' : 'Kontynuuj'}
            {!saving && <ArrowRight size={16} />}
          </button>

          <p className="text-[11px] text-slate-400 text-center mt-3">
            Pełne ustawienia (szablon notatki, YouTrack) dostępne później w menu Ustawienia.
          </p>
        </div>
      </div>
      <AppVersionFooter className="py-4 border-t border-slate-200/60 dark:border-slate-800" />
    </div>
  );
}
