import { useState, useCallback, useEffect, useRef } from 'react';
import { AgentInfo, TeamInfo, SelectedEntity, ConnectionStatus } from '../types';

const STORAGE_KEYS = {
  SERVER_URL: 'agno-server-url',
  SIDEBAR_OPEN: 'agno-sidebar-open',
  SELECTED_ENTITY: 'agno-selected-entity',
  CURRENT_SESSION_ID: 'agno-current-session-id',
};

const DEFAULT_SERVER_URL = 'http://localhost:9001';

interface UseConfigReturn {
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

export function useConfig(): UseConfigReturn {
  // Initialize with defaults to avoid hydration mismatch
  const [serverUrl, setServerUrlState] = useState<string>(DEFAULT_SERVER_URL);
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntityState] = useState<SelectedEntity | null>(null);
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onEntityChangeRef = useRef<(() => void) | null>(null);

  // Read from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const storedUrl = localStorage.getItem(STORAGE_KEYS.SERVER_URL);
    if (storedUrl) {
      setServerUrlState(storedUrl);
    }

    const storedSidebar = localStorage.getItem(STORAGE_KEYS.SIDEBAR_OPEN);
    if (storedSidebar !== null) {
      setSidebarOpenState(storedSidebar === 'true');
    }

    const storedEntity = localStorage.getItem(STORAGE_KEYS.SELECTED_ENTITY);
    if (storedEntity) {
      try {
        setSelectedEntityState(JSON.parse(storedEntity));
      } catch {
        // ignore parse errors
      }
    }

    // Clear session ID on page load - always start fresh
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
  }, []);

  const setServerUrl = useCallback((url: string) => {
    setServerUrlState(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SERVER_URL, url);
    }
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setSidebarOpenState(open);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_OPEN, String(open));
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen, setSidebarOpen]);

  const disconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    setAgents([]);
    setTeams([]);
    setError(null);
    // Clear session ID on disconnect since we can't load it without connection
    setCurrentSessionIdState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!serverUrl.trim()) {
      setError('Please enter a server URL');
      return;
    }

    setConnectionStatus('connecting');
    setError(null);
    setAgents([]);
    setTeams([]);

    try {
      // Fetch agents and teams in parallel
      const [agentsResponse, teamsResponse] = await Promise.all([
        fetch(`${serverUrl}/agents`),
        fetch(`${serverUrl}/teams`),
      ]);

      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentsResponse.status}`);
      }
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch teams: ${teamsResponse.status}`);
      }

      const agentsData = await agentsResponse.json();
      const teamsData = await teamsResponse.json();

      setAgents(agentsData);
      setTeams(teamsData);
      setConnectionStatus('connected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(errorMessage);
      setConnectionStatus('error');
    }
  }, [serverUrl]);

  const refresh = useCallback(async () => {
    if (!serverUrl.trim() || connectionStatus !== 'connected') {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const [agentsResponse, teamsResponse] = await Promise.all([
        fetch(`${serverUrl}/agents`),
        fetch(`${serverUrl}/teams`),
      ]);

      if (!agentsResponse.ok) {
        throw new Error(`Failed to fetch agents: ${agentsResponse.status}`);
      }
      if (!teamsResponse.ok) {
        throw new Error(`Failed to fetch teams: ${teamsResponse.status}`);
      }

      const agentsData = await agentsResponse.json();
      const teamsData = await teamsResponse.json();

      setAgents(agentsData);
      setTeams(teamsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh';
      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  }, [serverUrl, connectionStatus]);

  const selectEntity = useCallback((type: 'agent' | 'team', id: string, name: string) => {
    const newEntity: SelectedEntity = { type, id, name };
    setSelectedEntityState(newEntity);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ENTITY, JSON.stringify(newEntity));
    }
    // Clear session ID when switching entities (treat as New Chat)
    setCurrentSessionIdState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    }
    // Trigger entity change callback
    if (onEntityChangeRef.current) {
      onEntityChangeRef.current();
    }
  }, []);

  const setOnEntityChange = useCallback((callback: () => void) => {
    onEntityChangeRef.current = callback;
  }, []);

  const onEntityChange = useCallback(() => {
    if (onEntityChangeRef.current) {
      onEntityChangeRef.current();
    }
  }, []);

  const setCurrentSessionId = useCallback((id: string | null) => {
    setCurrentSessionIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      }
    }
  }, []);

  return {
    serverUrl,
    setServerUrl,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    connectionStatus,
    agents,
    teams,
    selectedEntity,
    currentSessionId,
    connect,
    disconnect,
    refresh,
    refreshing,
    selectEntity,
    setCurrentSessionId,
    error,
    onEntityChange,
    setOnEntityChange,
  };
}