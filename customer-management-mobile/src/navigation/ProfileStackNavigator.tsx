/**
 * Profile Stack Navigator
 * Stack navigation for profile screen
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../styles/theme';
import { ProfileScreen, ChangePasswordScreen } from '../screens/Profile';
import {
  MasterDataCategoriesScreen,
  MasterDataListScreen,
  MasterDataFormScreen,
} from '../screens/MasterData';
import type { MasterDataCategory } from '../types';

export type ProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
  MasterDataCategories: undefined;
  MasterDataList: {
    category: MasterDataCategory;
    title: string;
  };
  MasterDataForm: {
    category: MasterDataCategory;
    title: string;
    itemId?: number;
    itemName?: string;
  };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: typography.fontWeight.semibold as '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen
        name="MasterDataCategories"
        component={MasterDataCategoriesScreen}
        options={{ title: 'Master Data' }}
      />
      <Stack.Screen
        name="MasterDataList"
        component={MasterDataListScreen}
        options={{ title: 'Master Data' }}
      />
      <Stack.Screen
        name="MasterDataForm"
        component={MasterDataFormScreen}
        options={{ title: 'Master Data' }}
      />
    </Stack.Navigator>
  );
}
