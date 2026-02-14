/**
 * Input Component
 * Reusable text input with validation support and modern styling
 */
import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  disabled?: boolean;
  editable?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
  onBlur?: () => void;
  onFocus?: () => void;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  disabled = false,
  editable = true,
  left,
  right,
  style,
  onBlur,
  onFocus,
}: InputProps) {
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);

  const handleFocus = () => {
    onFocus?.();
  };

  const handleBlur = () => {
    onBlur?.();
    onBlur?.();
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry && !isSecureVisible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        disabled={disabled}
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        mode="outlined"
        outlineColor={error ? colors.error : colors.border}
        activeOutlineColor={error ? colors.error : colors.primary}
        outlineStyle={styles.outline}
        style={[styles.input, multiline && styles.multiline, disabled && styles.disabled]}
        left={left}
        right={
          secureTextEntry ? (
            <TextInput.Icon
              icon={isSecureVisible ? 'eye-off' : 'eye'}
              onPress={() => setIsSecureVisible(!isSecureVisible)}
            />
          ) : (
            right
          )
        }
        error={!!error}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.helperText}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  input: {
    backgroundColor: colors.white,
    fontSize: 15,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  disabled: {
    backgroundColor: colors.gray100,
    opacity: 0.7,
  },
  outline: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  helperText: {
    marginTop: -spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
