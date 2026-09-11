import React, { createContext, useContext } from 'react';

/**
 * Runtime configuration for the UI.
 *
 * This deliberately carries no Ola Maps API key. Map and Places traffic goes to our own origin at
 * /olamaps and the API Gateway appends the key server-side (see `@/lib/olaMaps`), so handing the
 * key to the browser would leak a server credential to every visitor without enabling anything.
 */
interface ConfigContextType {
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType>({
  isLoading: false,
  error: null,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigContext.Provider value={{ isLoading: false, error: null }}>
      {children}
    </ConfigContext.Provider>
  );
};
