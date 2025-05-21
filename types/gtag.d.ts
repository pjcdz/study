// To make this file a module, add an export statement
export {};

// Declare global augmentation for window.gtag
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set' | 'js',
      actionOrConfig: string | Date | { [key: string]: any },
      params?: { [key: string]: any }
    ) => void;
  }
}