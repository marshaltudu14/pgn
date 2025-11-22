import { useState, useEffect } from 'react';
import { NetworkStatus, networkMonitor } from '@/utils/network-check';

export function useNetworkMonitor() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);

  useEffect(() => {
    // Get initial status
    const initialStatus = networkMonitor.getCurrentStatus();
    setNetworkStatus(initialStatus);

    // Listen for network changes
    const unsubscribe = networkMonitor.addListener((status) => {
      setNetworkStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Helper function to get connection details for UI
  const getConnectionDisplayInfo = () => {
    if (!networkStatus) {
      return {
        text: 'Checking...',
        color: '#8E8E93', // gray
        icon: 'WifiOff',
        isConnected: false
      };
    }

    const isConnected = networkStatus.isConnected && networkStatus.isInternetReachable;

    // Get connection type display text
    let displayText = 'No Internet';
    if (isConnected) {
      switch (networkStatus.connectionType) {
        case 'wifi':
          displayText = 'WiFi';
          break;
        case 'cellular':
          displayText = 'Mobile';
          break;
        case 'ethernet':
          displayText = 'Ethernet';
          break;
        default:
          displayText = 'Connected';
      }
    }

    return {
      text: displayText,
      color: isConnected ? '#10B981' : '#EF4444', // green or red
      icon: isConnected ? 'Wifi' : 'WifiOff',
      isConnected
    };
  };

  return {
    networkStatus,
    connectionDisplayInfo: getConnectionDisplayInfo()
  };
}