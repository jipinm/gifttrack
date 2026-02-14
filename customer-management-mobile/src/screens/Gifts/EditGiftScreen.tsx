/**
 * Edit Gift Screen
 * Form for editing an existing gift
 * 
 * Relationship: Customer (1) → Event (many) → Gift (1 per event)
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { giftService } from '../../services/giftService';
import { GiftTypeDropdown } from '../../components/Dropdowns';
import { colors, spacing } from '../../styles/theme';
import type { Gift, GiftType } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerStackNavigator';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'EditGift'>;
type RoutePropType = RouteProp<CustomerStackParamList, 'EditGift'>;

interface FormData {
  value: string;
  description: string;
}

export default function EditGiftScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { giftId, customerId } = route.params;

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [giftTypeId, setGiftTypeId] = useState<number | null>(null);
  const [giftTypeError, setGiftTypeError] = useState<string | undefined>();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      value: '',
      description: '',
    },
  });

  // Load existing gift data
  useEffect(() => {
    const loadGift = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Get customer gifts and find the one we're editing
        const response = await giftService.getCustomerGifts(customerId);
        if (response.success && response.data) {
          const gift = response.data.gifts.find((g: Gift) => g.id === giftId);
          if (gift) {
            reset({
              value: gift.value.toString(),
              description: gift.description || '',
            });
            setGiftTypeId(gift.giftType.id);
          } else {
            setLoadError('Gift not found');
          }
        } else {
          setLoadError(response.message || 'Failed to load gift');
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadGift();
  }, [giftId, customerId, reset]);

  // Validation functions
  const validateValue = (value: string): string | true => {
    if (!value) return 'Gift value is required';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'Please enter a valid number';
    if (numValue <= 0) return 'Gift value must be greater than 0';
    return true;
  };

  // Dropdown handler
  const handleGiftTypeSelect = useCallback((giftType: GiftType | null) => {
    setGiftTypeId(giftType?.id ?? null);
    setGiftTypeError(undefined);
  }, []);

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormData) => {
      // Validate gift type
      if (!giftTypeId) {
        setGiftTypeError('Gift type is required');
        return;
      }

      try {
        setIsSubmitting(true);

        const giftData = {
          giftTypeId: giftTypeId!,
          value: parseFloat(data.value),
          description: data.description.trim() || undefined,
        };

        const response = await giftService.updateGift(giftId, giftData);

        if (response.success) {
          Alert.alert('Success', 'Gift updated successfully', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to update gift');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [giftId, giftTypeId, navigation]
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading gift...</Text>
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
        {/* Gift Type */}
        <GiftTypeDropdown
          value={giftTypeId}
          onSelect={handleGiftTypeSelect}
          label="Gift Type"
          required
          error={giftTypeError}
          disabled={isSubmitting}
        />

        {/* Gift Value */}
        <Controller
          control={control}
          name="value"
          rules={{ validate: validateValue }}
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Gift Value (₹) *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                keyboardType="numeric"
                error={!!errors.value}
                disabled={isSubmitting}
                left={<TextInput.Affix text="₹" />}
              />
              <HelperText type="error" visible={!!errors.value}>
                {errors.value?.message}
              </HelperText>
            </View>
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                label="Description (Optional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                mode="outlined"
                multiline
                numberOfLines={3}
                disabled={isSubmitting}
                placeholder="E.g., Gold chain, Set of utensils..."
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
            Update Gift
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
    paddingBottom: 100,
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
