import React, { useState } from 'react';
import { useAccessibility } from './AccessibilityContext';
import { FiSun, FiMoon, FiGlobe, FiSettings, FiMonitor } from 'react-icons/fi';

const AccessibilityOptions = () => {
  const { theme, themePreference, setExplicitThemePreference, language, languagePreference, changeLanguage, t } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOptions = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="accessibility-options">
      {/* Botón para abrir/cerrar el panel */}
      <button 
        className={`accessibility-toggle ${isOpen ? 'active' : ''}`}
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
          boxShadow: '0 2px 10px var(--shadow-color)',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          transition: 'transform 0.3s ease, background-color 0.3s'
        }}
      >
        <FiSettings size={20} />
      </button>

      {/* Panel de opciones */}
      {isOpen && (
        <div 
          className="accessibility-panel"
          style={{
            position: 'fixed',
            bottom: '130px',
            right: '20px',
            zIndex: 50,
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-color)',
            borderRadius: '8px',
            padding: '16px',
            width: '260px',
            boxShadow: '0 4px 12px var(--shadow-color)',
            border: '1px solid var(--border-color)',
            animation: 'fadeIn 0.2s ease'
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
              marginBottom: '16px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <label 
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
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setExplicitThemePreference('light')}
                aria-label={t('switchToLight')}
                className={`btn ${themePreference === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  minHeight: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiSun size={14} />
                {t('light')}
              </button>
              
              <button 
                onClick={() => setExplicitThemePreference('dark')}
                aria-label={t('switchToDark')}
                className={`btn ${themePreference === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  minHeight: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiMoon size={14} />
                {t('dark')}
              </button>
              
              <button 
                onClick={() => setExplicitThemePreference('system')}
                aria-label={t('useSystemTheme')}
                className={`btn ${themePreference === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  minHeight: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiMonitor size={14} />
                {t('system')}
              </button>
            </div>
          </div>
          
          {/* Selector de idioma */}
          <div 
            style={{
              marginBottom: '8px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-color)',
                  fontSize: '14px'
                }}
              >
                <FiGlobe className="mr-2" />
                {t('language')}: {language.toUpperCase()}
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className={`btn ${languagePreference === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => changeLanguage('en')}
                aria-label={t('switchToEnglish')}
                aria-pressed={languagePreference === 'en'}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  minHeight: 'unset'
                }}
              >
                EN
              </button>
              
              <button 
                className={`btn ${languagePreference === 'es' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => changeLanguage('es')}
                aria-label={t('switchToSpanish')}
                aria-pressed={languagePreference === 'es'}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  minHeight: 'unset'
                }}
              >
                ES
              </button>
              
              <button 
                className={`btn ${languagePreference === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => changeLanguage('system')}
                aria-label={t('useSystemLanguage')}
                aria-pressed={languagePreference === 'system'}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  minHeight: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiMonitor size={14} />
                {t('system')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityOptions;