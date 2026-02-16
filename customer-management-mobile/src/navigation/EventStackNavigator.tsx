/**
 * Event Stack Navigator
 * Stack navigation for standalone event screens
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, typography } from '../styles/theme';
import { EventListScreen, EventDetailsScreen, CreateEventScreen, EditEventScreen } from '../screens/Events';
import { CreateGiftScreen, EditGiftScreen } from '../screens/Gifts';
import AttachCustomerScreen from '../screens/Events/AttachCustomerScreen';
import EventCustomerGiftsScreen from '../screens/Events/EventCustomerGiftsScreen';
import type { EventCategory } from '../types';

export type EventStackParamList = {
  EventList: undefined;
  EventDetails: { eventId: string };
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  AttachCustomer: { eventId: string; eventCategory: EventCategory };
  EventCustomerGifts: {
    eventId: string;
    customerId: string;
    customerName: string;
    eventCategory: EventCategory;
  };
  CreateGift: { eventId: string; customerId: string };
  EditGift: { giftId: string; customerId: string };
};

const Stack = createNativeStackNavigator<EventStackParamList>();

export default function EventStackNavigator() {
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
        name="EventList"
        component={EventListScreen}
        options={{ title: 'Events' }}
      />
      <Stack.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: 'Event Details' }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: 'Create Event' }}
      />
      <Stack.Screen
        name="EditEvent"
        component={EditEventScreen}
        options={{ title: 'Edit Event' }}
      />
      <Stack.Screen
        name="AttachCustomer"
        component={AttachCustomerScreen}
        options={{ title: 'Attach Customer' }}
      />
      <Stack.Screen
        name="EventCustomerGifts"
        component={EventCustomerGiftsScreen}
        options={{ title: 'Customer Gifts' }}
      />
      <Stack.Screen
        name="CreateGift"
        component={CreateGiftScreen}
        options={{ title: 'Add Gift' }}
      />
      <Stack.Screen
        name="EditGift"
        component={EditGiftScreen}
        options={{ title: 'Edit Gift' }}
      />
    </Stack.Navigator>
  );
}
