/**
 * Create Customer Screen
 * Form for creating a new customer with optional event connection.
 * After creating the customer, if an event is selected, the customer
 * is automatically attached to that event.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { customerService } from '../../services/customerService';
import { eventService } from '../../services/eventService';
import { giftService } from '../../services/giftService';
import {
  StateDropdown,
  DistrictDropdown,
  CityDropdown,
  InvitationStatusDropdown,
  CareOfDropdown,
  GiftTypeDropdown,
} from '../../components/Dropdowns';
import EventCardSelector from '../../components/EventCardSelector';
import { colors, spacing, typography } from '../../styles/theme';
import type {
  CustomerInput,
  State,
  District,
  City,
  Event,
  InvitationStatus,
  CareOfOption,
  GiftType,
} from '../../types';

interface FormData {
  name: string;
  mobileNumber: string;
  address: string;
  notes: string;
}

export default function CreateCustomerScreen() {
  const navigation = useNavigation();

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stateId, setStateId] = useState<number | null>(1); // Default: Kerala
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);

  // Validation errors for dropdowns
  const [districtError, setDistrictError] = useState<string | undefined>();
  const [cityError, setCityError] = useState<string | undefined>();

  // Event connection state (optional)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [invitationStatusId, setInvitationStatusId] = useState<number | null>(null);
  const [careOfId, setCareOfId] = useState<number | null>(null);
  const [invitationError, setInvitationError] = useState<string | undefined>();
  const [careOfError, setCareOfError] = useState<string | undefined>();
  const isSelfEvent = selectedEvent?.eventCategory === 'self_event';

  // Gift state (optional, shown after invitation status is selected)
  const [giftTypeId, setGiftTypeId] = useState<number | null>(null);
  const [giftValue, setGiftValue] = useState('');
  const [giftDescription, setGiftDescription] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      mobileNumber: '',
      address: '',
      notes: '',
    },
  });

  // Validation functions
  const validateName = (value: string): string | true => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return true;
  };

  const validateAddress = (value: string): string | true => {
    if (!value.trim()) return 'Address is required';
    return true;
  };

  // Dropdown handlers
  const handleStateSelect = useCallback((state: State | null) => {
    setStateId(state?.id ?? null);
    setDistrictId(null);
    setCityId(null);
  }, []);

  const handleDistrictSelect = useCallback((district: District | null) => {
    setDistrictId(district?.id ?? null);
    setCityId(null);
    setDistrictError(undefined);
  }, []);

  const handleCitySelect = useCallback((city: City | null) => {
    setCityId(city?.id ?? null);
    setCityError(undefined);
  }, []);

  // Event connection handlers
  const handleEventSelect = useCallback((event: Event | null) => {
    setSelectedEvent(event);
    // Reset attachment fields when event changes
    if (!event) {
      setInvitationStatusId(null);
      setCareOfId(null);
      setInvitationError(undefined);
      setCareOfError(undefined);
      setGiftTypeId(null);
      setGiftValue('');
      setGiftDescription('');
    }
  }, []);

  const handleInvitationStatusSelect = useCallback(
    (item: InvitationStatus | null) => {
      setInvitationStatusId(item?.id ?? null);
      setInvitationError(undefined);
    },
    []
  );

  const handleCareOfSelect = useCallback((item: CareOfOption | null) => {
    setCareOfId(item?.id ?? null);
    setCareOfError(undefined);
  }, []);

  const handleGiftTypeSelect = useCallback((giftType: GiftType | null) => {
    setGiftTypeId(giftType?.id ?? null);
  }, []);

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormData) => {
      // Validate location dropdowns
      let hasError = false;
      if (!districtId) {
        setDistrictError('District is required');
        hasError = true;
      }
      if (!cityId) {
        setCityError('City is required');
        hasError = true;
      }

      // Validate event connection fields (only when an event is selected)
      if (selectedEvent) {
        if (!invitationStatusId) {
          setInvitationError('Invitation status is required');
          hasError = true;
        }
        if (isSelfEvent && !careOfId) {
          setCareOfError('Care Of is required for Self Event');
          hasError = true;
        }
      }

      if (hasError) return;

      try {
        setIsSubmitting(true);

        const customerData: CustomerInput = {
          name: data.name.trim(),
          mobileNumber: data.mobileNumber?.trim() || undefined,
          address: data.address.trim(),
          stateId: stateId ?? undefined,
          districtId: districtId!,
          cityId: cityId!,
          notes: data.notes.trim() || undefined,
        };

        const response = await customerService.create(customerData);

        if (response.success) {
          const newCustomer = response.data as any;

          // If an event is selected, attach the customer to it
          if (selectedEvent && newCustomer?.id) {
            try {
              const attachResponse = await eventService.attachCustomer({
                eventId: selectedEvent.id,
                customerId: newCustomer.id,
                invitationStatusId: invitationStatusId!,
                careOfId: careOfId ?? undefined,
              });

              if (!attachResponse.success) {
                // Customer created but attach failed — inform the user
                Alert.alert(
                  'Partial Success',
                  `Customer created, but failed to link to event: ${attachResponse.message || 'Unknown error'}`,
                  [
                    {
                      text: 'OK',
                      onPress: () =>
                        navigation.dispatch(
                          CommonActions.navigate({ name: 'CustomersTab' })
                        ),
                    },
                  ]
                );
                return;
              }

              // If gift value is entered, create gift after successful attachment
              if (giftValue && parseFloat(giftValue) > 0 && giftTypeId) {
                try {
                  await giftService.createGift({
                    eventId: selectedEvent.id,
                    customerId: newCustomer.id,
                    giftTypeId,
                    value: parseFloat(giftValue),
                    description: giftDescription.trim() || undefined,
                  });
                } catch {
                  // Gift creation failed but customer + attachment succeeded
                  Alert.alert(
                    'Partial Success',
                    'Customer created and linked to event, but gift creation failed.',
                    [
                      {
                        text: 'OK',
                        onPress: () =>
                          navigation.dispatch(
                            CommonActions.navigate({ name: 'CustomersTab' })
                          ),
                      },
                    ]
                  );
                  return;
                }
              }
            } catch (attachErr) {
              Alert.alert(
                'Partial Success',
                `Customer created, but failed to link to event: ${attachErr instanceof Error ? attachErr.message : 'Unknown error'}`,
                [
                  {
                    text: 'OK',
                    onPress: () =>
                      navigation.dispatch(
                        CommonActions.navigate({ name: 'CustomersTab' })
                      ),
                  },
                ]
              );
              return;
            }
          }

          // Full success — reset form and navigate
          reset();
          setStateId(1);
          setDistrictId(null);
          setCityId(null);
          setSelectedEvent(null);
          setInvitationStatusId(null);
          setCareOfId(null);
          setGiftTypeId(null);
          setGiftValue('');
          setGiftDescription('');

          const successMsg = selectedEvent
            ? 'Customer created and linked to event successfully'
            : 'Customer created successfully';

          Alert.alert('Success', successMsg, [
            {
              text: 'OK',
              onPress: () => {
                navigation.dispatch(
                  CommonActions.navigate({ name: 'CustomersTab' })
                );
              },
            },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to create customer');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [stateId, districtId, cityId, selectedEvent, invitationStatusId, careOfId, isSelfEvent, giftTypeId, giftValue, giftDescription, navigation, reset]
  );

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
        {/* Name */}
        <Controller
          control={control}
          name="name"
          rules={{ validate: validateName }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Name *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                error={!!errors.name}
                disabled={isSubmitting}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Mobile Number */}
        <Controller
          control={control}
          name="mobileNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Mobile Number"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                keyboardType="phone-pad"
                maxLength={10}
                error={!!errors.mobileNumber}
                disabled={isSubmitting}
              />
              <HelperText type="error" visible={!!errors.mobileNumber}>
                {errors.mobileNumber?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Address */}
        <Controller
          control={control}
          name="address"
          rules={{ validate: validateAddress }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Address *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                multiline
                numberOfLines={3}
                error={!!errors.address}
                disabled={isSubmitting}
              />
              <HelperText type="error" visible={!!errors.address}>
                {errors.address?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Location Dropdowns */}
        <Text style={styles.sectionTitle}>Location</Text>

        <StateDropdown
          value={stateId}
          onSelect={handleStateSelect}
          label="State"
          disabled={isSubmitting}
        />

        <DistrictDropdown
          value={districtId}
          stateId={stateId}
          onSelect={handleDistrictSelect}
          label="District"
          required
          error={districtError}
          disabled={isSubmitting}
        />

        <CityDropdown
          value={cityId}
          districtId={districtId}
          onSelect={handleCitySelect}
          label="City"
          required
          error={cityError}
          disabled={isSubmitting}
        />

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Notes (Optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                multiline
                numberOfLines={3}
                disabled={isSubmitting}
              />
            </View>
          )}
        />

        {/* Link to Event (Optional) */}
        <Text style={styles.sectionTitle}>Link to Event (Optional)</Text>
        <Text style={styles.sectionHint}>
          Select an event to automatically connect this customer after creation.
        </Text>

        <EventCardSelector
          selectedEvent={selectedEvent}
          onSelectEvent={handleEventSelect}
          disabled={isSubmitting}
        />

        {/* Invitation Status & Care Of (shown when event is selected) */}
        {selectedEvent && (
          <View style={styles.eventFieldsContainer}>
            <InvitationStatusDropdown
              value={invitationStatusId}
              onSelect={handleInvitationStatusSelect}
              label="Invitation Status"
              required
              error={invitationError}
              disabled={isSubmitting}
            />

            {isSelfEvent && (
              <CareOfDropdown
                value={careOfId}
                onSelect={handleCareOfSelect}
                label="Care Of"
                required
                error={careOfError}
                disabled={isSubmitting}
              />
            )}

          </View>
        )}

        {/* Gift Section (Optional) — shown when an event is selected */}
        {selectedEvent && (
          <View style={styles.giftSection}>
            <Text style={styles.giftSectionTitle}>🎁 Add Gift (Optional)</Text>

            <GiftTypeDropdown
              value={giftTypeId}
              onSelect={handleGiftTypeSelect}
              label="Gift Type"
              disabled={isSubmitting}
            />

            <TextInput
              label="Gift Value"
              value={giftValue}
              onChangeText={setGiftValue}
              mode="outlined"
              keyboardType="numeric"
              disabled={isSubmitting}
              style={styles.giftInput}
            />

            <TextInput
              label="Gift Description (Optional)"
              value={giftDescription}
              onChangeText={setGiftDescription}
              mode="outlined"
              multiline
              numberOfLines={2}
              disabled={isSubmitting}
              style={styles.giftInput}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Customer
          </Button>
        </View>
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
    paddingBottom: 120, // Extra padding to account for bottom tab bar
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  eventFieldsContainer: {
    marginTop: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  giftSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  giftSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  giftInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
  },
});
