/**
 * Change Password Screen
 * Allows users to change their password
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { authService } from '../../services/authService';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // Validation functions
  const validateCurrentPassword = (value: string): string | true => {
    if (!value || value.trim() === '') {
      return 'Current password is required';
    }
    return true;
  };

  const validateNewPassword = (value: string): string | true => {
    if (!value || value.trim() === '') {
      return 'New password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return true;
  };

  const validateConfirmPassword = (value: string): string | true => {
    if (!value || value.trim() === '') {
      return 'Please confirm your new password';
    }
    if (value !== newPassword) {
      return 'Passwords do not match';
    }
    return true;
  };

  // Handle form submission
  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        setIsSubmitting(true);

        const response = await authService.changePassword(
          data.currentPassword,
          data.newPassword,
          data.confirmPassword
        );

        if (response.success) {
          Alert.alert('Success', 'Password changed successfully', [
            {
              text: 'OK',
              onPress: () => {
                reset();
                navigation.goBack();
              },
            },
          ]);
        } else {
          Alert.alert('Error', response.message || 'Failed to change password');
        }
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigation, reset]
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
      <Text style={styles.description}>
        Enter your current password and choose a new password. Your new password must be at least 6
        characters long.
      </Text>

      {/* Current Password */}
      <Controller
        control={control}
        name="currentPassword"
        rules={{ validate: validateCurrentPassword }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="Current Password *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              mode="outlined"
              secureTextEntry={!showCurrentPassword}
              error={!!errors.currentPassword}
              disabled={isSubmitting}
              right={
                <TextInput.Icon
                  icon={showCurrentPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.currentPassword}>
              {errors.currentPassword?.message}
            </HelperText>
          </View>
        )}
      />

      {/* New Password */}
      <Controller
        control={control}
        name="newPassword"
        rules={{ validate: validateNewPassword }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.inputContainer}>
            <TextInput
              label="New Password *"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              mode="outlined"
              secureTextEntry={!showNewPassword}
              error={!!errors.newPassword}
              disabled={isSubmitting}
              right={
                <TextInput.Icon
                  icon={showNewPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.newPassword}>
              {errors.newPassword?.message}
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
              label="Confirm New Password *"
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
          Change Password
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
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
});
