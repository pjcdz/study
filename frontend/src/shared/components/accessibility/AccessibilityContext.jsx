import React, { createContext, useState, useEffect, useContext } from 'react';
import translations from '../../utils/translations';

// Creamos el contexto de accesibilidad
export const AccessibilityContext = createContext();

// Hook personalizado para acceder al contexto más fácilmente
export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider = ({ children }) => {
  // Inicializamos el estado con valores predeterminados o valores guardados
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    // Detectar idioma del navegador si no hay uno guardado
    return savedLanguage || (navigator.language.startsWith('es') ? 'es' : 'en');
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
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Maneja el cambio de idioma
  const changeLanguage = (newLanguage) => {
    if (['en', 'es'].includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
    }
  };

  // Efecto para aplicar el tema al documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme;
  }, [theme]);

  // Valores que serán accesibles desde el contexto
  const value = {
    theme,
    language,
    toggleTheme,
    changeLanguage,
    t
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};