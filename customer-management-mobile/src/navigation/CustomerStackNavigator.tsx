/**
 * Customer Stack Navigator
 * Stack navigation for customer-related screens
 * Note: Event screens now live in EventStackNavigator
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../styles/theme';
import {
  CustomerListScreen,
  CustomerDetailsScreen,
  CreateCustomerScreen,
  EditCustomerScreen,
} from '../screens/Customers';
import { EditGiftScreen } from '../screens/Gifts';

export type CustomerStackParamList = {
  CustomerList: undefined;
  CustomerDetails: { customerId: string };
  CreateCustomer: undefined;
  EditCustomer: { customerId: string };
  EditGift: { giftId: string; customerId: string };
};

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export default function CustomerStackNavigator() {
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
        name="CustomerList"
        component={CustomerListScreen}
        options={{ title: 'Customers' }}
      />
      <Stack.Screen
        name="CustomerDetails"
        component={CustomerDetailsScreen}
        options={{ title: 'Customer Details' }}
      />
      <Stack.Screen
        name="CreateCustomer"
        component={CreateCustomerScreen}
        options={{ title: 'Add Customer' }}
      />
      <Stack.Screen
        name="EditCustomer"
        component={EditCustomerScreen}
        options={{ title: 'Edit Customer' }}
      />
      <Stack.Screen name="EditGift" component={EditGiftScreen} options={{ title: 'Edit Gift' }} />
    </Stack.Navigator>
  );
}
