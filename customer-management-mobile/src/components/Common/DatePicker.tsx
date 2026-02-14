/**
 * DatePicker Component
 * Date picker wrapper with label and validation
 */
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: ViewStyle;
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  error,
  disabled = false,
  minimumDate,
  maximumDate,
  style,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date | null): string => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === 'ios') {
        // Keep picker open on iOS until dismissed
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };

  const openPicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={openPicker} disabled={disabled} activeOpacity={0.7}>
        <View
          style={[
            styles.selectButton,
            error && styles.selectButtonError,
            disabled && styles.selectButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.selectText,
              !value && styles.placeholderText,
              disabled && styles.disabledText,
            ]}
          >
            {formatDate(value)}
          </Text>
          <Text style={styles.icon}>📅</Text>
        </View>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={styles.iosButton}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={[styles.iosButton, styles.iosDoneButton]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={styles.iosPicker}
              />
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={value || new Date()}
              mode="date"
              display="default"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  selectButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.base,
  },
  selectButtonError: {
    borderColor: colors.error,
  },
  selectButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  selectText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textDisabled,
  },
  icon: {
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  iosPickerContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  iosPickerHeader: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  iosButton: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
  },
  iosDoneButton: {
    fontWeight: typography.fontWeight.semibold,
  },
  iosPicker: {
    height: 200,
  },
});
