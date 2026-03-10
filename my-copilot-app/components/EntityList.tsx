'use client';

import { Bot, Users, ChevronRight, RefreshCw } from 'lucide-react';
import { AgentInfo, TeamInfo, SelectedEntity, ConnectionStatus } from '@/lib/types';

interface EntityListProps {
  agents: AgentInfo[];
  teams: TeamInfo[];
  selectedEntity: SelectedEntity | null;
  selectEntity: (type: 'agent' | 'team', id: string, name: string) => void;
  connectionStatus: ConnectionStatus;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

export function EntityList({
  agents,
  teams,
  selectedEntity,
  selectEntity,
  connectionStatus,
  refresh,
  refreshing,
}: EntityListProps) {
  const isConnected = connectionStatus === 'connected';

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Connect to a server to view agents and teams
      </div>
    );
  }

  const hasAgents = agents.length > 0;
  const hasTeams = teams.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with Refresh Button */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Available Entities
        </span>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh agents and teams"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!hasAgents && !hasTeams && (
        <div className="p-4 text-center text-gray-400 text-sm">
          No agents or teams found
        </div>
      )}

      {/* Agents Section */}
      {hasAgents && (
        <div className="border-b border-gray-200">
          <div className="px-4 py-2 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Agents
              </span>
            </div>
          </div>
          <div className="py-1">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => selectEntity('agent', agent.id, agent.name)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                  selectedEntity?.type === 'agent' && selectedEntity?.id === agent.id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{agent.name}</span>
                  {agent.role && (
                    <span className="text-xs text-gray-500">{agent.role}</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Teams Section */}
      {hasTeams && (
        <div>
          <div className="px-4 py-2 bg-gray-50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Teams
              </span>
            </div>
          </div>
          <div className="py-1">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => selectEntity('team', team.id, team.name)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                  selectedEntity?.type === 'team' && selectedEntity?.id === team.id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{team.name}</span>
                  {team.mode && (
                    <span className="text-xs text-gray-500">{team.mode}</span>
                  )}
                  {team.members && team.members.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {team.members.slice(0, 3).map((member) => (
                        <span
                          key={member.id}
                          className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                        >
                          {member.name}
                        </span>
                      ))}
                      {team.members.length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          +{team.members.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}