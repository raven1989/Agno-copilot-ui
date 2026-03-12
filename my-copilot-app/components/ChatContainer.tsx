'use client';

import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useAgentRun } from '../lib/hooks/useAgentRun';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AlertCircle, Trash2, Bot, Users, Menu } from 'lucide-react';
import { useConfigContext } from '../lib/context/ConfigContext';

interface ChatContainerProps {
  onToggleSidebar: () => void;
}

export function ChatContainer({ onToggleSidebar }: ChatContainerProps) {
  const { serverUrl, selectedEntity, toggleSidebar, setOnEntityChange } = useConfigContext();
  const { messages, currentRun, isStreaming, error, sendMessage, clearMessages } = useAgentRun({
    serverUrl,
    selectedEntity,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Track if user is near bottom (within 100px) - used to decide if we should auto-scroll
  const [userIsNearBottom, setUserIsNearBottom] = useState(true);

  // Track previous content length to detect actual content changes
  const prevContentLengthRef = useRef(0);

  // Clear chat when entity changes
  const handleEntityChange = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  // Register the entity change callback
  useEffect(() => {
    setOnEntityChange(handleEntityChange);
  }, [setOnEntityChange, handleEntityChange]);

  const streamingMessage = useMemo(() => {
    if (currentRun && currentRun.status === 'streaming') {
      return {
        id: 'streaming',
        role: 'assistant' as const,
        content: '',
        timestamp: 0,
        streamMessage: currentRun,
      };
    }
    return null;
  }, [currentRun]);

  // Calculate current content length for comparison
  const currentContentLength = useMemo(() => {
    let length = messages.length;
    if (currentRun) {
      length += (currentRun.content?.length || 0) + (currentRun.reasoning_content?.length || 0);
      length += currentRun.tool_calls?.length || 0;
      length += currentRun.member_runs?.length || 0;
    }
    return length;
  }, [messages, currentRun]);

  // Handle scroll position tracking
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setUserIsNearBottom(isNearBottom);
  }, []);

  // Scroll to bottom of the scroll container directly
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Only auto-scroll when:
  // 1. New content is actually added (content length changed)
  // 2. User was already near the bottom
  useEffect(() => {
    const contentChanged = currentContentLength !== prevContentLengthRef.current;
    prevContentLengthRef.current = currentContentLength;

    // Only scroll if content changed AND user is near bottom
    if (contentChanged && userIsNearBottom) {
      scrollToBottom(true);
    }
  }, [currentContentLength, userIsNearBottom, scrollToBottom]);

  // Always scroll when a new message is sent (user action)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        scrollToBottom(false);
        setUserIsNearBottom(true);
      }
    }
  }, [messages, scrollToBottom]);

  const isTeam = selectedEntity?.type === 'team';
  const entityName = selectedEntity?.name || 'Select an Agent or Team';
  const entityLabel = selectedEntity ? entityName : 'Agno Chat';

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {selectedEntity ? (
            isTeam ? (
              <Users className="w-5 h-5 text-purple-600" />
            ) : (
              <Bot className="w-5 h-5 text-purple-600" />
            )
          ) : null}
          <h1 className="text-lg font-semibold text-gray-900">{entityLabel}</h1>
        </div>
        <button
          onClick={clearMessages}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {!selectedEntity && messages.length === 0 && !currentRun && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select an agent or team from the sidebar to start chatting</p>
          </div>
        )}
        {selectedEntity && messages.length === 0 && !currentRun && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a conversation with {selectedEntity.name}</p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {streamingMessage && (
          <div className="animate-fadeIn">
            <ChatMessage message={streamingMessage} />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ChatInput onSend={sendMessage} disabled={isStreaming || !selectedEntity} />
    </div>
  );
}