'use client';

import { Message } from '../lib/types';
import { MessageStream } from './MessageStream';
import { User, Bot, Loader2, CheckCircle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.id === 'streaming';

  return (
    <div
      className={`flex gap-3 p-4 ${isUser ? 'bg-white' : 'bg-gray-50'} animate-fadeIn`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-gray-500">
            {isUser ? 'You' : message.streamMessage?.entity_name || 'Assistant'}
          </span>
          {!isUser && (
            isStreaming ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            )
          )}
        </div>
        <div className="text-gray-900">
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : message.streamMessage ? (
            <MessageStream message={message.streamMessage} />
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>
      </div>
    </div>
  );
}
