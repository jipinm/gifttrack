/**
 * Main Tab Navigator
 * Bottom tab navigation for main app sections
 * App: Gifts Track
 * 
 * Admin tabs: Events, Customers, Add Customer, Profile
 * SuperAdmin tabs: Events, Customers, Admins, Profile
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, borderRadius, shadows } from '../styles/theme';
import EventStackNavigator from './EventStackNavigator';
import CustomerStackNavigator from './CustomerStackNavigator';
import AdminStackNavigator from './AdminStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import { CreateCustomerScreen } from '../screens/Customers';

export type MainTabParamList = {
  EventsTab: undefined;
  CustomersTab: undefined;
  AddCustomerTab: undefined;
  AdminsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { isSuperAdmin } = useAuth();
  const isSuperAdminValue = isSuperAdmin();
  const insets = useSafeAreaInsets();

  // Calculate tab bar height with safe area insets for edge-to-edge support
  const tabBarHeight = 70 + insets.bottom;

  return (
    <Tab.Navigator
      key={isSuperAdminValue ? 'superadmin-tabs' : 'admin-tabs'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 12 + insets.bottom,
          height: tabBarHeight,
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
          position: 'absolute',
          ...shadows.lg,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="EventsTab"
        component={EventStackNavigator}
        options={{
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-star" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomerStackNavigator}
        options={{
          tabBarLabel: 'Customers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      {!isSuperAdminValue && (
        <Tab.Screen
          name="AddCustomerTab"
          component={CreateCustomerScreen}
          options={{
            headerShown: true,
            headerTitle: 'Add Customer',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: '600' },
            tabBarLabel: 'Add Customer',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-plus" color={color} size={size} />
            ),
          }}
        />
      )}
      {isSuperAdminValue && (
        <Tab.Screen
          name="AdminsTab"
          component={AdminStackNavigator}
          options={{
            tabBarLabel: 'Admins',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shield-account" color={color} size={size} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
