export type EventType =
  | 'RunStarted'
  | 'ModelRequestStarted'
  | 'RunContent'
  | 'ModelRequestCompleted'
  | 'ToolCallStarted'
  | 'ToolCallCompleted'
  | 'RunContentCompleted'
  | 'RunCompleted';

interface BaseEvent {
  created_at: number;
  event: EventType;
  agent_id: string;
  agent_name: string;
  run_id: string;
  session_id: string;
}

export interface RunStartedEvent extends BaseEvent {
  event: 'RunStarted';
  model: string;
  model_provider: string;
}

export interface ModelRequestStartedEvent extends BaseEvent {
  event: 'ModelRequestStarted';
  model: string;
  model_provider: string;
}

export interface RunContentEvent extends BaseEvent {
  event: 'RunContent';
  content?: string;
  reasoning_content?: string;
  content_type: string;
  workflow_agent: boolean;
  model_provider_data?: {
    id: string;
  };
}

export interface ModelRequestCompletedEvent extends BaseEvent {
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

export interface ToolCallStartedEvent extends BaseEvent {
  event: 'ToolCallStarted';
  tool: Tool;
}

export interface ToolCallCompletedEvent extends BaseEvent {
  event: 'ToolCallCompleted';
  content?: string;
  tool: Tool;
}

export interface RunContentCompletedEvent extends BaseEvent {
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

export interface RunCompletedEvent extends BaseEvent {
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

export type AgentEvent =
  | RunStartedEvent
  | ModelRequestStartedEvent
  | RunContentEvent
  | ModelRequestCompletedEvent
  | ToolCallStartedEvent
  | ToolCallCompletedEvent
  | RunContentCompletedEvent
  | RunCompletedEvent;
