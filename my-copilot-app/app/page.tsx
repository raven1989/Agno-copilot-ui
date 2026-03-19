'use client';

import { ChatContainer } from '@/components/ChatContainer';
import { Sidebar } from '@/components/Sidebar';
import { ConfigProvider, useConfigContext } from '@/lib/context/ConfigContext';
import { useSessionManager } from '@/lib/hooks/useSessionManager';

function MainContent() {
  const {
    serverUrl,
    setServerUrl,
    connectionStatus,
    connect,
    disconnect,
    refresh,
    refreshing,
    error,
    agents,
    teams,
    selectedEntity,
    selectEntity,
    sidebarOpen,
    toggleSidebar,
    currentSessionId,
    setCurrentSessionId,
  } = useConfigContext();

  // Session manager hook
  const {
    sessions,
    page: sessionPage,
    totalPages: sessionTotalPages,
    totalCount: sessionTotalCount,
    isLoading: sessionIsLoading,
    error: sessionError,
    selectedSessionIds,
    fetchSessions,
    deleteSelectedSessions,
    toggleSessionSelection,
    selectAllSessions,
    clearSelection,
    refreshSessions,
  } = useSessionManager({
    serverUrl,
    connectionStatus,
    selectedEntityType: selectedEntity?.type || null,
  });

  // Handle session loading - just set the ID, ChatContainer will load it
  const handleLoadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <main className="h-screen w-screen flex">
      <Sidebar
        serverUrl={serverUrl}
        setServerUrl={setServerUrl}
        connectionStatus={connectionStatus}
        connect={connect}
        disconnect={disconnect}
        refresh={refresh}
        refreshing={refreshing}
        error={error}
        agents={agents}
        teams={teams}
        selectedEntity={selectedEntity}
        selectEntity={selectEntity}
        isOpen={sidebarOpen}
        // Session management props
        sessions={sessions}
        sessionPage={sessionPage}
        sessionTotalPages={sessionTotalPages}
        sessionTotalCount={sessionTotalCount}
        sessionIsLoading={sessionIsLoading}
        sessionError={sessionError}
        selectedSessionIds={selectedSessionIds}
        currentSessionId={currentSessionId}
        onLoadSession={handleLoadSession}
        onFetchSessions={fetchSessions}
        onDeleteSelectedSessions={deleteSelectedSessions}
        onToggleSessionSelection={toggleSessionSelection}
        onSelectAllSessions={selectAllSessions}
        onClearSelection={clearSelection}
        onRefreshSessions={refreshSessions}
      />
      <div className="flex-1 h-full min-w-0">
        <ChatContainer onToggleSidebar={toggleSidebar} />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ConfigProvider>
      <MainContent />
    </ConfigProvider>
  );
}
