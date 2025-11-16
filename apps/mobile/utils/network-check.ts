import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { apiClient } from '@/services/api-client';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: NetInfoStateType;
  details: string;
  lastChecked: number;
}

export interface NetworkCheckResult {
  isOnline: boolean;
  canReachAPI: boolean;
  connectionType: NetInfoStateType;
  latency?: number;
  error?: string;
}

export class NetworkMonitor {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus | null = null;
  private checkInterval: any = null;
  private unsubscribeNetInfo: (() => void) | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('🌐 Network Monitor: Initializing...');

    // Get initial network status
    await this.updateNetworkStatus();

    // Start monitoring
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Listen for network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange.bind(this));

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.performNetworkCheck();
    }, this.CHECK_INTERVAL);

    console.log('✅ Network Monitor: Started monitoring');
  }

  private stopMonitoring(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('⏹️ Network Monitor: Stopped monitoring');
  }

  private handleNetworkChange = (state: NetInfoState): void => {
    console.log('🔄 Network Monitor: Network state changed', {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });

    this.updateNetworkStatus(state);
  };

  private async updateNetworkStatus(netInfoState?: NetInfoState): Promise<void> {
    try {
      const state = netInfoState || (await NetInfo.fetch());

      // Check API connectivity to determine internet reachability
      const result = await this.checkAPIConnectivity();

      const status: NetworkStatus = {
        isConnected: state.isConnected || false,
        isInternetReachable: result.canReachAPI ? true : state.isInternetReachable,
        connectionType: state.type,
        details: this.getConnectionDetails(state, result),
        lastChecked: Date.now(),
      };

      this.currentStatus = status;
      this.notifyListeners(status);

      console.log('📊 Network Monitor: Status updated', status);
    } catch (error) {
      console.error('❌ Network Monitor: Failed to update status', error);

      // Set a default offline status
      const offlineStatus: NetworkStatus = {
        isConnected: false,
        isInternetReachable: false,
        connectionType: NetInfoStateType.none,
        details: 'Network check failed',
        lastChecked: Date.now(),
      };

      this.currentStatus = offlineStatus;
      this.notifyListeners(offlineStatus);
    }
  }

  private getConnectionDetails(state: NetInfoState, apiResult?: NetworkCheckResult): string {
    const { type, isConnected, isInternetReachable, details } = state;

    let detailsStr = `Type: ${type}`;

    if (type === NetInfoStateType.wifi && details) {
      const wifiDetails = details as any;
      if (wifiDetails.ssid) {
        detailsStr += `, SSID: ${wifiDetails.ssid}`;
      }
      if (wifiDetails.strength !== undefined) {
        detailsStr += `, Strength: ${Math.round(wifiDetails.strength * 100)}%`;
      }
    }

    if (type === NetInfoStateType.cellular && details) {
      const cellularDetails = details as any;
      if (cellularDetails.carrier) {
        detailsStr += `, Carrier: ${cellularDetails.carrier}`;
      }
      if (cellularDetails.cellularGeneration) {
        detailsStr += `, Generation: ${cellularDetails.cellularGeneration}`;
      }
    }

    detailsStr += `, Connected: ${isConnected}`;
    detailsStr += `, Internet: ${isInternetReachable}`;

    if (apiResult) {
      detailsStr += `, API: ${apiResult.canReachAPI}`;
      if (apiResult.latency) {
        detailsStr += `, Latency: ${apiResult.latency}ms`;
      }
    }

    return detailsStr;
  }

  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('❌ Network Monitor: Error in listener callback', error);
      }
    });
  }

  private async performNetworkCheck(): Promise<void> {
    try {
      const result = await this.checkAPIConnectivity();

      // Update status with new information
      if (this.currentStatus) {
        this.currentStatus.isConnected = result.isOnline;
        this.currentStatus.lastChecked = Date.now();

        if (!result.canReachAPI && result.isOnline) {
          this.currentStatus.details += ' (API unreachable)';
        }
      }
    } catch (error) {
      console.error('❌ Network Monitor: Error in periodic check', error);
    }
  }

  // Public Methods
  async checkAPIConnectivity(): Promise<NetworkCheckResult> {
    try {
      console.log('🔍 Network Monitor: Checking API connectivity...');
      const startTime = Date.now();

      // Get current network state
      const netInfoState = await NetInfo.fetch();

      const isOnline = await apiClient.checkConnectivity();
      const latency = Date.now() - startTime;

      console.log('📡 Network Monitor: API check result', {
        isOnline,
        canReachAPI: isOnline,
        connectionType: netInfoState.type,
        latency,
      });

      return {
        isOnline: netInfoState.isConnected || false,
        canReachAPI: isOnline,
        connectionType: netInfoState.type,
        latency,
      };
    } catch (error) {
      console.error('❌ Network Monitor: API connectivity check failed', error);

      const netInfoState = await NetInfo.fetch();

      return {
        isOnline: netInfoState.isConnected || false,
        canReachAPI: false,
        connectionType: netInfoState.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getCurrentStatus(): NetworkStatus | null {
    return this.currentStatus;
  }

  async getCurrentStatusAsync(): Promise<NetworkStatus> {
    await this.updateNetworkStatus();
    return this.currentStatus!;
  }

  addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);

    // Immediately call with current status if available
    if (this.currentStatus) {
      listener(this.currentStatus);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  removeListener(listener: (status: NetworkStatus) => void): void {
    this.listeners.delete(listener);
  }

  async waitForConnection(): Promise<NetworkStatus> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();

      // Check immediately
      if (this.currentStatus?.isConnected && this.currentStatus?.isInternetReachable) {
        resolve(this.currentStatus);
        return;
      }

      // Set up listener
      const unsubscribe = this.addListener((status) => {
        if (status.isConnected && status.isInternetReachable) {
          unsubscribe();
          resolve(status);
        }
      });

      // Try to check connectivity directly
      try {
        await this.performNetworkCheck();
        if (this.currentStatus?.isConnected && this.currentStatus?.isInternetReachable) {
          unsubscribe();
          resolve(this.currentStatus);
        }
      } catch (error) {
        unsubscribe();
        reject(new Error('Connection failed'));
      }
    });
  }

  async isConnectionSlow(): Promise<boolean> {
    const result = await this.checkAPIConnectivity();

    // Consider connection slow if latency > 5 seconds or if it's cellular with high latency
    const isLatencyHigh = result.latency && result.latency > 5000;
    const isCellularSlow = result.connectionType === NetInfoStateType.cellular &&
                          result.latency && result.latency > 3000;

    return !!(isLatencyHigh || isCellularSlow);
  }

  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' {
    if (!this.currentStatus?.isConnected) {
      return 'offline';
    }

    const { connectionType, isInternetReachable } = this.currentStatus;

    if (!isInternetReachable) {
      return 'poor';
    }

    switch (connectionType) {
      case NetInfoStateType.wifi:
        return 'excellent';
      case NetInfoStateType.ethernet:
        return 'excellent';
      case NetInfoStateType.cellular:
        return 'good';
      case NetInfoStateType.bluetooth:
        return 'fair';
      case NetInfoStateType.other:
        return 'fair';
      case NetInfoStateType.none:
        return 'offline';
      default:
        return 'poor';
    }
  }

  getNetworkInfo(): {
    isConnected: boolean;
    isOnline: boolean;
    connectionType: NetInfoStateType;
    quality: string;
    details: string;
    lastChecked: number;
  } {
    const status = this.currentStatus;

    return {
      isConnected: status?.isConnected || false,
      isOnline: status?.isInternetReachable || false,
      connectionType: status?.connectionType || NetInfoStateType.none,
      quality: this.getConnectionQuality(),
      details: status?.details || 'Unknown',
      lastChecked: status?.lastChecked || 0,
    };
  }

  // Cleanup method
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
    this.currentStatus = null;
    console.log('🗑️ Network Monitor: Destroyed');
  }
}

// Create singleton instance
export const networkMonitor = new NetworkMonitor();

// Convenience functions for common usage
export const useNetworkStatus = () => {
  return networkMonitor.getCurrentStatus();
};

export const checkConnectivity = () => {
  return networkMonitor.checkAPIConnectivity();
};

export const waitForConnection = () => {
  return networkMonitor.waitForConnection();
};