import { useState, useCallback, useRef } from 'react';
import {
  AppEvent,
  StreamMessage,
  Message,
  ToolCallState,
  MemberRun,
  RunStartedEvent,
  RunContentEvent,
  ToolCallStartedEvent,
  ToolCallCompletedEvent,
  RunCompletedEvent,
  TeamRunStartedEvent,
  TeamRunContentEvent,
  TeamToolCallStartedEvent,
  TeamToolCallCompletedEvent,
  TeamRunCompletedEvent,
  EntityType,
  isTeamEvent,
} from '../types';
import { SSEParser } from '../utils/sse-parser';

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:9001';
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || 'helpful-assistant';
const ENTITY_TYPE: EntityType = (process.env.NEXT_PUBLIC_ENTITY_TYPE as EntityType) || 'team';

interface UseAgentRunReturn {
  messages: Message[];
  currentRun: StreamMessage | null;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAgentRun(): UseAgentRunReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRun, setCurrentRun] = useState<StreamMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parserRef = useRef(new SSEParser());
  const sessionIdRef = useRef<string | null>(null);
  const currentRunRef = useRef<StreamMessage | null>(null);
  const memberRunsRef = useRef<Map<string, MemberRun>>(new Map());

  const updateMemberRunsInCurrentRun = useCallback(() => {
    setCurrentRun((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        member_runs: Array.from(memberRunsRef.current.values()),
      };
      currentRunRef.current = updated;
      return updated;
    });
  }, []);

  const handleMemberAgentEvent = useCallback((event: AppEvent, parentRunId: string) => {
    switch (event.event) {
      case 'RunStarted': {
        const runEvent = event as RunStartedEvent;
        const memberRun: MemberRun = {
          run_id: runEvent.run_id,
          agent_id: runEvent.agent_id,
          agent_name: runEvent.agent_name,
          reasoning_content: '',
          content: '',
          tool_calls: [],
          status: 'streaming',
          parent_run_id: parentRunId,
        };
        memberRunsRef.current.set(runEvent.run_id, memberRun);
        updateMemberRunsInCurrentRun();
        break;
      }

      case 'RunContent': {
        const contentEvent = event as RunContentEvent;
        const memberRun = memberRunsRef.current.get(contentEvent.run_id);
        if (memberRun) {
          memberRun.reasoning_content += contentEvent.reasoning_content || '';
          memberRun.content += contentEvent.content || '';
          updateMemberRunsInCurrentRun();
        }
        break;
      }

      case 'ToolCallStarted': {
        const toolEvent = event as ToolCallStartedEvent;
        const memberRun = memberRunsRef.current.get(toolEvent.run_id);
        if (memberRun) {
          memberRun.tool_calls.push({
            tool: toolEvent.tool,
            status: 'running',
          });
          updateMemberRunsInCurrentRun();
        }
        break;
      }

      case 'ToolCallCompleted': {
        const toolEvent = event as ToolCallCompletedEvent;
        const memberRun = memberRunsRef.current.get(toolEvent.run_id);
        if (memberRun) {
          memberRun.tool_calls = memberRun.tool_calls.map((tc) =>
            tc.tool.tool_call_id === toolEvent.tool.tool_call_id
              ? { tool: toolEvent.tool, status: toolEvent.tool.tool_call_error ? 'error' : 'completed' as 'error' | 'completed' }
              : tc
          );
          updateMemberRunsInCurrentRun();
        }
        break;
      }

      case 'RunCompleted': {
        const completedEvent = event as RunCompletedEvent;
        const memberRun = memberRunsRef.current.get(completedEvent.run_id);
        if (memberRun) {
          memberRun.content = completedEvent.content;
          memberRun.reasoning_content = completedEvent.reasoning_content;
          memberRun.status = 'completed';
          updateMemberRunsInCurrentRun();
        }
        break;
      }
    }
  }, [updateMemberRunsInCurrentRun]);

  const handleTeamEvent = useCallback((event: AppEvent) => {
    switch (event.event) {
      case 'TeamRunStarted': {
        const runEvent = event as TeamRunStartedEvent;
        sessionIdRef.current = runEvent.session_id;
        const newRun: StreamMessage = {
          run_id: runEvent.run_id,
          session_id: runEvent.session_id,
          entity_type: 'team',
          entity_id: runEvent.team_id,
          entity_name: runEvent.team_name,
          reasoning_content: '',
          content: '',
          tool_calls: [],
          member_runs: [],
          status: 'streaming',
          metrics: {
            model: runEvent.model,
            provider: runEvent.model_provider,
          },
        };
        currentRunRef.current = newRun;
        memberRunsRef.current.clear();
        setCurrentRun(newRun);
        break;
      }

      case 'TeamRunContent': {
        const contentEvent = event as TeamRunContentEvent;
        setCurrentRun((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            reasoning_content:
              prev.reasoning_content + (contentEvent.reasoning_content || ''),
            content: prev.content + (contentEvent.content || ''),
          };
          currentRunRef.current = updated;
          return updated;
        });
        break;
      }

      case 'TeamToolCallStarted': {
        const toolEvent = event as TeamToolCallStartedEvent;
        setCurrentRun((prev) => {
          if (!prev) return prev;
          const newToolCall: ToolCallState = {
            tool: toolEvent.tool,
            status: 'running',
          };
          const updated = {
            ...prev,
            tool_calls: [...prev.tool_calls, newToolCall],
          };
          currentRunRef.current = updated;
          return updated;
        });
        break;
      }

      case 'TeamToolCallCompleted': {
        const toolEvent = event as TeamToolCallCompletedEvent;
        setCurrentRun((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            tool_calls: prev.tool_calls.map((tc) =>
              tc.tool.tool_call_id === toolEvent.tool.tool_call_id
                ? { tool: toolEvent.tool, status: (toolEvent.tool.tool_call_error ? 'error' : 'completed') as 'error' | 'completed' }
                : tc
            ),
          };
          currentRunRef.current = updated;
          return updated;
        });
        break;
      }

      case 'TeamRunCompleted': {
        const completedEvent = event as TeamRunCompletedEvent;
        const prevRun = currentRunRef.current;
        if (prevRun) {
          const finalRun: StreamMessage = {
            ...prevRun,
            content: completedEvent.content,
            reasoning_content: completedEvent.reasoning_content,
            status: 'completed',
            metrics: {
              ...prevRun.metrics,
              time_to_first_token: completedEvent.metrics.time_to_first_token,
              duration: completedEvent.metrics.duration,
            },
          };
          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: completedEvent.content,
            timestamp: Date.now(),
            streamMessage: finalRun,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentRun(null);
          currentRunRef.current = null;
        }
        break;
      }
    }
  }, []);

  const handleAgentRunEvent = useCallback((event: AppEvent) => {
    const agentEvent = event as typeof event & { parent_run_id?: string };
    const parentRunId = agentEvent.parent_run_id;

    if (parentRunId && currentRunRef.current?.run_id === parentRunId) {
      handleMemberAgentEvent(agentEvent, parentRunId);
      return;
    }

    switch (event.event) {
      case 'RunStarted': {
        const runEvent = event as RunStartedEvent;
        sessionIdRef.current = runEvent.session_id;
        const newRun: StreamMessage = {
          run_id: runEvent.run_id,
          session_id: runEvent.session_id,
          entity_type: 'agent',
          entity_id: runEvent.agent_id,
          entity_name: runEvent.agent_name,
          reasoning_content: '',
          content: '',
          tool_calls: [],
          member_runs: [],
          status: 'streaming',
          metrics: {
            model: runEvent.model,
            provider: runEvent.model_provider,
          },
        };
        currentRunRef.current = newRun;
        setCurrentRun(newRun);
        break;
      }

      case 'RunContent': {
        const contentEvent = event as RunContentEvent;
        setCurrentRun((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            reasoning_content:
              prev.reasoning_content + (contentEvent.reasoning_content || ''),
            content: prev.content + (contentEvent.content || ''),
          };
          currentRunRef.current = updated;
          return updated;
        });
        break;
      }

      case 'ToolCallStarted': {
        const toolEvent = event as ToolCallStartedEvent;
        setCurrentRun((prev) => {
          if (!prev) return prev;
          const newToolCall: ToolCallState = {
            tool: toolEvent.tool,
            status: 'running',
          };
          const updated = {
            ...prev,
            tool_calls: [...prev.tool_calls, newToolCall],
          };
          currentRunRef.current = updated;
          return updated;
        });
        break;
      }

      case 'ToolCallCompleted': {
        const toolEvent = event as ToolCallCompletedEvent;
        setCurrentRun((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            tool_calls: prev.tool_calls.map((tc) =>
              tc.tool.tool_call_id === toolEvent.tool.tool_call_id
                ? { tool: toolEvent.tool, status: (toolEvent.tool.tool_call_error ? 'error' : 'completed') as 'error' | 'completed' }
                : tc
            ),
          };
          currentRunRef.current = updated;
          return updated;
        });
        break;
      }

      case 'RunCompleted': {
        const completedEvent = event as RunCompletedEvent;
        const prevRun = currentRunRef.current;
        if (prevRun) {
          const finalRun: StreamMessage = {
            ...prevRun,
            content: completedEvent.content,
            reasoning_content: completedEvent.reasoning_content,
            status: 'completed',
            metrics: {
              ...prevRun.metrics,
              time_to_first_token: completedEvent.metrics.time_to_first_token,
              duration: completedEvent.metrics.duration,
            },
          };
          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: completedEvent.content,
            timestamp: Date.now(),
            streamMessage: finalRun,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setCurrentRun(null);
          currentRunRef.current = null;
        }
        break;
      }
    }
  }, [handleMemberAgentEvent]);

  const handleAgentEvent = useCallback((event: AppEvent) => {
    if (isTeamEvent(event)) {
      handleTeamEvent(event);
    } else {
      handleAgentRunEvent(event);
    }
  }, [handleTeamEvent, handleAgentRunEvent]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      setError(null);
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      parserRef.current.reset();
      memberRunsRef.current.clear();

      try {
        const formData = new URLSearchParams();
        formData.append('message', content);
        formData.append('stream', 'true');
        if (sessionIdRef.current) {
          formData.append('session_id', sessionIdRef.current);
        }

        const endpoint = ENTITY_TYPE === 'team' ? 'teams' : 'agents';
        const response = await fetch(`${AGENT_URL}/${endpoint}/${AGENT_ID}/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          parserRef.current.parse(chunk, handleAgentEvent);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setCurrentRun((prev) =>
          prev ? { ...prev, status: 'error' } : null
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, handleAgentEvent]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentRun(null);
    sessionIdRef.current = null;
    setError(null);
    memberRunsRef.current.clear();
  }, []);

  return {
    messages,
    currentRun,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}
