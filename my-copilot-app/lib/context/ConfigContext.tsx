'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useConfig } from '../hooks/useConfig';
import { AgentInfo, TeamInfo, SelectedEntity, ConnectionStatus } from '../types';

interface ConfigContextValue {
  // State
  serverUrl: string;
  setServerUrl: (url: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  connectionStatus: ConnectionStatus;
  agents: AgentInfo[];
  teams: TeamInfo[];
  selectedEntity: SelectedEntity | null;
  currentSessionId: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  refreshing: boolean;
  selectEntity: (type: 'agent' | 'team', id: string, name: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  error: string | null;

  // Callbacks
  onEntityChange: () => void;
  setOnEntityChange: (callback: () => void) => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const config = useConfig();

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfigContext(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigProvider');
  }
  return context;
}