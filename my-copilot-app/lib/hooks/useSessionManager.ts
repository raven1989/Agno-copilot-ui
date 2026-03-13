import { useState, useCallback, useEffect } from 'react';
import { Session, SessionsResponse, EntityType, ConnectionStatus } from '../types';

interface UseSessionManagerOptions {
  serverUrl: string;
  connectionStatus: ConnectionStatus;
  selectedEntityType: EntityType | null;
}

interface UseSessionManagerReturn {
  sessions: Session[];
  page: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  selectedSessionIds: Set<string>;
  fetchSessions: (page?: number) => Promise<void>;
  deleteSelectedSessions: () => Promise<boolean>;
  toggleSessionSelection: (sessionId: string) => void;
  selectAllSessions: () => void;
  clearSelection: () => void;
  refreshSessions: () => Promise<void>;
}

export function useSessionManager(options: UseSessionManagerOptions): UseSessionManagerReturn {
  const { serverUrl, connectionStatus, selectedEntityType } = options;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());

  const fetchSessions = useCallback(async (pageNum: number = 1) => {
    if (connectionStatus !== 'connected') {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine which types to fetch
      const typesToFetch: EntityType[] = selectedEntityType
        ? [selectedEntityType]
        : ['agent', 'team'];

      // Fetch sessions for each type
      const allSessions: Session[] = [];
      let maxTotalPages = 1;
      let sumTotalCount = 0;

      for (const type of typesToFetch) {
        const params = new URLSearchParams({
          type,
          page: String(pageNum),
          limit: '20',
        });

        const response = await fetch(`${serverUrl}/sessions?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} sessions: ${response.status}`);
        }

        const data: SessionsResponse = await response.json();

        // Add session_type to each session
        const sessionsWithType = data.data.map(s => ({ ...s, session_type: type }));
        allSessions.push(...sessionsWithType);

        maxTotalPages = Math.max(maxTotalPages, data.meta.total_pages);
        sumTotalCount += data.meta.total_count;
      }

      // Sort by updated_at descending (most recent first)
      allSessions.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setSessions(allSessions);
      setPage(pageNum);
      setTotalPages(maxTotalPages);
      setTotalCount(sumTotalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl, connectionStatus, selectedEntityType]);

  const refreshSessions = useCallback(async () => {
    await fetchSessions(page);
  }, [fetchSessions, page]);

  const deleteSelectedSessions = useCallback(async (): Promise<boolean> => {
    if (selectedSessionIds.size === 0) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const selectedSessions = sessions.filter(s => selectedSessionIds.has(s.session_id));
      const session_ids = selectedSessions.map(s => s.session_id);
      const session_types = selectedSessions.map(s => s.session_type);

      const response = await fetch(`${serverUrl}/sessions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_ids,
          session_types,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete sessions: ${response.status}`);
      }

      // Clear selection and refresh list
      setSelectedSessionIds(new Set());
      await fetchSessions(page);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete sessions';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl, sessions, selectedSessionIds, fetchSessions, page]);

  const toggleSessionSelection = useCallback((sessionId: string) => {
    setSelectedSessionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  }, []);

  const selectAllSessions = useCallback(() => {
    setSelectedSessionIds(new Set(sessions.map(s => s.session_id)));
  }, [sessions]);

  const clearSelection = useCallback(() => {
    setSelectedSessionIds(new Set());
  }, []);

  // Fetch sessions when connection status or entity type changes
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchSessions(1);
    } else {
      setSessions([]);
      setPage(1);
      setTotalPages(1);
      setTotalCount(0);
    }
  }, [connectionStatus, selectedEntityType, fetchSessions]);

  return {
    sessions,
    page,
    totalPages,
    totalCount,
    isLoading,
    error,
    selectedSessionIds,
    fetchSessions,
    deleteSelectedSessions,
    toggleSessionSelection,
    selectAllSessions,
    clearSelection,
    refreshSessions,
  };
}