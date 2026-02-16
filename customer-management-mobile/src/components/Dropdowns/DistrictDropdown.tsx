/**
 * District Dropdown Component
 * Displays list of districts filtered by selected state
 * Uses Modal for better positioning and accessibility
 */
import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, Pressable } from 'react-native';
import { Text, HelperText, ActivityIndicator, RadioButton, Searchbar } from 'react-native-paper';
import { useMasterData } from '../../context/MasterDataContext';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { District } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DistrictDropdownProps {
  value: number | null;
  stateId: number | null;
  onSelect: (district: District | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function DistrictDropdown({
  value,
  stateId,
  onSelect,
  label = 'District',
  placeholder = 'Select District',
  error,
  disabled = false,
  required = false,
}: DistrictDropdownProps) {
  const { masterData, isLoading, getDistrictsByState } = useMasterData();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get filtered districts based on state
  const districts = useMemo(
    () => (stateId ? getDistrictsByState(stateId) : []),
    [stateId, getDistrictsByState]
  );

  const selectedDistrict = useMemo(
    () => districts.find((district) => district.id === value) ?? null,
    [districts, value]
  );

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return districts;
    return districts.filter((district) =>
      district.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [districts, searchQuery]);

  // Clear selection when state changes and current district is not in new list
  useEffect(() => {
    if (value && stateId && !districts.find((d) => d.id === value)) {
      onSelect(null);
    }
  }, [stateId, districts, value, onSelect]);

  const openModal = () => {
    if (!disabled && !isLoading && stateId) {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleSelect = (district: District) => {
    onSelect(district);
    closeModal();
  };

  const handleClear = () => {
    onSelect(null);
    closeModal();
  };

  const isDisabled = disabled || !stateId;

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
          <Text style={styles.loadingText}>Loading districts...</Text>
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
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.selectButton,
          error && styles.selectButtonError,
          isDisabled && styles.selectButtonDisabled,
        ]}
      >
        <Text
          style={[
            styles.selectText,
            !selectedDistrict && styles.placeholderText,
            isDisabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedDistrict?.name ?? (stateId ? placeholder : 'Select state first')}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}

      <Modal visible={modalVisible} onRequestClose={closeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {districts.length > 5 && (
            <Searchbar
              placeholder="Search districts..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
          )}

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.optionsListContent}>
            {!required && selectedDistrict && (
              <TouchableOpacity style={styles.optionItem} onPress={handleClear}>
                <Text style={styles.clearText}>Clear selection</Text>
              </TouchableOpacity>
            )}
            {filteredDistricts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No districts found</Text>
              </View>
            ) : (
              filteredDistricts.map((district) => (
                <TouchableOpacity
                  key={district.id}
                  style={[
                    styles.optionItem,
                    selectedDistrict?.id === district.id && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(district)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedDistrict?.id === district.id && styles.optionTextSelected,
                    ]}
                  >
                    {district.name}
                  </Text>
                  <RadioButton
                    value={String(district.id)}
                    status={selectedDistrict?.id === district.id ? 'checked' : 'unchecked'}
                    onPress={() => handleSelect(district)}
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '90%',
    maxHeight: SCREEN_HEIGHT * 0.7,
    overflow: 'hidden',
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
  optionsListContent: {
    paddingBottom: 20,
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
