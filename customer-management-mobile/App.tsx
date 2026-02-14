/**
 * Customer Management Mobile App
 * Main entry point with providers and navigation
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { MasterDataProvider } from './src/context/MasterDataContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { RootNavigator } from './src/navigation';
import { ErrorBoundary, ToastProvider } from './src/components';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <PreferencesProvider>
            <NetworkProvider>
              <ToastProvider>
                <AuthProvider>
                  <MasterDataProvider>
                    <PaperProvider>
                      <StatusBar style="auto" />
                      <RootNavigator />
                    </PaperProvider>
                  </MasterDataProvider>
                </AuthProvider>
              </ToastProvider>
            </NetworkProvider>
          </PreferencesProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
