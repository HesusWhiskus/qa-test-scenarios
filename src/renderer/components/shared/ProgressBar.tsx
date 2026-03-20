interface Props {
  pass: number;
  fail: number;
  blocked: number;
  skipped: number;
  total: number;
  showLabel?: boolean;
}

export function ProgressBar({ pass, fail, blocked, skipped, total, showLabel = true }: Props) {
  if (total === 0) return null;
  const pct = (n: number) => (n / total) * 100;

  return (
    <div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
        {pass > 0 && <div className="bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${pct(pass)}%` }} />}
        {fail > 0 && <div className="bg-red-500 transition-all duration-500 ease-out" style={{ width: `${pct(fail)}%` }} />}
        {blocked > 0 && <div className="bg-amber-500 transition-all duration-500 ease-out" style={{ width: `${pct(blocked)}%` }} />}
        {skipped > 0 && <div className="bg-slate-300 dark:bg-slate-600 transition-all duration-500 ease-out" style={{ width: `${pct(skipped)}%` }} />}
      </div>
      {showLabel && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
          {pass}/{total} ({Math.round(pct(pass))}%)
          {fail > 0 && <span className="text-red-500 ml-2">{fail} fail</span>}
          {blocked > 0 && <span className="text-amber-500 ml-2">{blocked} blocked</span>}
        </div>
      )}
    </div>
  );
}
