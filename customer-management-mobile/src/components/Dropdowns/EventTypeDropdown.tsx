/**
 * Event Type Dropdown Component
 * Displays list of event types from master data
 * Uses Modal for better positioning and accessibility
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, Pressable } from 'react-native';
import { Text, HelperText, ActivityIndicator, RadioButton, Searchbar } from 'react-native-paper';
import { useMasterData } from '../../context/MasterDataContext';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { EventType } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventTypeDropdownProps {
  value: number | null;
  onSelect: (eventType: EventType | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function EventTypeDropdown({
  value,
  onSelect,
  label = 'Event Type',
  placeholder = 'Select Event Type',
  error,
  disabled = false,
  required = false,
}: EventTypeDropdownProps) {
  const { masterData, isLoading } = useMasterData();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const eventTypes = useMemo(() => masterData?.eventTypes ?? [], [masterData]);

  // Auto-select default when value is null and items are loaded
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (value === null && !hasAutoSelected.current && eventTypes.length > 0) {
      const defaultItem = eventTypes.find((item) => item.isDefault);
      if (defaultItem) {
        hasAutoSelected.current = true;
        onSelect(defaultItem);
      }
    }
  }, [value, eventTypes, onSelect]);

  const selectedEventType = useMemo(
    () => eventTypes.find((et) => et.id === value) ?? null,
    [eventTypes, value]
  );

  const filteredEventTypes = useMemo(() => {
    if (!searchQuery.trim()) return eventTypes;
    return eventTypes.filter((eventType) =>
      eventType.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [eventTypes, searchQuery]);

  const openModal = () => {
    if (!disabled && !isLoading) {
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleSelect = (eventType: EventType) => {
    onSelect(eventType);
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
          <Text style={styles.loadingText}>Loading event types...</Text>
        </View>
      </View>
    );
  }

  // Show error state if master data failed to load
  if (!masterData && !isLoading) {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => {}}
          activeOpacity={0.7}
          style={[styles.selectButton, styles.selectButtonDisabled]}
        >
          <Text style={styles.placeholderText}>Event types unavailable</Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>
        {error && (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        )}
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
            !selectedEventType && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}
        >
          {selectedEventType?.name ?? placeholder}
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

          {eventTypes.length > 5 && (
            <Searchbar
              placeholder="Search event types..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
            />
          )}

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.optionsListContent}>
            {!required && selectedEventType && (
              <TouchableOpacity style={styles.optionItem} onPress={handleClear}>
                <Text style={styles.clearText}>Clear selection</Text>
              </TouchableOpacity>
            )}
            {filteredEventTypes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No event types found</Text>
              </View>
            ) : (
              filteredEventTypes.map((eventType) => (
                <TouchableOpacity
                  key={eventType.id}
                  style={[
                    styles.optionItem,
                    selectedEventType?.id === eventType.id && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(eventType)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedEventType?.id === eventType.id && styles.optionTextSelected,
                    ]}
                  >
                    {eventType.name}
                  </Text>
                  <RadioButton
                    value={String(eventType.id)}
                    status={selectedEventType?.id === eventType.id ? 'checked' : 'unchecked'}
                    onPress={() => handleSelect(eventType)}
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
