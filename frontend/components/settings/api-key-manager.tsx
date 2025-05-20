import { useState, useEffect } from 'react';

export function ApiKeyManager() {
  const [apiKey, setApiKey] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);
  
  // Cargar API Key guardada al montar el componente
  useEffect(() => {
    const savedKey = localStorage.getItem('studyToolUserApiKey');
    if (savedKey) {
      setApiKey(savedKey);
      setSaved(true);
    }
  }, []);
  
  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('studyToolUserApiKey', apiKey);
      setSaved(true);
    }
  };
  
  const handleClear = () => {
    localStorage.removeItem('studyToolUserApiKey');
    setApiKey('');
    setSaved(false);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium mb-2">Configuración de API Key</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Para utilizar las funciones de IA, necesitas proporcionar tu propia API Key de Google AI Studio.
        <a href="https://aistudio.google.com/" target="_blank" rel="noopener" className="text-primary ml-1">
          Obtener una API Key
        </a>
      </p>
      
      <div className="flex gap-2 mb-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Ingresa tu API Key de Google AI Studio"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded">
          Guardar
        </button>
        {saved && (
          <button onClick={handleClear} className="px-4 py-2 border rounded">
            Borrar
          </button>
        )}
      </div>
      
      {saved && (
        <p className="text-sm text-green-600">
          ✓ API Key guardada localmente
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        La API Key se guarda solo en tu navegador y nunca se envía a nuestros servidores.
      </p>
    </div>
  );
}