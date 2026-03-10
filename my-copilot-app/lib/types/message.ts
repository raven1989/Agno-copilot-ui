import { Tool } from './events';

export type MessageRole = 'user' | 'assistant';

export interface ToolCallState {
  tool: Tool;
  status: 'running' | 'completed' | 'error';
}

export interface StreamMessage {
  run_id: string;
  session_id: string;
  agent_id: string;
  agent_name: string;
  reasoning_content: string;
  content: string;
  tool_calls: ToolCallState[];
  status: 'streaming' | 'completed' | 'error';
  metrics?: {
    time_to_first_token?: number;
    duration?: number;
    model?: string;
    provider?: string;
  };
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  streamMessage?: StreamMessage;
}

export interface ChatState {
  messages: Message[];
  currentRun: StreamMessage | null;
  isStreaming: boolean;
  error: string | null;
}
