/**
 * ConfirmDialog Component
 * Confirmation modal for destructive actions
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Portal, Text, Button as PaperButton } from 'react-native-paper';
import { colors, spacing, typography } from '../../styles/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const confirmColor = variant === 'danger' ? colors.error : colors.primary;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.message}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <PaperButton onPress={onCancel} textColor={colors.textSecondary} disabled={loading}>
            {cancelLabel}
          </PaperButton>
          <PaperButton
            onPress={onConfirm}
            textColor={confirmColor}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </PaperButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  actions: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
});
