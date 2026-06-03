import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ProjectSummary } from '@shared/types';
import { useStudio } from './_hooks/use-studio';
import type { StudioState } from './_lib/types';

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
  projectName: string;
  initialState: StudioState;
  onBack: () => void;
  onProjectRename: (project: ProjectSummary) => void;
  children: ReactNode;
}

const StudioProvider = ({
  projectName,
  initialState,
  onBack,
  onProjectRename,
  children,
}: StudioProviderProps) => {
  const studio = useStudio({
    projectName,
    initialState,
    onBack,
    onProjectRename,
  });
  return (
    <StudioContext.Provider value={studio}>{children}</StudioContext.Provider>
  );
};

export { StudioProvider, useStudioContext };
