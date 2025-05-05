import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityContext';
import { FiSun, FiMoon, FiGlobe, FiSettings } from 'react-icons/fi';

const AccessibilityOptions = () => {
  const { theme, toggleTheme, language, changeLanguage, t } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOptions = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="accessibility-options">
      {/* Botón para abrir/cerrar el panel */}
      <button 
        className="accessibility-toggle" 
        onClick={toggleOptions}
        aria-label={t('accessibilityOptions')}
        aria-expanded={isOpen}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 50,
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          border: 'none',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <FiSettings size={20} />
      </button>

      {/* Panel de opciones */}
      {isOpen && (
        <div 
          className="options-panel"
          style={{
            position: 'fixed',
            bottom: '130px',
            right: '20px',
            zIndex: 50,
            backgroundColor: 'var(--background-color)',
            borderRadius: '8px',
            padding: '16px',
            width: '220px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color)'
          }}
        >
          <h3 
            style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'var(--text-color)'
            }}
          >
            {t('accessibilityOptions')}
          </h3>
          
          {/* Selector de tema */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <label 
              htmlFor="theme-toggle"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-color)',
                fontSize: '14px'
              }}
            >
              {theme === 'light' ? <FiSun className="mr-2" /> : <FiMoon className="mr-2" />}
              {t('theme')}: {theme === 'light' ? t('light') : t('dark')}
            </label>
            <button 
              id="theme-toggle" 
              onClick={toggleTheme}
              aria-label={theme === 'light' ? t('switchToDark') : t('switchToLight')}
              className="theme-toggle-btn"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {theme === 'light' ? t('dark') : t('light')}
            </button>
          </div>
          
          {/* Selector de idioma */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <label 
              htmlFor="language-selector"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-color)',
                fontSize: '14px'
              }}
            >
              <FiGlobe className="mr-2" />
              {t('language')}:
            </label>
            <div className="language-buttons">
              <button 
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
                aria-label={t('switchToEnglish')}
                aria-pressed={language === 'en'}
                style={{
                  backgroundColor: language === 'en' ? 'var(--primary-color)' : 'var(--button-secondary)',
                  color: language === 'en' ? 'white' : 'var(--text-color)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  marginRight: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                EN
              </button>
              <button 
                className={`lang-btn ${language === 'es' ? 'active' : ''}`}
                onClick={() => changeLanguage('es')}
                aria-label={t('switchToSpanish')}
                aria-pressed={language === 'es'}
                style={{
                  backgroundColor: language === 'es' ? 'var(--primary-color)' : 'var(--button-secondary)',
                  color: language === 'es' ? 'white' : 'var(--text-color)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityOptions;