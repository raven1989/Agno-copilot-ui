import { EntityType } from './events';

// Types for API responses from /agents and /teams endpoints
export interface AgentInfo {
  id: string;
  name: string;
  role?: string;
  model?: {
    name: string;
    model: string;
    provider: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  mode?: string;
  members?: TeamMember[];
}

export interface ServerConfig {
  serverUrl: string;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
}

export interface SelectedEntity {
  type: EntityType;
  id: string;
  name: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';