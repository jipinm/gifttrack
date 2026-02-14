/**
 * City Dropdown Component
 * Displays list of cities filtered by selected district
 * Uses Modal for better positioning and accessibility
 */
import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Modal, Portal, HelperText, ActivityIndicator, RadioButton, Searchbar } from 'react-native-paper';
import { useMasterData } from '../../context/MasterDataContext';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { City } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CityDropdownProps {
  value: number | null;
  districtId: number | null;
  onSelect: (city: City | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CityDropdown({
  value,
  districtId,
  onSelect,
  label = 'City',
  placeholder = 'Select City',
  error,
  disabled = false,
  required = false,
}: CityDropdownProps) {
  const { masterData, isLoading, getCitiesByDistrict } = useMasterData();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get filtered cities based on district
  const cities = useMemo(
    () => (districtId ? getCitiesByDistrict(districtId) : []),
    [districtId, getCitiesByDistrict]
  );

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === value) ?? null,
    [cities, value]
  );

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    return cities.filter((city) =>
      city.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cities, searchQuery]);

  // Clear selection when district changes and current city is not in new list
  useEffect(() => {
    if (value && districtId && !cities.find((c) => c.id === value)) {
      onSelect(null);
    }
  }, [districtId, cities, value, onSelect]);

  const openModal = () => {
    if (!disabled && !isLoading && districtId) {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleSelect = (city: City) => {
    onSelect(city);
    closeModal();
  };

  const handleClear = () => {
    onSelect(null);
    closeModal();
  };

  const isDisabled = disabled || !districtId;

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
          <Text style={styles.loadingText}>Loading cities...</Text>
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
            !selectedCity && styles.placeholderText,
            isDisabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedCity?.name ?? (districtId ? placeholder : 'Select district first')}
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

          {cities.length > 5 && (
            <Searchbar
              placeholder="Search cities..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
          )}

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator>
            {!required && selectedCity && (
              <TouchableOpacity style={styles.optionItem} onPress={handleClear}>
                <Text style={styles.clearText}>Clear selection</Text>
              </TouchableOpacity>
            )}
            {filteredCities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No cities found</Text>
              </View>
            ) : (
              filteredCities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={[
                    styles.optionItem,
                    selectedCity?.id === city.id && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(city)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCity?.id === city.id && styles.optionTextSelected,
                    ]}
                  >
                    {city.name}
                  </Text>
                  <RadioButton
                    value={String(city.id)}
                    status={selectedCity?.id === city.id ? 'checked' : 'unchecked'}
                    onPress={() => handleSelect(city)}
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
