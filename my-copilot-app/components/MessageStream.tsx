'use client';

import { StreamMessage, MemberRun } from '../lib/types';
import { ReasoningBlock } from './ReasoningBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { ContentBlock } from './ContentBlock';
import { Users, Bot } from 'lucide-react';

interface MessageStreamProps {
  message: StreamMessage;
}

function MemberRunBlock({ memberRun }: { memberRun: MemberRun }) {
  const hasReasoning = memberRun.reasoning_content && memberRun.reasoning_content.length > 0;
  const hasContent = memberRun.content && memberRun.content.length > 0;
  const hasToolCalls = memberRun.tool_calls.length > 0;

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700">{memberRun.agent_name}</span>
        {memberRun.status === 'streaming' && (
          <span className="text-xs text-gray-400">working...</span>
        )}
      </div>
      <div className="space-y-2">
        {hasReasoning && (
          <ReasoningBlock content={memberRun.reasoning_content} />
        )}
        {hasToolCalls && (
          <div className="space-y-1">
            {memberRun.tool_calls.map((toolCall) => (
              <ToolCallBlock
                key={toolCall.tool.tool_call_id}
                tool={toolCall.tool}
                status={toolCall.status}
              />
            ))}
          </div>
        )}
        {hasContent && <ContentBlock content={memberRun.content} />}
      </div>
    </div>
  );
}

export function MessageStream({ message }: MessageStreamProps) {
  const hasReasoning = message.reasoning_content && message.reasoning_content.length > 0;
  const hasToolCalls = message.tool_calls.length > 0;
  const hasContent = message.content && message.content.length > 0;
  const hasMemberRuns = message.member_runs && message.member_runs.length > 0;
  const isTeam = message.entity_type === 'team';

  return (
    <div className="space-y-2">
      {isTeam && hasMemberRuns && (
        <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium mb-1">
          <Users className="w-3.5 h-3.5" />
          <span>Team Response</span>
        </div>
      )}

      {hasMemberRuns && (
        <div className="space-y-2 mb-3">
          {message.member_runs.map((memberRun) => (
            <MemberRunBlock key={memberRun.run_id} memberRun={memberRun} />
          ))}
        </div>
      )}

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
      
      {message.status === 'streaming' && !hasContent && !hasReasoning && !hasToolCalls && !hasMemberRuns && (
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
