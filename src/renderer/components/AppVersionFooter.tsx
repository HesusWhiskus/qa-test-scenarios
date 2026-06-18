import { useEffect, useState } from 'react';
import * as ipc from '../lib/ipc';

interface AppVersionFooterProps {
  onOpenChangelog?: () => void;
  className?: string;
}

export function AppVersionFooter({ onOpenChangelog, className = '' }: AppVersionFooterProps) {
  const [version, setVersion] = useState('…');

  useEffect(() => {
    ipc.getAppInfo().then(info => setVersion(info.version));
  }, []);

  return (
    <div className={`text-center ${className}`}>
      {onOpenChangelog ? (
        <button
          type="button"
          onClick={onOpenChangelog}
          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Historia zmian"
        >
          QA Test Scenarios v{version}
        </button>
      ) : (
        <span className="text-[11px] text-slate-400">QA Test Scenarios v{version}</span>
      )}
    </div>
  );
}
