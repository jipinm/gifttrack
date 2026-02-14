/**
 * Network Context
 * Monitors network connectivity and provides status to the app
 */
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { StyleSheet, Animated } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing, typography } from '../styles/theme';

interface NetworkContextType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const bannerOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let unsubscribe: NetInfoSubscription | null = null;

    const initNetInfo = async () => {
      try {
        // Get initial state
        const state = await NetInfo.fetch();
        handleNetworkChange(state);

        // Subscribe to changes
        unsubscribe = NetInfo.addEventListener(handleNetworkChange);
      } catch (error) {
        console.error('Error initializing NetInfo:', error);
        // Assume connected if NetInfo fails
        setIsConnected(true);
        setIsInternetReachable(true);
      }
    };

    initNetInfo();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleNetworkChange = (state: NetInfoState): void => {
    const connected = state.isConnected;
    const reachable = state.isInternetReachable;

    setIsConnected(connected);
    setIsInternetReachable(reachable);
    setConnectionType(state.type);

    // Show/hide offline banner
    const isOffline = connected === false || (connected && reachable === false);

    if (isOffline && !showOfflineBanner) {
      setShowOfflineBanner(true);
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!isOffline && showOfflineBanner) {
      Animated.timing(bannerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowOfflineBanner(false);
      });
    }
  };

  const checkConnection = async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable !== false;
    } catch {
      return true; // Assume connected if check fails
    }
  };

  const value = useMemo(
    () => ({
      isConnected,
      isInternetReachable,
      connectionType,
      checkConnection,
    }),
    [isConnected, isInternetReachable, connectionType]
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
      {showOfflineBanner && (
        <Animated.View style={[styles.offlineBanner, { opacity: bannerOpacity }]}>
          <Icon source="wifi-off" size={16} color={colors.white} />
          <Text style={styles.offlineText}>No internet connection</Text>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  offlineText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
});

export default NetworkProvider;
