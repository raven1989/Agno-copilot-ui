'use client';

import { useState } from 'react';
import { History, Trash2, RefreshCw, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { Session, ConnectionStatus, SelectedEntity } from '@/lib/types';
import { SessionItem } from './SessionItem';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface SessionListProps {
  sessions: Session[];
  page: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  selectedSessionIds: Set<string>;
  currentSessionId: string | null;
  connectionStatus: ConnectionStatus;
  selectedEntity: SelectedEntity | null;
  onLoadSession: (sessionId: string) => void;
  onFetchSessions: (page: number) => void;
  onDeleteSelectedSessions: () => Promise<boolean>;
  onToggleSessionSelection: (sessionId: string) => void;
  onSelectAllSessions: () => void;
  onClearSelection: () => void;
  onRefreshSessions: () => void;
}

export function SessionList({
  sessions = [],
  page = 1,
  totalPages = 1,
  totalCount = 0,
  isLoading = false,
  error,
  selectedSessionIds = new Set(),
  currentSessionId,
  connectionStatus,
  selectedEntity,
  onLoadSession,
  onFetchSessions,
  onDeleteSelectedSessions,
  onToggleSessionSelection,
  onSelectAllSessions,
  onClearSelection,
  onRefreshSessions,
}: SessionListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isConnected = connectionStatus === 'connected';
  const hasSelection = selectedSessionIds.size > 0;
  const allSelected = sessions.length > 0 && sessions.every(s => selectedSessionIds.has(s.session_id));

  if (!isConnected) {
    return null;
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const success = await onDeleteSelectedSessions();
    if (success) {
      setShowDeleteModal(false);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAllSessions();
    }
  };

  return (
    <div className="flex flex-col border-t border-gray-200">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Recent Sessions
          </span>
          <span className="text-xs text-gray-400">({totalCount})</span>
        </div>
        <button
          onClick={onRefreshSessions}
          disabled={isLoading}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh sessions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Toolbar */}
      {sessions.length > 0 && (
        <div className="px-4 py-1.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
          </button>
          {hasSelection && (
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedSessionIds.size})</span>
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50">
          {error}
        </div>
      )}

      {/* Session List */}
      <div className="flex-1 overflow-y-auto max-h-48">
        {isLoading && sessions.length === 0 ? (
          <div className="px-4 py-3 text-center text-gray-400 text-sm">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-4 py-3 text-center text-gray-400 text-sm">
            No sessions yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <SessionItem
                key={session.session_id}
                session={session}
                isSelected={selectedSessionIds.has(session.session_id)}
                isCurrentSession={currentSessionId === session.session_id}
                onToggleSelect={onToggleSessionSelection}
                onClick={onLoadSession}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={() => onFetchSessions(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onFetchSessions(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        selectedCount={selectedSessionIds.size}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={isLoading}
      />
    </div>
  );
}