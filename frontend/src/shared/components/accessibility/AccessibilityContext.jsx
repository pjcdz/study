import React, { createContext, useState, useEffect, useContext } from 'react';
import translations from '../../utils/translations';
import { applyTheme, getPreferredTheme } from '../../utils/themeUtils';

// Creamos el contexto de accesibilidad
export const AccessibilityContext = createContext();

// Hook personalizado para acceder al contexto más fácilmente
export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider = ({ children }) => {
  // Inicializamos el estado con valores predeterminados o valores guardados
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('themePreference') || 'system';
  });
  
  const [theme, setTheme] = useState(() => {
    return getPreferredTheme();
  });
  
  const [languagePreference, setLanguagePreference] = useState(() => {
    return localStorage.getItem('languagePreference') || 'system';
  });
  
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      return savedLanguage;
    }
    // Detectar idioma del navegador si no hay uno guardado
    return navigator.language.startsWith('es') ? 'es' : 'en';
  });

  // Función para obtener traducciones según el idioma actual
  const t = (key) => {
    // Make sure translations object exists
    if (!translations || !translations[language]) {
      console.warn(`Missing translations for language: ${language}`);
      return key;
    }
    
    // Check if the translation exists
    if (!translations[language][key]) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      // Fallback al inglés si no existe la traducción
      return translations.en && translations.en[key] ? translations.en[key] : key;
    }
    
    return translations[language][key];
  };

  // Maneja el cambio de tema
  const toggleTheme = () => {
    if (themePreference === 'system') {
      // Si estaba usando el tema del sistema, cambia a light/dark explícito
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setThemePreference(newTheme);
      setTheme(newTheme);
      localStorage.setItem('themePreference', newTheme);
      localStorage.setItem('theme', newTheme);
    } else {
      // Si tenía un tema explícito, cambia al opuesto
      const newTheme = themePreference === 'light' ? 'dark' : 'light';
      setThemePreference(newTheme);
      setTheme(newTheme);
      localStorage.setItem('themePreference', newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };
  
  // Establecer explícitamente preferencia de tema
  const setExplicitThemePreference = (preference) => {
    if (preference === 'system') {
      setThemePreference('system');
      localStorage.setItem('themePreference', 'system');
      localStorage.removeItem('theme');
      
      // Aplicar tema del sistema
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } else {
      setThemePreference(preference);
      setTheme(preference);
      localStorage.setItem('themePreference', preference);
      localStorage.setItem('theme', preference);
    }
  };

  // Maneja el cambio de idioma
  const changeLanguage = (newLanguage) => {
    if (newLanguage === 'system') {
      setLanguagePreference('system');
      localStorage.setItem('languagePreference', 'system');
      localStorage.removeItem('language');
      
      // Obtener idioma del navegador
      const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
      setLanguage(browserLang);
    } else if (['en', 'es'].includes(newLanguage)) {
      setLanguagePreference(newLanguage);
      setLanguage(newLanguage);
      localStorage.setItem('languagePreference', newLanguage);
      localStorage.setItem('language', newLanguage);
    }
  };

  // Efecto para aplicar el tema al documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    
    // Utilizar la función de themeUtils para aplicar variables CSS
    applyTheme(theme);
    
    // Configurar preferencias de color para el tema del navegador
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (!metaThemeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = theme === 'dark' ? '#111827' : '#f3f4f6';
      document.head.appendChild(meta);
    } else {
      metaThemeColor.content = theme === 'dark' ? '#111827' : '#f3f4f6';
    }
    
  }, [theme]);

  // Configurar listener para cambios en las preferencias del sistema
  useEffect(() => {
    // Detectar cambios en la preferencia de tema del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      // Solo cambiar si está configurado para usar el tema del sistema
      if (themePreference === 'system') {
        const systemTheme = e.matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }
    };
    
    // Aplicar tema del sistema al cargar si está configurado para usarlo
    if (themePreference === 'system') {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
    
    // Añadir event listener para detectar cambios
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleSystemThemeChange);
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        // Fallback para navegadores antiguos
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [themePreference]);
  
  // Efecto para actualizar el idioma cuando cambia la preferencia del sistema
  useEffect(() => {
    const handleLanguageChange = () => {
      if (languagePreference === 'system') {
        const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
        setLanguage(browserLang);
      }
    };
    
    // Asegurarse de que el idioma refleje la configuración actual
    handleLanguageChange();
    
    // No hay un buen evento para detectar cambios de idioma del navegador,
    // pero podemos verificarlo cuando la ventana vuelve a tener foco
    window.addEventListener('focus', handleLanguageChange);
    
    return () => {
      window.removeEventListener('focus', handleLanguageChange);
    };
  }, [languagePreference]);

  // Valores que serán accesibles desde el contexto
  const value = {
    theme,
    themePreference,
    language,
    languagePreference,
    toggleTheme,
    setExplicitThemePreference,
    changeLanguage,
    t
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};