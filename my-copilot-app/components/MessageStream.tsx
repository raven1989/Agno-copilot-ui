'use client';

import { StreamMessage } from '../lib/types';
import { ReasoningBlock } from './ReasoningBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { ContentBlock } from './ContentBlock';

interface MessageStreamProps {
  message: StreamMessage;
}

export function MessageStream({ message }: MessageStreamProps) {
  const hasReasoning = message.reasoning_content && message.reasoning_content.length > 0;
  const hasToolCalls = message.tool_calls.length > 0;
  const hasContent = message.content && message.content.length > 0;

  return (
    <div className="space-y-2">
      {hasReasoning && (
        <ReasoningBlock content={message.reasoning_content} />
      )}
      
      {hasToolCalls && (
        <div className="space-y-1">
          {message.tool_calls.map((toolCall) => (
            <ToolCallBlock
              key={toolCall.tool.tool_call_id}
              tool={toolCall.tool}
              status={toolCall.status}
            />
          ))}
        </div>
      )}
      
      {hasContent && <ContentBlock content={message.content} />}
      
      {message.status === 'streaming' && !hasContent && !hasReasoning && !hasToolCalls && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}
