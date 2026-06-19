import type { ForgeConfig } from '@electron-forge/shared-types';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    npmRebuild: false,
    asarUnpack: '**/node_modules/xlsx/**',
    extraResource: ['./public/templates'],
    name: 'QA Test Scenarios',
    appBundleId: 'com.polskiepolisy.qa-test-scenarios',
    appCopyright: `Copyright © ${new Date().getFullYear()}`,
  },
  makers: [
    new MakerSquirrel({
      name: 'QATestScenarios',
      setupExe: 'QA-Test-Scenarios-Setup.exe',
      noMsi: true,
      authors: 'Polskie Polisy QA',
      description: 'Aplikacja do zarządzania scenariuszami testowymi QA',
    }),
    new MakerDMG({
      name: 'QA-Test-Scenarios',
      format: 'ULFO',
    }),
    new MakerZIP({}, ['win32', 'darwin']),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
};

export default config;
