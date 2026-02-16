/**
 * Master Data Form Screen
 * Create or edit a master data item
 * Super Admin only
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { masterDataService } from '../../services/masterDataService';
import { useAuth } from '../../context/AuthContext';
import { useMasterData } from '../../context/MasterDataContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'MasterDataForm'>;
type RouteProps = RouteProp<ProfileStackParamList, 'MasterDataForm'>;

export default function MasterDataFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { category, title, itemId, itemName } = route.params;
  const { isSuperAdmin } = useAuth();
  const { refreshMasterData } = useMasterData();
  const hasSuperAdminAccess = isSuperAdmin();

  const isEditing = !!itemId;

  // State
  const [name, setName] = useState(itemName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`,
    });
  }, [navigation, title, isEditing]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 100) {
      setError('Name must not exceed 100 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let response;
      if (isEditing && itemId) {
        response = await masterDataService.updateByCategory(category, itemId, trimmedName);
      } else {
        response = await masterDataService.createByCategory(category, trimmedName);
      }

      if (response.success) {
        // Refresh master data context
        await refreshMasterData();
        
        Alert.alert(
          'Success',
          isEditing
            ? `${title.slice(0, -1)} updated successfully`
            : `${title.slice(0, -1)} created successfully`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(response.message || 'Failed to save');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, isEditing, itemId, category, title, navigation, refreshMasterData]);

  // Access check
  if (!hasSuperAdminAccess) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>Only Super Admins can manage master data.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isEditing ? 'Edit Item' : 'New Item'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isEditing
              ? `Update the name for this ${title.slice(0, -1).toLowerCase()}`
              : `Enter a name for the new ${title.slice(0, -1).toLowerCase()}`}
          </Text>

          {/* Name Input */}
          <TextInput
            label="Name *"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            mode="outlined"
            style={styles.input}
            placeholder={`Enter ${title.slice(0, -1).toLowerCase()} name`}
            maxLength={100}
            error={!!error}
            disabled={isSubmitting}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
          />

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}

          {/* Character Count */}
          <Text style={styles.charCount}>{name.length}/100 characters</Text>
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
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={isSubmitting || !name.trim()}
            loading={isSubmitting}
            icon={isEditing ? 'check' : 'plus'}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <Text style={styles.tipsText}>
            • Use clear, descriptive names{'\n'}
            • Avoid duplicate names{'\n'}
            • Names are case-sensitive
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    fontSize: typography.fontSize.base,
  },
  errorContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
  },
  errorMessage: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  charCount: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  tipsContainer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.lg,
  },
  tipsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.info,
    marginBottom: spacing.xs,
  },
  tipsText: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 22,
  },
});
