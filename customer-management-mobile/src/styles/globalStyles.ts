/**
 * Global Styles
 * Common styles used across the application
 * App: Gifts Track
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, glassmorphism } from './theme';

export const globalStyles = StyleSheet.create({
  // Container styles
  centerContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },

  // Flex utilities
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flexDirection: 'column',
  },

  // Spacing utilities
  padding: {
    padding: spacing.base,
  },
  paddingHorizontal: {
    paddingHorizontal: spacing.base,
  },
  paddingVertical: {
    paddingVertical: spacing.base,
  },
  margin: {
    margin: spacing.base,
  },
  marginHorizontal: {
    marginHorizontal: spacing.base,
  },
  marginVertical: {
    marginVertical: spacing.base,
  },

  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.base,
    ...shadows.sm,
  },

  // Glassmorphism card
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.md,
  },

  // Elevated card with glow
  elevatedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.lg,
  },

  // Gradient card container base
  gradientCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },

  // Text styles
  heading1: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  heading2: {
    color: colors.textPrimary,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  heading3: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  bodyText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  bodyTextSecondary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },

  // Input styles
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    height: 48,
    paddingHorizontal: spacing.base,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputMultiline: {
    height: 100,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },

  // Button styles
  button: {
    alignItems: 'center',
    borderRadius: borderRadius.base,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.gray300,
  },

  // Badge styles
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeSuccess: {
    backgroundColor: colors.successLight,
  },
  badgeError: {
    backgroundColor: colors.errorLight,
  },
  badgeWarning: {
    backgroundColor: colors.warningLight,
  },
  badgeInfo: {
    backgroundColor: colors.infoLight,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },

  // List styles
  listItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: spacing.base,
  },
  listItemLast: {
    borderBottomWidth: 0,
  },

  // Divider
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.md,
  },

  // Shadow
  shadow: shadows.sm,
  shadowMd: shadows.md,
  shadowLg: shadows.lg,
  
  // Glassmorphism styles
  glassLight: {
    backgroundColor: glassmorphism.light.backgroundColor,
    borderColor: glassmorphism.light.borderColor,
    borderWidth: glassmorphism.light.borderWidth,
  },
  glassMedium: {
    backgroundColor: glassmorphism.medium.backgroundColor,
    borderColor: glassmorphism.medium.borderColor,
    borderWidth: glassmorphism.medium.borderWidth,
  },
  glassDark: {
    backgroundColor: glassmorphism.dark.backgroundColor,
    borderColor: glassmorphism.dark.borderColor,
    borderWidth: glassmorphism.dark.borderWidth,
  },

  // Gradient overlay for cards
  gradientOverlay: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  // Floating action button style
  fab: {
    position: 'absolute' as const,
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.lg,
  },

  // Pill button style
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
});

export default globalStyles;
