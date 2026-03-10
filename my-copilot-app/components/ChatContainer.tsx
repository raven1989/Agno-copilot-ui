'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useAgentRun } from '../lib/hooks/useAgentRun';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { AlertCircle, Trash2, Bot, Users } from 'lucide-react';

const ENTITY_TYPE = process.env.NEXT_PUBLIC_ENTITY_TYPE || 'agent';

export function ChatContainer() {
  const { messages, currentRun, isStreaming, error, sendMessage, clearMessages } = useAgentRun();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentRun?.content, currentRun?.reasoning_content, currentRun?.member_runs]);

  const isTeam = ENTITY_TYPE === 'team';
  const entityLabel = isTeam ? 'Agno Team Chat' : 'Agno Agent Chat';

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {isTeam ? (
            <Users className="w-5 h-5 text-purple-600" />
          ) : (
            <Bot className="w-5 h-5 text-purple-600" />
          )}
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

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !currentRun && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a conversation with the {isTeam ? 'team' : 'agent'}</p>
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

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
