/**
 * Create Customer Screen
 * Form for creating a new customer
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { customerService } from '../../services/customerService';
import {
  StateDropdown,
  DistrictDropdown,
  CityDropdown,
} from '../../components/Dropdowns';
import { colors, spacing } from '../../styles/theme';
import type {
  CustomerInput,
  State,
  District,
  City,
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

  const validateMobileNumber = (value: string): string | true => {
    if (!value) return 'Mobile number is required';
    if (!/^\d{10}$/.test(value)) return 'Mobile number must be exactly 10 digits';
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

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormData) => {
      // Validate dropdowns
      let hasError = false;
      if (!districtId) {
        setDistrictError('District is required');
        hasError = true;
      }
      if (!cityId) {
        setCityError('City is required');
        hasError = true;
      }
      if (hasError) return;

      try {
        setIsSubmitting(true);

        const customerData: CustomerInput = {
          name: data.name.trim(),
          mobileNumber: data.mobileNumber,
          address: data.address.trim(),
          stateId: stateId ?? undefined,
          districtId: districtId!,
          cityId: cityId!,
          notes: data.notes.trim() || undefined,
        };

        const response = await customerService.create(customerData);

        if (response.success) {
          // Reset form
          reset();
          setStateId(1);
          setDistrictId(null);
          setCityId(null);
          
          Alert.alert('Success', 'Customer created successfully', [
            { 
              text: 'OK', 
              onPress: () => {
                // Navigate to CustomersTab
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'CustomersTab',
                  })
                );
              } 
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
    [stateId, districtId, cityId, navigation, reset]
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
          rules={{ validate: validateMobileNumber }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Mobile Number *"
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
});
