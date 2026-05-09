import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useStudio } from './_hooks/use-studio';

type StudioApi = ReturnType<typeof useStudio>;

const StudioContext = createContext<StudioApi | null>(null);

const useStudioContext = (): StudioApi => {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error('useStudioContext must be used within <StudioProvider>');
  }
  return ctx;
};

interface StudioProviderProps {
  children: ReactNode;
}

const StudioProvider = ({ children }: StudioProviderProps) => {
  const studio = useStudio();
  return (
    <StudioContext.Provider value={studio}>{children}</StudioContext.Provider>
  );
};

export { StudioProvider, useStudioContext };
