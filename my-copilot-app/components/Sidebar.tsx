'use client';

import { ServerConfig } from './ServerConfig';
import { EntityList } from './EntityList';
import { AgentInfo, TeamInfo, SelectedEntity, ConnectionStatus } from '@/lib/types';

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
      </div>
    </div>
  );
}