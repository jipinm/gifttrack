/**
 * Admin Stack Navigator
 * Stack navigation for admin management screens (Superadmin only)
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../styles/theme';
import { AdminListScreen, CreateAdminScreen, EditAdminScreen } from '../screens/Admins';

export type AdminStackParamList = {
  AdminList: undefined;
  CreateAdmin: undefined;
  EditAdmin: { adminId: string };
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: typography.fontWeight.semibold as '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="AdminList"
        component={AdminListScreen}
        options={{ title: 'Admin Management' }}
      />
      <Stack.Screen
        name="CreateAdmin"
        component={CreateAdminScreen}
        options={{ title: 'Add Admin' }}
      />
      <Stack.Screen
        name="EditAdmin"
        component={EditAdminScreen}
        options={{ title: 'Edit Admin' }}
      />
    </Stack.Navigator>
  );
}
