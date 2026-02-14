/**
 * Edit Customer Screen
 * Form for editing an existing customer
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { customerService } from '../../services/customerService';
import {
  StateDropdown,
  DistrictDropdown,
  CityDropdown,
} from '../../components/Dropdowns';
import { colors, spacing } from '../../styles/theme';
import type {
  CustomerInput,
  Customer,
  State,
  District,
  City,
} from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerStackNavigator';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'EditCustomer'>;
type RoutePropType = RouteProp<CustomerStackParamList, 'EditCustomer'>;

interface FormData {
  name: string;
  mobileNumber: string;
  address: string;
  notes: string;
}

export default function EditCustomerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { customerId } = route.params;

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state for dropdowns
  const [stateId, setStateId] = useState<number | null>(null);
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

  // Load existing customer data
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await customerService.getById(customerId);
        if (response.success && response.data) {
          const customer: Customer = response.data;

          // Set form values
          reset({
            name: customer.name,
            mobileNumber: customer.mobileNumber,
            address: customer.address,
            notes: customer.notes || '',
          });

          // Set dropdown values
          setStateId(customer.state.id);
          setDistrictId(customer.district.id);
          setCityId(customer.city.id);
        } else {
          setLoadError(response.message || 'Failed to load customer');
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomer();
  }, [customerId, reset]);

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

        const customerData: Partial<CustomerInput> = {
          name: data.name.trim(),
          mobileNumber: data.mobileNumber,
          address: data.address.trim(),
          stateId: stateId ?? undefined,
          districtId: districtId!,
          cityId: cityId!,
          notes: data.notes.trim() || undefined,
        };

        const response = await customerService.update(customerId, customerData);

        if (response.success) {
          Alert.alert('Success', 'Customer updated successfully', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to update customer');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      stateId,
      districtId,
      cityId,
      customerId,
      navigation,
    ]
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading customer...</Text>
      </View>
    );
  }

  // Error state
  if (loadError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{loadError}</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

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
            Update Customer
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
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
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
