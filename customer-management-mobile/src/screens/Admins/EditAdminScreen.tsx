/**
 * Edit Admin Screen
 * Form for editing an existing admin user (Superadmin only)
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { StateDropdown, DistrictDropdown, CityDropdown } from '../../components/Dropdowns';
import { colors, spacing } from '../../styles/theme';
import type { AdminUpdateInput, Admin, State, District, City } from '../../types';
import type { AdminStackParamList } from '../../navigation/AdminStackNavigator';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'EditAdmin'>;
type RoutePropType = RouteProp<AdminStackParamList, 'EditAdmin'>;

interface FormData {
  name: string;
  address: string;
  branch: string;
}

export default function EditAdminScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { adminId } = route.params;
  const { isSuperAdmin } = useAuth();
  const hasSuperAdminAccess = isSuperAdmin();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  
  // Location state for dropdowns
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      address: '',
      branch: '',
    },
  });

  // Load existing admin data
  useEffect(() => {
    const loadAdmin = async () => {
      if (!hasSuperAdminAccess) return;
      
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await adminService.getById(adminId);
        if (response.success && response.data) {
          const adminData = response.data;
          setAdmin(adminData);
          reset({
            name: adminData.name,
            address: adminData.address || '',
            branch: adminData.branch || '',
          });
          // Set location state from loaded admin data
          if (adminData.stateId) {
            setSelectedState({ id: adminData.stateId, name: adminData.stateName || '', code: '' });
          }
          if (adminData.districtId) {
            setSelectedDistrict({ id: adminData.districtId, name: adminData.districtName || '', state_id: adminData.stateId || 0 });
          }
          if (adminData.cityId) {
            setSelectedCity({ id: adminData.cityId, name: adminData.cityName || '', district_id: adminData.districtId || 0 });
          }
        } else {
          setLoadError(response.message || 'Failed to load admin');
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdmin();
  }, [adminId, reset, hasSuperAdminAccess]);

  // Validation functions
  const validateName = (value: string): string | true => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return true;
  };

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        setIsSubmitting(true);

        const updateData: AdminUpdateInput = {
          name: data.name.trim(),
          address: data.address.trim() || undefined,
          stateId: selectedState?.id,
          districtId: selectedDistrict?.id,
          cityId: selectedCity?.id,
          branch: data.branch.trim() || undefined,
        };

        const response = await adminService.update(adminId, updateData);

        if (response.success) {
          Alert.alert('Success', 'Admin updated successfully', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to update admin');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [adminId, navigation, selectedState, selectedDistrict, selectedCity]
  );

  // Check access - must be after all hooks
  if (!hasSuperAdminAccess) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>Only superadmins can edit admin users.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading admin...</Text>
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
        {/* Read-only Mobile Number */}
        {admin && (
          <View style={styles.inputContainer}>
            <TextInput
              label="Mobile Number"
              value={admin.mobileNumber}
              mode="outlined"
              disabled
              style={styles.readOnlyInput}
            />
            <HelperText type="info" visible>
              Mobile number cannot be changed
            </HelperText>
          </View>
        )}

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

        {/* Optional Fields Section */}
        <Text style={styles.sectionTitle}>Additional Information (Optional)</Text>

        {/* Address */}
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                multiline
                numberOfLines={2}
                disabled={isSubmitting}
              />
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
            }}
            disabled={isSubmitting || !selectedState}
          />
        </View>

        {/* City Dropdown */}
        <View style={styles.inputContainer}>
          <CityDropdown
            value={selectedCity?.id ?? null}
            districtId={selectedDistrict?.id ?? null}
            onSelect={(city) => {
              setSelectedCity(city);
            }}
            disabled={isSubmitting || !selectedDistrict}
          />
        </View>

        {/* Branch */}
        <Controller
          control={control}
          name="branch"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Branch"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                disabled={isSubmitting}
              />
            </View>
          )}
        />

        {/* Note about password */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            💡 To change the password, please contact the system administrator or use the password
            reset feature.
          </Text>
        </View>

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
            Update Admin
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
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
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
  readOnlyInput: {
    backgroundColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noteContainer: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  noteText: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 20,
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
