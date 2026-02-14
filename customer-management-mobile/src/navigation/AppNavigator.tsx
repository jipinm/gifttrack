/**
 * App Navigator
 * Main navigator for authenticated users
 * Uses bottom tab navigation with nested stacks
 */
import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import { TodayEventsNotification } from '../components/Notifications';
import type { CustomerStackParamList } from './CustomerStackNavigator';

// Re-export navigation types from stack navigators
export type { CustomerStackParamList } from './CustomerStackNavigator';
export type { AdminStackParamList } from './AdminStackNavigator';
export type { ProfileStackParamList } from './ProfileStackNavigator';
export type { MainTabParamList } from './MainTabNavigator';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

export default function AppNavigator() {
  const navigation = useNavigation<NavigationProp>();

  // Handle navigation to customer details from notification
  const handleNavigateToCustomer = useCallback(
    (customerId: string) => {
      // Navigate to customer details
      navigation.navigate('CustomerDetails', { customerId });
    },
    [navigation]
  );

  return (
    <>
      <MainTabNavigator />
      <TodayEventsNotification onNavigateToCustomer={handleNavigateToCustomer} />
    </>
  );
}
