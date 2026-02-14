/**
 * Section Component
 * Content section with optional title and description
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { colors, spacing, typography } from '../../styles/theme';

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  divider?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export default function Section({
  children,
  title,
  description,
  divider = false,
  style,
  contentStyle,
}: SectionProps) {
  return (
    <View style={[styles.section, style]}>
      {(title || description) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
      {divider && <Divider style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  content: {},
  divider: {
    marginTop: spacing.lg,
  },
});
