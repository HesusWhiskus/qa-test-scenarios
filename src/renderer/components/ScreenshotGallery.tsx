import { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import * as ipc from '../lib/ipc';
import type { Screenshot } from '../types/schema';

interface ScreenshotGalleryProps {
  scenarioPath: string | null;
  screenshots: Screenshot[];
  onRemove: (filename: string) => void;
  onCaptionChange: (filename: string, caption: string) => void;
}

export function ScreenshotGallery({ scenarioPath, screenshots, onRemove, onCaptionChange }: ScreenshotGalleryProps) {
  const [preview, setPreview] = useState<{ src: string; caption: string } | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!scenarioPath) return;
    let cancelled = false;
    for (const ss of screenshots) {
      ipc.readScreenshot(scenarioPath, ss.filename).then(src => {
        if (!cancelled && src) {
          setThumbs(prev => ({ ...prev, [ss.filename]: src }));
        }
      });
    }
    return () => { cancelled = true; };
  }, [scenarioPath, screenshots]);

  if (screenshots.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {screenshots.map(ss => (
          <div key={ss.filename} className="relative group">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                const src = thumbs[ss.filename];
                if (src) setPreview({ src, caption: ss.caption || ss.filename });
              }}
              className="block w-16 h-16 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            >
              {thumbs[ss.filename] ? (
                <img src={thumbs[ss.filename]} alt={ss.caption || ss.filename} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">…</div>
              )}
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove(ss.filename); }}
              className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Usuń"
            >
              <Trash2 size={10} />
            </button>
            <input
              value={ss.caption}
              onChange={e => onCaptionChange(ss.filename, e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Podpis"
              className="mt-1 w-16 text-[10px] px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
            />
          </div>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -top-3 -right-3 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-lg"
            >
              <X size={16} />
            </button>
            <img src={preview.src} alt={preview.caption} className="max-w-full max-h-[80vh] rounded-lg" />
            <p className="text-center text-white text-sm mt-2">{preview.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}
