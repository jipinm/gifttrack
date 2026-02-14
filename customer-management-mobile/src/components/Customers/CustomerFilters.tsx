/**
 * Customer Filters Component
 * Filter modal for customer list - location filters only
 * (Event/gift filters removed - events are now standalone)
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, Divider, IconButton } from 'react-native-paper';
import {
  StateDropdown,
  DistrictDropdown,
  CityDropdown,
} from '../Dropdowns';
import { colors, spacing, borderRadius } from '../../styles/theme';
import type {
  CustomerFilters as FilterType,
  State,
  District,
  City,
} from '../../types';

interface CustomerFiltersProps {
  visible: boolean;
  onDismiss: () => void;
  filters: FilterType;
  onApply: (filters: FilterType) => void;
  onClear: () => void;
}

export default function CustomerFilters({
  visible,
  onDismiss,
  filters,
  onApply,
  onClear,
}: CustomerFiltersProps) {
  // Local state for filter values
  const [stateId, setStateId] = useState<number | null>(filters.stateId ?? null);
  const [districtId, setDistrictId] = useState<number | null>(filters.districtId ?? null);
  const [cityId, setCityId] = useState<number | null>(filters.cityId ?? null);

  // Reset local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setStateId(filters.stateId ?? null);
      setDistrictId(filters.districtId ?? null);
      setCityId(filters.cityId ?? null);
    }
  }, [visible, filters]);

  const handleApply = useCallback(() => {
    const newFilters: FilterType = {
      ...filters,
      stateId: stateId ?? undefined,
      districtId: districtId ?? undefined,
      cityId: cityId ?? undefined,
      page: 1,
    };
    onApply(newFilters);
    onDismiss();
  }, [filters, stateId, districtId, cityId]);

  const handleClear = useCallback(() => {
    setStateId(null);
    setDistrictId(null);
    setCityId(null);
    onClear();
    onDismiss();
  }, [onClear, onDismiss]);

  const handleStateSelect = useCallback((state: State | null) => {
    setStateId(state?.id ?? null);
    setDistrictId(null);
    setCityId(null);
  }, []);

  const handleDistrictSelect = useCallback((district: District | null) => {
    setDistrictId(district?.id ?? null);
    setCityId(null);
  }, []);

  const handleCitySelect = useCallback((city: City | null) => {
    setCityId(city?.id ?? null);
  }, []);

  const hasActiveFilters = stateId || districtId || cityId;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Filters
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <Divider />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* State */}
          <StateDropdown
            value={stateId}
            onSelect={handleStateSelect}
            label="State"
            required={false}
          />

          {/* District */}
          <DistrictDropdown
            value={districtId}
            stateId={stateId}
            onSelect={handleDistrictSelect}
            label="District"
            required={false}
          />

          {/* City */}
          <CityDropdown
            value={cityId}
            districtId={districtId}
            onSelect={handleCitySelect}
            label="City"
            required={false}
          />
        </ScrollView>

        <Divider />

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleClear}
            style={styles.clearButton}
            disabled={!hasActiveFilters}
          >
            Clear All
          </Button>
          <Button mode="contained" onPress={handleApply} style={styles.applyButton}>
            Apply Filters
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    borderColor: colors.border,
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
