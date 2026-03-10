'use client';

import { ChatContainer } from '@/components/ChatContainer';
import { Sidebar } from '@/components/Sidebar';
import { ConfigProvider, useConfigContext } from '@/lib/context/ConfigContext';

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
  } = useConfigContext();

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
      />
      <div className="flex-1 h-full">
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
