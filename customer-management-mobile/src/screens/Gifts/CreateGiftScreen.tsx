/**
 * Create Gift Screen
 * Form for adding a new gift to an event for a specific customer
 * 
 * Accessed from EventDetailsScreen - requires eventId and customerId
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { giftService } from '../../services/giftService';
import { GiftTypeDropdown } from '../../components/Dropdowns';
import { colors, spacing } from '../../styles/theme';
import type { GiftInput, GiftType } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList, 'CreateGift'>;
type RoutePropType = RouteProp<EventStackParamList, 'CreateGift'>;

interface FormData {
  value: string;
  description: string;
}

export default function CreateGiftScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { eventId, customerId } = route.params;

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [giftTypeId, setGiftTypeId] = useState<number | null>(null);
  const [giftTypeError, setGiftTypeError] = useState<string | undefined>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      value: '',
      description: '',
    },
  });

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

        const giftData: GiftInput = {
          eventId,
          customerId,
          giftTypeId: giftTypeId!,
          value: parseFloat(data.value),
          description: data.description.trim() || undefined,
        };

        const response = await giftService.createGift(giftData);

        if (response.success) {
          Alert.alert('Success', 'Gift added successfully', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to add gift');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [eventId, customerId, giftTypeId, navigation]
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
            Add Gift
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
