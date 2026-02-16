/**
 * Dropdown Component
 * Generic dropdown/picker component
 */
import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ViewStyle, Modal, Pressable } from 'react-native';
import { Text, Searchbar, RadioButton } from 'react-native-paper';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface DropdownProps {
  label: string;
  value: string | number | null;
  options: DropdownOption[];
  onSelect: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  style?: ViewStyle;
}

export default function Dropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  error,
  disabled = false,
  searchable = false,
  style,
}: DropdownProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const handleSelect = useCallback(
    (optionValue: string | number) => {
      onSelect(optionValue);
      setVisible(false);
      setSearchQuery('');
    },
    [onSelect]
  );

  const openModal = () => {
    if (!disabled) {
      setVisible(true);
    }
  };

  const closeModal = () => {
    setVisible(false);
    setSearchQuery('');
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={openModal} disabled={disabled} activeOpacity={0.7}>
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
              !selectedOption && styles.placeholderText,
              disabled && styles.disabledText,
            ]}
            numberOfLines={1}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <Text style={styles.chevron}>▼</Text>
        </View>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} onRequestClose={closeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {searchable && (
            <Searchbar
              placeholder="Search..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
          )}

          <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.optionsListContent}>
            {filteredOptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No options found</Text>
              </View>
            ) : (
              filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionItem, option.value === value && styles.optionItemSelected]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text
                    style={[styles.optionText, option.value === value && styles.optionTextSelected]}
                  >
                    {option.label}
                  </Text>
                  <RadioButton
                    value={String(option.value)}
                    status={option.value === value ? 'checked' : 'unchecked'}
                    onPress={() => handleSelect(option.value)}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          </View>
        </View>
      </Modal>
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
  chevron: {
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  closeButton: {
    color: colors.textSecondary,
    fontSize: 18,
    padding: spacing.xs,
  },
  searchBar: {
    backgroundColor: colors.gray100,
    borderRadius: 0,
    elevation: 0,
    margin: spacing.base,
    marginBottom: 0,
  },
  searchInput: {
    fontSize: typography.fontSize.base,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionsListContent: {
    paddingBottom: 20,
  },
  optionItem: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  optionItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
});
