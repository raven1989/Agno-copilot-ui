import { EntityType } from './events';

export interface Session {
  session_id: string;
  session_name: string;
  session_state: Record<string, unknown>;
  created_at: string;  // ISO 8601 timestamp
  updated_at: string;  // ISO 8601 timestamp
  session_type: EntityType;  // Added by us to track type
}

export interface SessionRunToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface SessionRunMessage {
  id: string;
  content: string;
  reasoning_content?: string;
  from_history: boolean;
  stop_after_tool_call: boolean;
  role: 'system' | 'user' | 'assistant' | 'tool';
  tool_calls?: SessionRunToolCall[];
  tool_call_id?: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  tool_call_error?: boolean;
  created_at: number;
}

export interface SessionRunTool {
  tool_call_id: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  tool_call_error: boolean;
  result: string | null;
  metrics: Record<string, unknown> | null;
  child_run_id: string | null;
  stop_after_tool_call: boolean;
  created_at: number;
}

export interface SessionRun {
  run_id: string;
  parent_run_id: string | null;
  agent_id: string;
  user_id: string;
  status: 'COMPLETED' | 'RUNNING' | 'ERROR';
  run_input: string;
  content: string;
  run_response_format: string;
  reasoning_content: string;
  reasoning_steps: unknown[];
  metrics: {
    time_to_first_token: number;
    duration: number;
    details: {
      model: Array<{
        id: string;
        provider: string;
      }>;
    };
  };
  messages: SessionRunMessage[];
  tools?: SessionRunTool[];
}

export interface SessionsResponse {
  data: Session[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
    search_time_ms: number;
  };
}

export interface SessionRunsResponse {
  runs: SessionRun[];
}

export interface DeleteSessionsRequest {
  session_ids: string[];
  session_types: EntityType[];
}

export interface DeleteSessionsResponse {
  deleted: string[];
}