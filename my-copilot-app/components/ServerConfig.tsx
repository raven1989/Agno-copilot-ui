'use client';

import { useState } from 'react';
import { Server, Check, X, Loader2 } from 'lucide-react';
import { ConnectionStatus } from '@/lib/types';

interface ServerConfigProps {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  connectionStatus: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

export function ServerConfig({
  serverUrl,
  setServerUrl,
  connectionStatus,
  connect,
  disconnect,
  error,
}: ServerConfigProps) {
  const [inputUrl, setInputUrl] = useState(serverUrl);

  const handleConnect = () => {
    setServerUrl(inputUrl);
    connect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Check className="w-3 h-3" />;
      case 'connecting':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'error':
        return <X className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Server className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-medium text-gray-700">Server Configuration</h3>
      </div>

      <div className="space-y-2">
        <label className="block text-xs text-gray-500">Server URL</label>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="http://localhost:9001"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={connectionStatus === 'connecting'}
        />

        {connectionStatus === 'connected' ? (
          <button
            onClick={disconnect}
            className="w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connectionStatus === 'connecting' || !inputUrl.trim()}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        )}

        <div className="flex items-center gap-2 mt-2">
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-xs">{getStatusText()}</span>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}