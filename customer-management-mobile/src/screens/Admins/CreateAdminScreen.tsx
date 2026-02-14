/**
 * Create Admin Screen
 * Form for creating a new admin user (Superadmin only)
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { StateDropdown, DistrictDropdown, CityDropdown } from '../../components/Dropdowns';
import { colors, spacing } from '../../styles/theme';
import type { AdminInput, State, District, City } from '../../types';

interface FormData {
  name: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  address: string;
  branch: string;
}

export default function CreateAdminScreen() {
  const navigation = useNavigation();
  const { isSuperAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Location state for dropdowns
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [locationErrors, setLocationErrors] = useState({
    state: '',
    district: '',
    city: '',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      address: '',
      branch: '',
    },
  });

  const password = watch('password');

  // Check access
  if (!isSuperAdmin()) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>Only superadmins can create admin users.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

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

  const validatePassword = (value: string): string | true => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return true;
  };

  const validateConfirmPassword = (value: string): string | true => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return true;
  };

  const validateAddress = (value: string): string | true => {
    if (!value.trim()) return 'Address is required';
    return true;
  };

  const validateBranch = (value: string): string | true => {
    if (!value.trim()) return 'Branch is required';
    return true;
  };

  // Validate location fields
  const validateLocationFields = (): boolean => {
    const errors = {
      state: !selectedState ? 'State is required' : '',
      district: !selectedDistrict ? 'District is required' : '',
      city: !selectedCity ? 'City is required' : '',
    };
    setLocationErrors(errors);
    return !errors.state && !errors.district && !errors.city;
  };

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormData) => {
      // Validate location fields first
      if (!validateLocationFields()) {
        return;
      }

      try {
        setIsSubmitting(true);

        const adminData: AdminInput = {
          name: data.name.trim(),
          mobileNumber: data.mobileNumber,
          password: data.password,
          address: data.address.trim(),
          stateId: selectedState!.id,
          districtId: selectedDistrict!.id,
          cityId: selectedCity!.id,
          branch: data.branch.trim(),
        };

        const response = await adminService.create(adminData);

        if (response.success) {
          // Reset form
          reset();
          setSelectedState(null);
          setSelectedDistrict(null);
          setSelectedCity(null);
          
          Alert.alert('Success', 'Admin created successfully', [
            { 
              text: 'OK', 
              onPress: () => {
                // Navigate to AdminsTab
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'AdminsTab',
                  })
                );
              } 
            },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to create admin');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigation, reset, selectedState, selectedDistrict, selectedCity]
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

        {/* Password */}
        <Controller
          control={control}
          name="password"
          rules={{ validate: validatePassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Password *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                secureTextEntry={!showPassword}
                error={!!errors.password}
                disabled={isSubmitting}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Confirm Password */}
        <Controller
          control={control}
          name="confirmPassword"
          rules={{ validate: validateConfirmPassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Confirm Password *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                error={!!errors.confirmPassword}
                disabled={isSubmitting}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Additional Fields */}
        <Text style={styles.sectionTitle}>Additional Information</Text>

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
                numberOfLines={2}
                error={!!errors.address}
                disabled={isSubmitting}
              />
              <HelperText type="error" visible={!!errors.address}>
                {errors.address?.message}
              </HelperText>
            </View>
          )}
        />

        {/* State Dropdown */}
        <View style={styles.inputContainer}>
          <StateDropdown
            value={selectedState?.id ?? null}
            onSelect={(state) => {
              setSelectedState(state);
              setSelectedDistrict(null);
              setSelectedCity(null);
              setLocationErrors((prev) => ({ ...prev, state: '' }));
            }}
            error={locationErrors.state}
            disabled={isSubmitting}
            required
          />
        </View>

        {/* District Dropdown */}
        <View style={styles.inputContainer}>
          <DistrictDropdown
            value={selectedDistrict?.id ?? null}
            stateId={selectedState?.id ?? null}
            onSelect={(district) => {
              setSelectedDistrict(district);
              setSelectedCity(null);
              setLocationErrors((prev) => ({ ...prev, district: '' }));
            }}
            error={locationErrors.district}
            disabled={isSubmitting || !selectedState}
            required
          />
        </View>

        {/* City Dropdown */}
        <View style={styles.inputContainer}>
          <CityDropdown
            value={selectedCity?.id ?? null}
            districtId={selectedDistrict?.id ?? null}
            onSelect={(city) => {
              setSelectedCity(city);
              setLocationErrors((prev) => ({ ...prev, city: '' }));
            }}
            error={locationErrors.city}
            disabled={isSubmitting || !selectedDistrict}
            required
          />
        </View>

        {/* Branch */}
        <Controller
          control={control}
          name="branch"
          rules={{ validate: validateBranch }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Branch *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                error={!!errors.branch}
                disabled={isSubmitting}
              />
              <HelperText type="error" visible={!!errors.branch}>
                {errors.branch?.message}
              </HelperText>
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
            Create Admin
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
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
