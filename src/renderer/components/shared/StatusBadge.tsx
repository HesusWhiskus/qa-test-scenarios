import { useState, useRef, useEffect } from 'react';
import type { Status } from '../../types/schema';
import { ChevronDown } from 'lucide-react';

const statusConfig: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: '—', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
  pass: { label: 'PASS', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  fail: { label: 'FAIL', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  blocked: { label: 'BLOCK', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  skipped: { label: 'SKIP', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
};

const ALL_STATUSES: Status[] = ['pending', 'pass', 'fail', 'blocked', 'skipped'];

export function nextStatus(current: Status): Status {
  const idx = ALL_STATUSES.indexOf(current);
  return ALL_STATUSES[(idx + 1) % ALL_STATUSES.length];
}

interface BadgeProps {
  status: Status;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, onClick, size = 'md' }: BadgeProps) {
  const c = statusConfig[status];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center font-bold rounded-md min-w-[52px] ${c.bg} ${c.text} ${sizeClass} ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} transition-opacity select-none`}
    >
      {c.label}
    </button>
  );
}

interface SelectorProps {
  status: Status;
  onSelect: (status: Status) => void;
}

export function StatusSelector({ status, onSelect }: SelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const c = statusConfig[status];

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <div className="flex items-center">
        <button
          onClick={() => onSelect(status === 'pass' ? 'pending' : 'pass')}
          className={`inline-flex items-center justify-center font-bold rounded-l-md min-w-[44px] text-xs px-2 py-1 ${c.bg} ${c.text} hover:opacity-80 transition-opacity select-none`}
        >
          {c.label}
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          className={`inline-flex items-center justify-center rounded-r-md text-xs px-1 py-1 ${c.bg} ${c.text} hover:opacity-70 transition-opacity select-none border-l border-black/5 dark:border-white/5`}
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-float border border-slate-200 dark:border-slate-700 py-1.5 min-w-[130px] animate-slide-up">
          {ALL_STATUSES.map(s => {
            const sc = statusConfig[s];
            const active = s === status;
            return (
              <button
                key={s}
                onClick={() => { onSelect(s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${active ? 'font-semibold' : ''}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
                <span className={sc.text}>{sc.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
