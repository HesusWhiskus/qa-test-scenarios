import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type FontSize = 'small' | 'default' | 'large';
export type Density = 'compact' | 'comfortable';

interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  density: Density;
  setDensity: (density: Density) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggle: () => {},
  fontSize: 'default',
  setFontSize: () => {},
  density: 'comfortable',
  setDensity: () => {},
});

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '13px',
  default: '14px',
  large: '16px',
};

function applySettings(dark: boolean, fontSize: FontSize, density: Density) {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.fontSize = FONT_SIZE_MAP[fontSize];
  root.dataset.density = density;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [fontSize, setFontSizeState] = useState<FontSize>(
    () => (localStorage.getItem('fontSize') as FontSize) || 'default',
  );
  const [density, setDensityState] = useState<Density>(
    () => (localStorage.getItem('density') as Density) || 'comfortable',
  );

  useEffect(() => {
    applySettings(dark, fontSize, density);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('density', density);
  }, [dark, fontSize, density]);

  const toggle = useCallback(() => setDark(d => !d), []);
  const setFontSize = useCallback((s: FontSize) => setFontSizeState(s), []);
  const setDensity = useCallback((d: Density) => setDensityState(d), []);

  return (
    <ThemeContext.Provider value={{ dark, toggle, fontSize, setFontSize, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
