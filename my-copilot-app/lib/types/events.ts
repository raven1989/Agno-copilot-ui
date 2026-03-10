export type AgentEventType =
  | 'RunStarted'
  | 'ModelRequestStarted'
  | 'RunContent'
  | 'ModelRequestCompleted'
  | 'ToolCallStarted'
  | 'ToolCallCompleted'
  | 'RunContentCompleted'
  | 'RunCompleted';

export type TeamEventType =
  | 'TeamRunStarted'
  | 'TeamModelRequestStarted'
  | 'TeamRunContent'
  | 'TeamModelRequestCompleted'
  | 'TeamToolCallStarted'
  | 'TeamToolCallCompleted'
  | 'TeamRunContentCompleted'
  | 'TeamRunCompleted';

export type EventType = AgentEventType | TeamEventType;

export type EntityType = 'agent' | 'team';

interface BaseAgentEvent {
  created_at: number;
  event: AgentEventType;
  agent_id: string;
  agent_name: string;
  run_id: string;
  session_id: string;
  parent_run_id?: string;
}

interface BaseTeamEvent {
  created_at: number;
  event: TeamEventType;
  team_id: string;
  team_name: string;
  run_id: string;
  session_id: string;
}

export interface RunStartedEvent extends BaseAgentEvent {
  event: 'RunStarted';
  model: string;
  model_provider: string;
}

export interface ModelRequestStartedEvent extends BaseAgentEvent {
  event: 'ModelRequestStarted';
  model: string;
  model_provider: string;
}

export interface RunContentEvent extends BaseAgentEvent {
  event: 'RunContent';
  content?: string;
  reasoning_content?: string;
  content_type: string;
  workflow_agent: boolean;
  model_provider_data?: {
    id: string;
  };
}

export interface ModelRequestCompletedEvent extends BaseAgentEvent {
  event: 'ModelRequestCompleted';
  model: string;
  model_provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  time_to_first_token: number;
  reasoning_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

export interface Tool {
  tool_call_id: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  tool_call_error: boolean | null;
  result: string | null;
  metrics: Record<string, unknown> | null;
  child_run_id: string | null;
  stop_after_tool_call: boolean;
  created_at: number;
  requires_confirmation: boolean | null;
  confirmed: boolean | null;
  confirmation_note: string | null;
  requires_user_input: boolean | null;
  user_input_schema: Record<string, unknown> | null;
  user_feedback_schema: Record<string, unknown> | null;
  answered: boolean | null;
  external_execution_required: boolean | null;
  external_execution_silent: boolean | null;
  approval_type: string | null;
  approval_id: string | null;
}

export interface ToolCallStartedEvent extends BaseAgentEvent {
  event: 'ToolCallStarted';
  tool: Tool;
}

export interface ToolCallCompletedEvent extends BaseAgentEvent {
  event: 'ToolCallCompleted';
  content?: string;
  tool: Tool;
}

export interface RunContentCompletedEvent extends BaseAgentEvent {
  event: 'RunContentCompleted';
}

export interface RunMetrics {
  time_to_first_token: number;
  duration: number;
  details: {
    model: Array<{
      id: string;
      provider: string;
    }>;
  };
}

export interface RunCompletedEvent extends BaseAgentEvent {
  event: 'RunCompleted';
  content: string;
  content_type: string;
  reasoning_content: string;
  model_provider_data?: {
    id: string;
  };
  session_state: Record<string, unknown>;
  metrics: RunMetrics;
}

export interface TeamRunStartedEvent extends BaseTeamEvent {
  event: 'TeamRunStarted';
  model: string;
  model_provider: string;
}

export interface TeamModelRequestStartedEvent extends BaseTeamEvent {
  event: 'TeamModelRequestStarted';
  model: string;
  model_provider: string;
}

export interface TeamRunContentEvent extends BaseTeamEvent {
  event: 'TeamRunContent';
  content?: string;
  reasoning_content?: string;
  content_type: string;
  model_provider_data?: {
    id: string;
  };
}

export interface TeamModelRequestCompletedEvent extends BaseTeamEvent {
  event: 'TeamModelRequestCompleted';
  model: string;
  model_provider: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  time_to_first_token: number;
  reasoning_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

export interface TeamToolCallStartedEvent extends BaseTeamEvent {
  event: 'TeamToolCallStarted';
  tool: Tool;
}

export interface TeamToolCallCompletedEvent extends BaseTeamEvent {
  event: 'TeamToolCallCompleted';
  content?: string;
  tool: Tool;
}

export interface TeamRunContentCompletedEvent extends BaseTeamEvent {
  event: 'TeamRunContentCompleted';
}

export interface TeamRunCompletedEvent extends BaseTeamEvent {
  event: 'TeamRunCompleted';
  content: string;
  content_type: string;
  reasoning_content: string;
  model_provider_data?: {
    id: string;
  };
  session_state: Record<string, unknown>;
  metrics: RunMetrics;
}

export type AgentEvent =
  | RunStartedEvent
  | ModelRequestStartedEvent
  | RunContentEvent
  | ModelRequestCompletedEvent
  | ToolCallStartedEvent
  | ToolCallCompletedEvent
  | RunContentCompletedEvent
  | RunCompletedEvent;

export type TeamEvent =
  | TeamRunStartedEvent
  | TeamModelRequestStartedEvent
  | TeamRunContentEvent
  | TeamModelRequestCompletedEvent
  | TeamToolCallStartedEvent
  | TeamToolCallCompletedEvent
  | TeamRunContentCompletedEvent
  | TeamRunCompletedEvent;

export type AppEvent = AgentEvent | TeamEvent;

export function isTeamEvent(event: AppEvent): event is TeamEvent {
  return event.event.startsWith('Team');
}

export function isAgentEvent(event: AppEvent): event is AgentEvent {
  return !event.event.startsWith('Team');
}

export function getEntityId(event: AppEvent): string {
  return isTeamEvent(event) ? (event as TeamEvent).team_id : (event as AgentEvent).agent_id;
}

export function getEntityName(event: AppEvent): string {
  return isTeamEvent(event) ? (event as TeamEvent).team_name : (event as AgentEvent).agent_name;
}
