/**
 * Create Event Screen (SuperAdmin only)
 * Form for creating a new standalone event
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { eventService } from '../../services/eventService';
import { EventTypeDropdown } from '../../components/Dropdowns';
import { colors, spacing, borderRadius } from '../../styles/theme';
import type { EventType, EventInput, EventCategory } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList, 'CreateEvent'>;

export default function CreateEventScreen() {
  const navigation = useNavigation<NavigationProp>();

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventTypeId, setEventTypeId] = useState<number | null>(null);
  const [eventTypeError, setEventTypeError] = useState<string | undefined>();
  const [eventCategory, setEventCategory] = useState<EventCategory>('self_event');
  const [notes, setNotes] = useState('');

  // Date picker handler
  const handleDateChange = useCallback((_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  }, []);

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Dropdown handlers
  const handleEventTypeSelect = useCallback((eventType: EventType | null) => {
    setEventTypeId(eventType?.id ?? null);
    setEventTypeError(undefined);
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    let hasError = false;

    if (!name.trim()) {
      setNameError('Event name is required');
      hasError = true;
    } else {
      setNameError(undefined);
    }

    if (!eventTypeId) {
      setEventTypeError('Event type is required');
      hasError = true;
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);

      const eventData: EventInput = {
        name: name.trim(),
        eventDate: eventDate.toISOString().split('T')[0],
        eventTypeId: eventTypeId!,
        eventCategory,
        notes: notes.trim() || undefined,
      };

      const response = await eventService.create(eventData);

      if (response.success) {
        Alert.alert('Success', 'Event created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create event');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, eventDate, eventTypeId, eventCategory, notes, navigation]);

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={150}
      extraHeight={150}
      viewIsInsideTabBar={true}
      enableResetScrollToCoords={false}
    >
      {/* Event Name */}
      <View style={styles.inputContainer}>
        <TextInput
          label="Event Name *"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(undefined);
          }}
          mode="outlined"
          error={!!nameError}
          disabled={isSubmitting}
          placeholder="e.g., Diwali Celebration 2024"
        />
        {nameError && <Text style={styles.errorText}>{nameError}</Text>}
      </View>

      {/* Event Date */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Event Date *</Text>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          icon="calendar"
          contentStyle={styles.dateButtonContent}
          style={styles.dateButton}
          disabled={isSubmitting}
        >
          {formatDate(eventDate)}
        </Button>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Event Type Dropdown */}
      <View style={styles.inputContainer}>
        <EventTypeDropdown
          value={eventTypeId}
          onSelect={handleEventTypeSelect}
          label="Event Type *"
          error={eventTypeError}
          disabled={isSubmitting}
        />
      </View>

      {/* Event Category */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Event Category *</Text>
        <SegmentedButtons
          value={eventCategory}
          onValueChange={(value) => setEventCategory(value as EventCategory)}
          buttons={[
            {
              value: 'self_event',
              label: 'Self Event',
              icon: 'account',
            },
            {
              value: 'customer_event',
              label: 'Customer Event',
              icon: 'account-group',
            },
          ]}
          style={styles.segmentedButtons}
        />
        <Text style={styles.categoryHint}>
          {eventCategory === 'self_event'
            ? '📥 Self Event: Gifts will be received from customers'
            : '📤 Customer Event: Gifts will be given to customers'}
        </Text>
      </View>

      {/* Notes */}
      <View style={styles.inputContainer}>
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          disabled={isSubmitting}
          style={styles.notesInput}
        />
      </View>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        {isSubmitting ? 'Creating Event...' : 'Create Event'}
      </Button>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  dateButton: {
    borderColor: colors.border,
  },
  dateButtonContent: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.sm,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  categoryHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  notesInput: {
    backgroundColor: colors.surface,
  },
  submitButton: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
});
