/**
 * Care Of Dropdown Component
 * Displays list of care-of options from master data
 * Used when attaching customers to self_event type events
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Modal, Portal, HelperText, ActivityIndicator, RadioButton, Searchbar } from 'react-native-paper';
import { useMasterData } from '../../context/MasterDataContext';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { CareOfOption } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CareOfDropdownProps {
  value: number | null;
  onSelect: (careOf: CareOfOption | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CareOfDropdown({
  value,
  onSelect,
  label = 'Care Of',
  placeholder = 'Select Care Of',
  error,
  disabled = false,
  required = false,
}: CareOfDropdownProps) {
  const { masterData, isLoading } = useMasterData();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const careOfOptions = useMemo(() => masterData?.careOfOptions ?? [], [masterData]);

  const selectedOption = useMemo(
    () => careOfOptions.find((opt) => opt.id === value) ?? null,
    [careOfOptions, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return careOfOptions;
    return careOfOptions.filter((opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [careOfOptions, searchQuery]);

  const openModal = () => {
    if (!disabled && !isLoading) {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleSelect = (option: CareOfOption) => {
    onSelect(option);
    closeModal();
  };

  const handleClear = () => {
    onSelect(null);
    closeModal();
  };

  if (isLoading && !masterData) {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.selector,
          error ? styles.selectorError : null,
          disabled ? styles.selectorDisabled : null,
        ]}
        onPress={openModal}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.selectorText, !selectedOption && styles.placeholderText]}
          numberOfLines={1}
        >
          {selectedOption?.name ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {careOfOptions.length > 5 && (
            <Searchbar
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
          )}

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {!required && (
              <TouchableOpacity style={styles.option} onPress={handleClear}>
                <RadioButton
                  value=""
                  status={value === null ? 'checked' : 'unchecked'}
                  onPress={handleClear}
                  color={colors.primary}
                />
                <Text style={styles.optionText}>None</Text>
              </TouchableOpacity>
            )}

            {filteredOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.option}
                onPress={() => handleSelect(option)}
              >
                <RadioButton
                  value={option.id.toString()}
                  status={value === option.id ? 'checked' : 'unchecked'}
                  onPress={() => handleSelect(option)}
                  color={colors.primary}
                />
                <Text style={styles.optionText}>{option.name}</Text>
              </TouchableOpacity>
            ))}

            {filteredOptions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No options found</Text>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium as '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
  },
  selectorError: {
    borderColor: colors.error,
  },
  selectorDisabled: {
    opacity: 0.5,
    backgroundColor: colors.gray100,
  },
  selectorText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: SCREEN_HEIGHT * 0.6,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: 18,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  searchBar: {
    margin: spacing.sm,
    elevation: 0,
    backgroundColor: colors.gray100,
  },
  searchInput: {
    fontSize: typography.fontSize.sm,
  },
  optionsList: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
});
