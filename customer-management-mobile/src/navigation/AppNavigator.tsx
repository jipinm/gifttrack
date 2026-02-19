/**
 * App Navigator
 * Main navigator for authenticated users
 * Uses bottom tab navigation with nested stacks
 */
import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import MainTabNavigator from './MainTabNavigator';
import { TodayEventsNotification } from '../components/Notifications';
import type { MainTabParamList } from './MainTabNavigator';

// Re-export navigation types from stack navigators
export type { CustomerStackParamList } from './CustomerStackNavigator';
export type { AdminStackParamList } from './AdminStackNavigator';
export type { ProfileStackParamList } from './ProfileStackNavigator';
export type { MainTabParamList } from './MainTabNavigator';

export default function AppNavigator() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  // Handle navigation to event details from notification
  const handleNavigateToEvent = useCallback(
    (eventId: string) => {
      // Navigate to EventDetails inside EventsTab stack
      (navigation as any).navigate('EventsTab', {
        screen: 'EventDetails',
        params: { eventId },
      });
    },
    [navigation]
  );

  return (
    <>
      <MainTabNavigator />
      <TodayEventsNotification onNavigateToEvent={handleNavigateToEvent} />
    </>
  );
}
