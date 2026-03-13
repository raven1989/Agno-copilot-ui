'use client';

import { ServerConfig } from './ServerConfig';
import { EntityList } from './EntityList';
import { SessionList } from './SessionList';
import { AgentInfo, TeamInfo, SelectedEntity, ConnectionStatus, Session } from '@/lib/types';

interface SidebarProps {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  connectionStatus: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  refreshing: boolean;
  error: string | null;
  agents: AgentInfo[];
  teams: TeamInfo[];
  selectedEntity: SelectedEntity | null;
  selectEntity: (type: 'agent' | 'team', id: string, name: string) => void;
  isOpen: boolean;
  // Session management props
  sessions: Session[];
  sessionPage: number;
  sessionTotalPages: number;
  sessionTotalCount: number;
  sessionIsLoading: boolean;
  sessionError: string | null;
  selectedSessionIds: Set<string>;
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onFetchSessions: (page: number) => void;
  onDeleteSelectedSessions: () => Promise<boolean>;
  onToggleSessionSelection: (sessionId: string) => void;
  onSelectAllSessions: () => void;
  onClearSelection: () => void;
  onRefreshSessions: () => void;
}

export function Sidebar({
  serverUrl,
  setServerUrl,
  connectionStatus,
  connect,
  disconnect,
  refresh,
  refreshing,
  error,
  agents,
  teams,
  selectedEntity,
  selectEntity,
  isOpen,
  // Session management props
  sessions,
  sessionPage,
  sessionTotalPages,
  sessionTotalCount,
  sessionIsLoading,
  sessionError,
  selectedSessionIds,
  currentSessionId,
  onLoadSession,
  onFetchSessions,
  onDeleteSelectedSessions,
  onToggleSessionSelection,
  onSelectAllSessions,
  onClearSelection,
  onRefreshSessions,
}: SidebarProps) {
  return (
    <div
      className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
      }`}
    >
      <div className="flex-1 flex flex-col min-w-[280px]">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Agno Configuration</h2>
        </div>

        <ServerConfig
          serverUrl={serverUrl}
          setServerUrl={setServerUrl}
          connectionStatus={connectionStatus}
          connect={connect}
          disconnect={disconnect}
          error={error}
        />

        <EntityList
          agents={agents}
          teams={teams}
          selectedEntity={selectedEntity}
          selectEntity={selectEntity}
          connectionStatus={connectionStatus}
          refresh={refresh}
          refreshing={refreshing}
        />

        <SessionList
          sessions={sessions}
          page={sessionPage}
          totalPages={sessionTotalPages}
          totalCount={sessionTotalCount}
          isLoading={sessionIsLoading}
          error={sessionError}
          selectedSessionIds={selectedSessionIds}
          currentSessionId={currentSessionId}
          connectionStatus={connectionStatus}
          selectedEntity={selectedEntity}
          onLoadSession={onLoadSession}
          onFetchSessions={onFetchSessions}
          onDeleteSelectedSessions={onDeleteSelectedSessions}
          onToggleSessionSelection={onToggleSessionSelection}
          onSelectAllSessions={onSelectAllSessions}
          onClearSelection={onClearSelection}
          onRefreshSessions={onRefreshSessions}
        />
      </div>
    </div>
  );
}