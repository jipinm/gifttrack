/**
 * Register Screen
 * Public admin self-registration form.
 * Account is created with status = 'pending' — Super Admin must approve before the user can log in.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { authService } from '../../services/authService';
import { masterDataService } from '../../services/masterDataService';
import { StateDropdown, DistrictDropdown, CityDropdown } from '../../components/Dropdowns';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { AdminRegistrationInput, State, District, City } from '../../types';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface FormData {
  name: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  address: string;
  branch: string;
}

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mobileNumberError, setMobileNumberError] = useState<string | null>(null);

  // Location dropdowns
  const [selectedState, setSelectedState] = useState<State | null>({ id: 1, name: 'Kerala', code: 'KL' });
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [locationErrors, setLocationErrors] = useState({ district: '', city: '' });

  // States/Districts/Cities are public data — fetch them directly since
  // MasterDataContext only loads when the user is authenticated.
  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);

  useEffect(() => {
    masterDataService.getStates().then((res) => {
      if (res.data) setAvailableStates(res.data);
    }).catch(() => {});
  }, []);

  // Fetch districts whenever selected state changes
  useEffect(() => {
    if (!selectedState) {
      setAvailableDistricts([]);
      return;
    }
    masterDataService.getDistricts(selectedState.id).then((res) => {
      if (res.data) setAvailableDistricts(res.data);
    }).catch(() => {});
  }, [selectedState]);

  // Fetch cities whenever selected district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setAvailableCities([]);
      return;
    }
    masterDataService.getCities(selectedDistrict.id).then((res) => {
      if (res.data) setAvailableCities(res.data);
    }).catch(() => {});
  }, [selectedDistrict]);

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

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateName = (v: string): string | true => {
    if (!v.trim()) return 'Name is required';
    if (v.trim().length < 2) return 'Name must be at least 2 characters';
    return true;
  };

  const validateMobile = (v: string): string | true => {
    if (!v) return 'Mobile number is required';
    if (!/^\d{10}$/.test(v)) return 'Mobile number must be exactly 10 digits';
    return true;
  };

  const validatePassword = (v: string): string | true => {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'Password must be at least 6 characters';
    return true;
  };

  const validateConfirmPassword = (v: string): string | true => {
    if (!v) return 'Please confirm your password';
    if (v !== password) return 'Passwords do not match';
    return true;
  };

  const validateAddress = (v: string): string | true => {
    if (!v.trim()) return 'Address is required';
    return true;
  };

  const validateLocationFields = (): boolean => {
    const errs = {
      district: !selectedDistrict ? 'District is required' : '',
      city: !selectedCity ? 'City is required' : '',
    };
    setLocationErrors(errs);
    return !errs.district && !errs.city;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!validateLocationFields()) return;

      try {
        setIsSubmitting(true);

        const payload: AdminRegistrationInput = {
          name: data.name.trim(),
          mobileNumber: data.mobileNumber,
          password: data.password,
          address: data.address.trim(),
          stateId: selectedState?.id ?? null,
          districtId: selectedDistrict?.id ?? null,
          cityId: selectedCity?.id ?? null,
          branch: data.branch?.trim() || '',
        };

        const response = await authService.register(payload);

        if (response.success) {
          reset();
          setSelectedState({ id: 1, name: 'Kerala', code: 'KL' });
          setSelectedDistrict(null);
          setSelectedCity(null);
          Alert.alert(
            'Registration Submitted',
            response.message ||
              'Your registration request has been submitted and is pending approval by the Super Admin. You will be able to log in once approved.',
            [{ text: 'Back to Login', onPress: () => navigation.navigate('Login') }]
          );
        } else {
          const fieldErrors = response.errors;
          if (fieldErrors?.mobileNumber) {
            // Show inline error under the mobile number field
            setMobileNumberError(fieldErrors.mobileNumber);
          } else if (fieldErrors && Object.keys(fieldErrors).length > 0) {
            const firstMsg = Object.values(fieldErrors)[0];
            Alert.alert('Registration Failed', firstMsg);
          } else {
            Alert.alert('Registration Failed', response.message || 'Please try again.');
          }
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigation, reset, selectedState, selectedDistrict, selectedCity]
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      enableAutomaticScroll
      extraScrollHeight={150}
      extraHeight={150}
      enableResetScrollToCoords={false}
    >
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Admin Account</Text>
        <Text style={styles.headerSubtitle}>
          Your request will be reviewed by the Super Admin before you can log in.
        </Text>
      </View>

      {/* Name */}
      <Controller
        control={control}
        name="name"
        rules={{ validate: validateName }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Full Name *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              mode="outlined"
              error={!!errors.name}
              disabled={isSubmitting}
              left={<TextInput.Icon icon="account" />}
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
        rules={{ validate: validateMobile }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Mobile Number *"
              value={value}
              onChangeText={(v) => {
                onChange(v);
                if (mobileNumberError) setMobileNumberError(null);
              }}
              onBlur={onBlur}
              mode="outlined"
              keyboardType="phone-pad"
              maxLength={10}
              error={!!errors.mobileNumber || !!mobileNumberError}
              disabled={isSubmitting}
              left={<TextInput.Icon icon="phone" />}
            />
            <HelperText type="error" visible={!!errors.mobileNumber || !!mobileNumberError}>
              {errors.mobileNumber?.message ?? mobileNumberError}
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
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword((p) => !p)}
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
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword((p) => !p)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword?.message}
            </HelperText>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Location</Text>

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
              left={<TextInput.Icon icon="map-marker" />}
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
          }}
          disabled={isSubmitting}
          states={availableStates}
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
          districts={availableDistricts}
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
          cities={availableCities}
        />
      </View>

      {/* Branch (optional) */}
      <Controller
        control={control}
        name="branch"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Branch (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              mode="outlined"
              disabled={isSubmitting}
              left={<TextInput.Icon icon="office-building" />}
            />
          </View>
        )}
      />

      {/* Submit */}
      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
        icon="account-plus"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Registration'}
      </Button>

      {/* Back to Login */}
      <Button
        mode="text"
        onPress={() => navigation.navigate('Login')}
        disabled={isSubmitting}
        style={styles.backButton}
        textColor={colors.textSecondary}
      >
        Already have an account? Sign In
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
    paddingBottom: 60,
  },
  header: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as '700',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  submitButtonContent: {
    paddingVertical: spacing.xs,
  },
  backButton: {
    marginTop: spacing.sm,
  },
});
