/**
 * Request Account Deletion Screen
 * - Admin: submits a deletion request reviewed by Super Admin
 * - Super Admin: immediately and permanently deletes their own account
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, Button, Divider, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

export default function RequestAccountDeletionScreen() {
  const navigation = useNavigation();
  const { isSuperAdmin, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Super Admin: immediate self-deletion (no review queue)
  const handleSuperAdminDelete = useCallback(() => {
    Alert.alert(
      'Permanently Delete Account',
      'This will immediately and permanently delete your Super Admin account. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const response = await adminService.selfDelete();
              if (response.success) {
                // Account is gone — log out the client
                await logout();
              } else {
                Alert.alert('Deletion Failed', response.message || 'Failed to delete account. Please try again.');
                setIsSubmitting(false);
              }
            } catch {
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }, [logout]);

  // Admin: submit request for Super Admin review
  const handleSubmitRequest = useCallback(() => {
    Alert.alert(
      'Confirm Deletion Request',
      'Your account deletion request will be reviewed by the Super Admin. You will not be able to access your account after the request is processed.\n\nDo you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const response = await adminService.requestDeletion();

              if (response.success) {
                Alert.alert(
                  'Request Submitted',
                  'Your account deletion request has been submitted successfully. The Super Admin will review it and take action.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                Alert.alert('Request Failed', response.message || 'Failed to submit the request. Please try again.');
              }
            } catch {
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Warning Banner */}
      <View style={[styles.warningBanner, isSuperAdmin() && styles.warningBannerDanger]}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={[styles.warningTitle, isSuperAdmin() && styles.warningTitleDanger]}>
          {isSuperAdmin() ? 'Delete Account' : 'Account Deletion Request'}
        </Text>
        <Text style={[styles.warningMessage, isSuperAdmin() && styles.warningMessageDanger]}>
          {isSuperAdmin()
            ? 'This will permanently and immediately delete your Super Admin account. This cannot be undone.'
            : 'Your account deletion request will be reviewed by the Super Admin. You will not be able to access your account after the request is processed.'}
        </Text>
      </View>

      {/* What happens next */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What happens next?</Text>
        <Divider style={styles.divider} />

        {isSuperAdmin() ? (
          <>
            <List.Item
              title="Confirmation Required"
              description="You will be asked to confirm before anything is deleted."
              left={() => <Text style={styles.stepNumber}>1</Text>}
              titleStyle={styles.stepTitle}
              descriptionStyle={styles.stepDescription}
            />
            <List.Item
              title="Account Permanently Deleted"
              description="Your account is removed from the system immediately."
              left={() => <Text style={styles.stepNumber}>2</Text>}
              titleStyle={styles.stepTitle}
              descriptionStyle={styles.stepDescription}
            />
            <List.Item
              title="Signed Out"
              description="You are logged out of the app automatically."
              left={() => <Text style={styles.stepNumber}>3</Text>}
              titleStyle={styles.stepTitle}
              descriptionStyle={styles.stepDescription}
            />
          </>
        ) : (
          <>
            <List.Item
              title="Request Submitted"
              description="Your request is recorded with a pending status."
              left={() => <Text style={styles.stepNumber}>1</Text>}
              titleStyle={styles.stepTitle}
              descriptionStyle={styles.stepDescription}
            />
            <List.Item
              title="Super Admin Reviews"
              description="The Super Admin will review your request."
              left={() => <Text style={styles.stepNumber}>2</Text>}
              titleStyle={styles.stepTitle}
              descriptionStyle={styles.stepDescription}
            />
            <List.Item
              title="Decision Made"
              description="Your account will be deleted on approval, or kept active on rejection."
              left={() => <Text style={styles.stepNumber}>3</Text>}
              titleStyle={styles.stepTitle}
              descriptionStyle={styles.stepDescription}
            />
          </>
        )}
      </View>

      {/* Important Notes */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Important Notes</Text>
        <Divider style={styles.divider} />
        <Text style={styles.noteText}>
          {isSuperAdmin()
            ? '• This action is immediate and cannot be undone.\n• All your account data will be permanently removed.\n• Make sure another Super Admin account exists before proceeding.'
            : '• You cannot delete your account directly.\n• Only the Super Admin can approve or reject this request.\n• You can only have one pending request at a time.\n• This action cannot be undone once approved.'}
        </Text>
      </View>

      {/* Action Button */}
      <Button
        mode="contained"
        onPress={isSuperAdmin() ? handleSuperAdminDelete : handleSubmitRequest}
        loading={isSubmitting}
        disabled={isSubmitting}
        icon="account-remove"
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
        buttonColor={colors.error}
      >
        {isSuperAdmin() ? 'Delete My Account' : 'Submit Deletion Request'}
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        disabled={isSubmitting}
        style={styles.cancelButton}
        contentStyle={styles.cancelButtonContent}
        textColor={colors.textSecondary}
      >
        Cancel
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    backgroundColor: colors.background,
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  warningBannerDanger: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  warningIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  warningTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as 'bold',
    color: '#856404',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  warningTitleDanger: {
    color: colors.error,
  },
  warningMessage: {
    fontSize: typography.fontSize.sm,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
  warningMessageDanger: {
    color: colors.error,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  divider: {
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: typography.fontWeight.bold as 'bold',
    fontSize: typography.fontSize.sm,
    alignSelf: 'center',
    marginRight: spacing.sm,
  },
  stepTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.text,
  },
  stepDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  cancelButton: {
    borderRadius: borderRadius.lg,
    borderColor: colors.border,
  },
  cancelButtonContent: {
    paddingVertical: spacing.sm,
  },
});
