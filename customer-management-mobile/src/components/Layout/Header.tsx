/**
 * Header Component
 * Screen header with optional back button and actions
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../styles/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  leftAction,
  rightAction,
  style,
}: HeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Appbar.Header style={[styles.header, style]} elevated>
      {showBack && <Appbar.BackAction onPress={handleBack} color={colors.white} />}
      {leftAction && !showBack && <View style={styles.actionContainer}>{leftAction}</View>}
      <Appbar.Content
        title={title}
        titleStyle={styles.title}
        subtitle={subtitle}
        subtitleStyle={styles.subtitle}
      />
      {rightAction && <View style={styles.actionContainer}>{rightAction}</View>}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  subtitle: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    opacity: 0.8,
  },
  actionContainer: {
    paddingHorizontal: spacing.xs,
  },
});
