/// <reference types="astro/client" />

declare global {
  interface Window {
    __lfSetTheme?: (isDark: boolean) => void;
  }
}

export {};
