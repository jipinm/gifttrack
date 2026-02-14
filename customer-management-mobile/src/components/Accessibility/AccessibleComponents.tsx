/**
 * Accessible Components
 * Enhanced React Native components with built-in accessibility features
 */

import React, { forwardRef, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import {
  buttonA11yProps,
  inputA11yProps,
  headerA11yProps,
  imageA11yProps,
  checkboxA11yProps,
  announceForAccessibility,
} from '../../utils/accessibility';

// ============================================================================
// Accessible Button
// ============================================================================

interface AccessibleButtonProps {
  onPress: () => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function AccessibleButton({
  onPress,
  label,
  hint,
  disabled,
  children,
  style,
  testID,
}: AccessibleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      testID={testID}
      {...buttonA11yProps(label, hint, disabled)}
    >
      {children}
    </TouchableOpacity>
  );
}

// ============================================================================
// Accessible Text
// ============================================================================

interface AccessibleTextProps {
  children: ReactNode;
  style?: TextStyle;
  isHeader?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  accessibilityLabel?: string;
}

export function AccessibleText({
  children,
  style,
  isHeader,
  level,
  accessibilityLabel,
}: AccessibleTextProps) {
  const headerLabel = typeof children === 'string' ? children : accessibilityLabel;

  const headerStyles: Record<number, TextStyle> = {
    1: { fontSize: 32, fontWeight: 'bold' },
    2: { fontSize: 28, fontWeight: 'bold' },
    3: { fontSize: 24, fontWeight: '600' },
    4: { fontSize: 20, fontWeight: '600' },
    5: { fontSize: 18, fontWeight: '500' },
    6: { fontSize: 16, fontWeight: '500' },
  };

  return (
    <Text
      style={[level ? headerStyles[level] : undefined, style]}
      accessibilityRole={isHeader || level ? 'header' : 'text'}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
    >
      {children}
    </Text>
  );
}

// ============================================================================
// Accessible Input
// ============================================================================

interface AccessibleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  hint?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  editable?: boolean;
  multiline?: boolean;
  style?: TextStyle;
  error?: string;
  testID?: string;
}

export const AccessibleInput = forwardRef<TextInput, AccessibleInputProps>(
  (
    {
      value,
      onChangeText,
      label,
      hint,
      placeholder,
      secureTextEntry,
      keyboardType,
      editable = true,
      multiline,
      style,
      error,
      testID,
    },
    ref
  ) => {
    const accessibilityHint = error
      ? `${hint ? hint + '. ' : ''}Error: ${error}`
      : hint;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel} {...headerA11yProps(label)}>
          {label}
        </Text>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          style={[
            styles.input,
            !editable && styles.inputDisabled,
            error && styles.inputError,
            style,
          ]}
          testID={testID}
          {...inputA11yProps(label, accessibilityHint, value)}
          accessibilityState={{ disabled: !editable }}
        />
        {error && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

// ============================================================================
// Accessible Image
// ============================================================================

interface AccessibleImageProps {
  source: { uri: string } | number;
  label: string;
  style?: ImageStyle;
  decorative?: boolean;
}

export function AccessibleImage({
  source,
  label,
  style,
  decorative = false,
}: AccessibleImageProps) {
  return (
    <Image
      source={source}
      style={style}
      accessible={!decorative}
      {...(decorative ? {} : imageA11yProps(label))}
    />
  );
}

// ============================================================================
// Accessible Checkbox
// ============================================================================

interface AccessibleCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AccessibleCheckbox({
  checked,
  onToggle,
  label,
  disabled,
  style,
}: AccessibleCheckboxProps) {
  const handlePress = () => {
    if (!disabled) {
      onToggle();
      announceForAccessibility(checked ? `${label} unchecked` : `${label} checked`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.checkbox, style]}
      {...checkboxA11yProps(label, checked, disabled)}
    >
      <View
        style={[
          styles.checkboxBox,
          checked && styles.checkboxChecked,
          disabled && styles.checkboxDisabled,
        ]}
      >
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[styles.checkboxLabel, disabled && styles.textDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Accessible Section
// ============================================================================

interface AccessibleSectionProps {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function AccessibleSection({ title, children, style }: AccessibleSectionProps) {
  return (
    <View style={[styles.section, style]} accessibilityRole="summary">
      <AccessibleText level={3} style={styles.sectionTitle}>
        {title}
      </AccessibleText>
      {children}
    </View>
  );
}

// ============================================================================
// Accessible Link
// ============================================================================

interface AccessibleLinkProps {
  onPress: () => void;
  label: string;
  hint?: string;
  children: ReactNode;
  style?: TextStyle;
}

export function AccessibleLink({
  onPress,
  label,
  hint,
  children,
  style,
}: AccessibleLinkProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={hint || 'Opens a link'}
    >
      <Text style={[styles.link, style]}>{children}</Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Screen Reader Only (Hidden visually, available to screen readers)
// ============================================================================

interface ScreenReaderOnlyProps {
  children: ReactNode;
}

export function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return (
    <View
      style={styles.srOnly}
      accessible={true}
      importantForAccessibility="yes"
    >
      {children}
    </View>
  );
}

// ============================================================================
// Skip Link (for keyboard navigation)
// ============================================================================

interface SkipLinkProps {
  targetLabel: string;
  onPress: () => void;
}

export function SkipLink({ targetLabel, onPress }: SkipLinkProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.skipLink}
      accessibilityRole="link"
      accessibilityLabel={`Skip to ${targetLabel}`}
      accessibilityHint={`Jumps to ${targetLabel} content`}
    >
      <Text style={styles.skipLinkText}>Skip to {targetLabel}</Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// Loading Announcement
// ============================================================================

interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading',
  completedMessage = 'Loading complete',
}: LoadingAnnouncerProps) {
  React.useEffect(() => {
    if (isLoading) {
      announceForAccessibility(loadingMessage);
    } else {
      announceForAccessibility(completedMessage);
    }
  }, [isLoading, loadingMessage, completedMessage]);

  return null;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  inputContainer: {
    marginVertical: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
  },
  checkboxDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  textDisabled: {
    color: '#999',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#333',
  },
  link: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
  },
  skipLink: {
    position: 'absolute',
    top: -100,
    left: 0,
    backgroundColor: '#2196F3',
    padding: 12,
    zIndex: 100,
  },
  skipLinkText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default {
  AccessibleButton,
  AccessibleText,
  AccessibleInput,
  AccessibleImage,
  AccessibleCheckbox,
  AccessibleSection,
  AccessibleLink,
  ScreenReaderOnly,
  SkipLink,
  LoadingAnnouncer,
};
