declare module '*.md?raw' {
  const content: string;
  export default content;
}

import type { ElectronAPI } from '../main/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
