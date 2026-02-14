/**
 * SearchBar Component
 * Search input with debounce and clear functionality
 * Enhanced with modern styling
 */
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { colors, borderRadius, shadows } from '../../styles/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  style?: ViewStyle;
  autoFocus?: boolean;
  onSubmit?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  debounceMs = 300,
  loading = false,
  style,
  autoFocus = false,
  onSubmit,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced callback
  useEffect(() => {
    if (debounceMs === 0) {
      onChangeText(localValue);
      return;
    }

    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChangeText, value]);

  const handleChangeText = useCallback((text: string) => {
    setLocalValue(text);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
  }, [onChangeText]);

  return (
    <PaperSearchbar
      placeholder={placeholder}
      onChangeText={handleChangeText}
      value={localValue}
      loading={loading}
      autoFocus={autoFocus}
      onSubmitEditing={onSubmit}
      onClearIconPress={handleClear}
      style={[styles.searchBar, style]}
      inputStyle={styles.input}
      iconColor={colors.textSecondary}
      placeholderTextColor={colors.textSecondary}
    />
  );
}

const styles = StyleSheet.create({
  searchBar: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    height: 52,
    ...shadows.sm,
  },
  input: {
    fontSize: 15,
  },
});
