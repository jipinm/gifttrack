/**
 * Gift Type Dropdown Component
 * Displays list of gift types from master data
 * Uses Modal for better positioning and accessibility
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Modal, Portal, HelperText, ActivityIndicator, RadioButton, Searchbar } from 'react-native-paper';
import { useMasterData } from '../../context/MasterDataContext';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { GiftType } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GiftTypeDropdownProps {
  value: number | null;
  onSelect: (giftType: GiftType | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function GiftTypeDropdown({
  value,
  onSelect,
  label = 'Gift Type',
  placeholder = 'Select Gift Type',
  error,
  disabled = false,
  required = false,
}: GiftTypeDropdownProps) {
  const { masterData, isLoading } = useMasterData();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const giftTypes = useMemo(() => masterData?.giftTypes ?? [], [masterData]);

  const selectedGiftType = useMemo(
    () => giftTypes.find((gt) => gt.id === value) ?? null,
    [giftTypes, value]
  );

  const filteredGiftTypes = useMemo(() => {
    if (!searchQuery.trim()) return giftTypes;
    return giftTypes.filter((giftType) =>
      giftType.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [giftTypes, searchQuery]);

  const openModal = () => {
    if (!disabled && !isLoading) {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleSelect = (giftType: GiftType) => {
    onSelect(giftType);
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
          <Text style={styles.loadingText}>Loading gift types...</Text>
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
        onPress={openModal}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          disabled && styles.selectButtonDisabled,
        ]}
      >
        <Text
          style={[
            styles.selectText,
            !selectedGiftType && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedGiftType?.name ?? placeholder}
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
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {giftTypes.length > 5 && (
            <Searchbar
              placeholder="Search gift types..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
          )}

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator>
            {!required && selectedGiftType && (
              <TouchableOpacity style={styles.optionItem} onPress={handleClear}>
                <Text style={styles.clearText}>Clear selection</Text>
              </TouchableOpacity>
            )}
            {filteredGiftTypes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No gift types found</Text>
              </View>
            ) : (
              filteredGiftTypes.map((giftType) => (
                <TouchableOpacity
                  key={giftType.id}
                  style={[
                    styles.optionItem,
                    selectedGiftType?.id === giftType.id && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(giftType)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedGiftType?.id === giftType.id && styles.optionTextSelected,
                    ]}
                  >
                    {giftType.name}
                  </Text>
                  <RadioButton
                    value={String(giftType.id)}
                    status={selectedGiftType?.id === giftType.id ? 'checked' : 'unchecked'}
                    onPress={() => handleSelect(giftType)}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ))
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
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  required: {
    color: colors.error,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    minHeight: 56,
    paddingHorizontal: spacing.base,
    ...shadows.sm,
  },
  selectButtonError: {
    borderColor: colors.error,
  },
  selectButtonDisabled: {
    backgroundColor: colors.gray100,
    opacity: 0.7,
  },
  selectText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textDisabled,
  },
  chevron: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray50,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    margin: spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.7,
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  searchBar: {
    margin: spacing.base,
    marginBottom: 0,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    elevation: 0,
  },
  searchInput: {
    fontSize: typography.fontSize.base,
  },
  optionsList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  clearText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
});
