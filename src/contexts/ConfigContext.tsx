import React, { createContext, useContext, useEffect, useState } from 'react';
import { identityApi } from '../lib/zodiosClients';

interface ConfigContextType {
  olaMapsApiKey: string | null;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType>({
  olaMapsApiKey: null,
  isLoading: true,
  error: null,
});

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [olaMapsApiKey, setOlaMapsApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
                const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/config/ui-config', { headers: { 'X-Calling-Service': 'CustomerApplication' } });
                if (!res.ok) throw new Error('API Error');
                const response = await res.json();
                if (response && (response).mapsApiKey) {
                    setOlaMapsApiKey((response).mapsApiKey);
        } else {
          setError('Failed to load Maps API Key from server');
        }
      } catch (err) {
        console.error('Error fetching config:', err);
        setError('Failed to fetch runtime configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Initializing Application Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={{ olaMapsApiKey, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
};
