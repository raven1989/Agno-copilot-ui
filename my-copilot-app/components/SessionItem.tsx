'use client';

import { Bot, Users } from 'lucide-react';
import { Session } from '@/lib/types';

interface SessionItemProps {
  session: Session;
  isSelected: boolean;
  isCurrentSession: boolean;
  onToggleSelect: (sessionId: string) => void;
  onClick: (sessionId: string) => void;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

export function SessionItem({
  session,
  isSelected,
  isCurrentSession,
  onToggleSelect,
  onClick,
}: SessionItemProps) {
  const isTeam = session.session_type === 'team';

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelect(session.session_id);
  };

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
        isCurrentSession
          ? 'bg-purple-100 text-purple-800'
          : 'hover:bg-gray-50 text-gray-700'
      }`}
      onClick={() => onClick(session.session_id)}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isTeam ? (
            <Users className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
          )}
          <span className="font-medium truncate">{session.session_name || 'Untitled Session'}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span>{formatDate(session.updated_at)}</span>
        </div>
      </div>
      {isCurrentSession && (
        <span className="text-xs px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded">
          Active
        </span>
      )}
    </div>
  );
}