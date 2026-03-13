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
  SelectedEntity,
  SessionRun,
} from '../types';
import { SSEParser } from '../utils/sse-parser';

interface UseAgentRunReturn {
  messages: Message[];
  currentRun: StreamMessage | null;
  isStreaming: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  clearMessages: () => void;
}

interface UseAgentRunOptions {
  serverUrl: string;
  selectedEntity: SelectedEntity | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAgentRun(options: UseAgentRunOptions): UseAgentRunReturn {
  const { serverUrl, selectedEntity } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRun, setCurrentRun] = useState<StreamMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
        setSessionId(runEvent.session_id);
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
        setSessionId(runEvent.session_id);
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

      // Check if we have a selected entity
      if (!selectedEntity) {
        setError('Please select an agent or team from the sidebar');
        return;
      }

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

        const endpoint = selectedEntity.type === 'team' ? 'teams' : 'agents';
        const response = await fetch(`${serverUrl}/${endpoint}/${selectedEntity.id}/runs`, {
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
    [isStreaming, handleAgentEvent, serverUrl, selectedEntity]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentRun(null);
    sessionIdRef.current = null;
    setSessionId(null);
    setError(null);
    memberRunsRef.current.clear();
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!serverUrl) {
      setError('Server URL not configured');
      return;
    }

    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch(`${serverUrl}/sessions/${sessionId}/runs`);

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }

      const runs: SessionRun[] = await response.json();

      // Separate top-level runs and member runs
      const topLevelRuns = runs.filter(r => !r.parent_run_id);
      const memberRuns = runs.filter(r => r.parent_run_id);

      // Create a map of member runs by parent_run_id
      const memberRunsByParent = new Map<string, SessionRun[]>();
      memberRuns.forEach(run => {
        const parentId = run.parent_run_id!;
        if (!memberRunsByParent.has(parentId)) {
          memberRunsByParent.set(parentId, []);
        }
        memberRunsByParent.get(parentId)!.push(run);
      });

      // Sort top-level runs chronologically
      topLevelRuns.sort((a, b) => {
        const aTime = a.messages?.[0]?.created_at || 0;
        const bTime = b.messages?.[0]?.created_at || 0;
        return aTime - bTime;
      });

      // Transform runs into messages
      const loadedMessages: Message[] = [];

      topLevelRuns.forEach((run) => {
        // Determine entity type based on whether there are member runs
        const hasMemberRuns = memberRunsByParent.has(run.run_id);
        const entityType: EntityType = hasMemberRuns ? 'team' : 'agent';

        // Find the assistant message with tool calls in the run's messages
        const assistantMessage = run.messages?.find(
          m => m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0
        );

        // Build tool_calls from the run's tools or from the assistant message
        let toolCalls: ToolCallState[] = [];
        if (run.tools && run.tools.length > 0) {
          toolCalls = run.tools.map(tool => ({
            tool: {
              tool_call_id: tool.tool_call_id,
              tool_name: tool.tool_name,
              tool_args: tool.tool_args,
              tool_call_error: tool.tool_call_error,
              result: tool.result,
              metrics: tool.metrics,
              child_run_id: tool.child_run_id,
              stop_after_tool_call: tool.stop_after_tool_call,
              created_at: tool.created_at,
              requires_confirmation: null,
              confirmed: null,
              confirmation_note: null,
              requires_user_input: null,
              user_input_schema: null,
              user_feedback_schema: null,
              answered: null,
              external_execution_required: null,
              external_execution_silent: null,
              approval_type: null,
              approval_id: null,
            },
            status: tool.tool_call_error ? 'error' : 'completed',
          }));
        } else if (assistantMessage?.tool_calls) {
          // Fallback: build from assistant message's tool_calls
          toolCalls = assistantMessage.tool_calls.map(tc => ({
            tool: {
              tool_call_id: tc.id,
              tool_name: tc.function.name,
              tool_args: JSON.parse(tc.function.arguments),
              tool_call_error: false,
              result: null,
              metrics: null,
              child_run_id: null,
              stop_after_tool_call: false,
              created_at: assistantMessage.created_at,
              requires_confirmation: null,
              confirmed: null,
              confirmation_note: null,
              requires_user_input: null,
              user_input_schema: null,
              user_feedback_schema: null,
              answered: null,
              external_execution_required: null,
              external_execution_silent: null,
              approval_type: null,
              approval_id: null,
            },
            status: 'completed' as const,
          }));
        }

        // Build member_runs for team sessions
        const memberRunsForThisRun: MemberRun[] = [];
        if (hasMemberRuns) {
          const childRuns = memberRunsByParent.get(run.run_id) || [];
          childRuns.forEach(childRun => {
            // Extract tool calls for this member run
            const memberToolCalls: ToolCallState[] = [];
            if (childRun.tools && childRun.tools.length > 0) {
              childRun.tools.forEach(tool => {
                memberToolCalls.push({
                  tool: {
                    tool_call_id: tool.tool_call_id,
                    tool_name: tool.tool_name,
                    tool_args: tool.tool_args,
                    tool_call_error: tool.tool_call_error,
                    result: tool.result,
                    metrics: tool.metrics,
                    child_run_id: tool.child_run_id,
                    stop_after_tool_call: tool.stop_after_tool_call,
                    created_at: tool.created_at,
                    requires_confirmation: null,
                    confirmed: null,
                    confirmation_note: null,
                    requires_user_input: null,
                    user_input_schema: null,
                    user_feedback_schema: null,
                    answered: null,
                    external_execution_required: null,
                    external_execution_silent: null,
                    approval_type: null,
                    approval_id: null,
                  },
                  status: tool.tool_call_error ? 'error' : 'completed',
                });
              });
            }

            memberRunsForThisRun.push({
              run_id: childRun.run_id,
              agent_id: childRun.agent_id,
              agent_name: childRun.agent_id,
              reasoning_content: childRun.reasoning_content || '',
              content: childRun.content || '',
              tool_calls: memberToolCalls,
              status: 'completed',
              parent_run_id: run.run_id,
            });
          });
        }

        // User message from run_input
        if (run.run_input) {
          const msgTime = run.messages?.[0]?.created_at || Date.now() / 1000;
          loadedMessages.push({
            id: generateId(),
            role: 'user',
            content: run.run_input,
            timestamp: msgTime * 1000,
          });
        }

        // Assistant message from content
        if (run.content || run.reasoning_content) {
          const msgTime = run.messages?.[run.messages.length - 1]?.created_at || Date.now() / 1000;
          loadedMessages.push({
            id: generateId(),
            role: 'assistant',
            content: run.content || '',
            timestamp: msgTime * 1000,
            streamMessage: {
              run_id: run.run_id,
              session_id: sessionId,
              entity_type: entityType,
              entity_id: run.agent_id,
              entity_name: run.agent_id,
              reasoning_content: run.reasoning_content || '',
              content: run.content || '',
              tool_calls: toolCalls,
              member_runs: memberRunsForThisRun,
              status: 'completed',
              metrics: {
                time_to_first_token: run.metrics?.time_to_first_token,
                duration: run.metrics?.duration,
                model: run.metrics?.details?.model?.[0]?.id,
                provider: run.metrics?.details?.model?.[0]?.provider,
              },
            },
          });
        }
      });

      setMessages(loadedMessages);
      sessionIdRef.current = sessionId;
      setSessionId(sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
      setError(errorMessage);
    } finally {
      setIsStreaming(false);
    }
  }, [serverUrl]);

  return {
    messages,
    currentRun,
    isStreaming,
    error,
    sessionId,
    sendMessage,
    loadSession,
    clearMessages,
  };
}
