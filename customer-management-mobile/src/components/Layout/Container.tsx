/**
 * Container Component
 * Safe area container with consistent styling
 */
import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../styles/theme';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  padded?: boolean;
  keyboardAvoiding?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function Container({
  children,
  style,
  scroll = false,
  padded = true,
  keyboardAvoiding = false,
  edges = ['bottom'],
}: ContainerProps) {
  const contentStyle = [styles.content, padded && styles.padded, style];

  let content = scroll ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, padded && styles.padded, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  if (keyboardAvoiding) {
    content = (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    padding: spacing.base,
  },
  keyboardAvoiding: {
    flex: 1,
  },
});
