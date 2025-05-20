// Declaración global para asegurar que TypeScript reconozca gtag en window
interface Window {
  gtag: (
    command: 'event' | 'config' | 'set' | 'js',
    actionOrConfig: string | Date | { [key: string]: any },
    params?: { [key: string]: any }
  ) => void;
}

// Asegurar que la declaración se aplique globalmente
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set' | 'js',
      actionOrConfig: string | Date | { [key: string]: any },
      params?: { [key: string]: any }
    ) => void;
  }
}