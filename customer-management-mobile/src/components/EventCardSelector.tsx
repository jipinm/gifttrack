/**
 * EventCardSelector Component
 * Displays events as selectable cards for the Add Customer flow.
 * - Loads events from the API
 * - Supports search by event name
 * - Single-select with clear visual highlight
 * - Filters out customer_events that already have a customer attached
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { eventService } from '../services/eventService';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import type { Event } from '../types';

interface EventCardSelectorProps {
  selectedEvent: Event | null;
  onSelectEvent: (event: Event | null) => void;
  disabled?: boolean;
}

export default function EventCardSelector({
  selectedEvent,
  onSelectEvent,
  disabled = false,
}: EventCardSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  // Load events
  const loadEvents = useCallback(async (search?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await eventService.getAll({
        search: search || undefined,
        perPage: 50,
        page: 1,
      });

      if (response.success && response.data) {
        const raw = response.data as any;
        const list: Event[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.events)
            ? raw.events
            : Array.isArray(raw.data)
              ? raw.data
              : [];
        setEvents(list);
      } else {
        setEvents([]);
        setError(response.message || 'Failed to load events');
      }
    } catch (err) {
      setEvents([]);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadEvents();
    }
  }, [loadEvents]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadEvents(searchQuery);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, loadEvents]);

  // Filter out customer_events that already have a customer attached
  const availableEvents = useMemo(() => {
    return events.filter((event) => {
      if (event.eventCategory === 'customer_event' && (event.customerCount ?? 0) >= 1) {
        return false; // Already has a customer — can't attach more
      }
      return true;
    });
  }, [events]);

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle select
  const handleSelect = useCallback(
    (event: Event) => {
      if (disabled) return;
      if (selectedEvent?.id === event.id) {
        onSelectEvent(null); // Deselect
      } else {
        onSelectEvent(event);
      }
    },
    [selectedEvent, onSelectEvent, disabled]
  );

  // Render event card
  const renderEventCard = useCallback(
    ({ item }: { item: Event }) => {
      const isSelected = selectedEvent?.id === item.id;
      const isSelf = item.eventCategory === 'self_event';

      return (
        <TouchableOpacity
          style={[
            styles.eventCard,
            isSelected && styles.eventCardSelected,
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <View style={styles.eventCardContent}>
            <View style={styles.eventCardHeader}>
              <Text
                style={[styles.eventName, isSelected && styles.eventNameSelected]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {isSelected && (
                <IconButton
                  icon="check-circle"
                  size={22}
                  iconColor={colors.primary}
                  style={styles.checkIcon}
                />
              )}
            </View>
            <Text style={styles.eventDate}>{formatDate(item.eventDate)}</Text>
            <View style={styles.eventCardFooter}>
              <View
                style={[
                  styles.categoryChip,
                  isSelf ? styles.selfChip : styles.customerChip,
                ]}
              >
                <Text style={styles.categoryChipText}>
                  {isSelf ? 'Self Event' : 'Customer Event'}
                </Text>
              </View>
              {item.eventType?.name && (
                <Text style={styles.eventType}>{item.eventType.name}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedEvent, handleSelect, disabled]
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <Searchbar
        placeholder="Search events..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      {/* Loading / Error / Empty / List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.helperText}>Loading events...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : availableEvents.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.helperText}>
            {searchQuery ? 'No events match your search' : 'No events available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          horizontal={false}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    elevation: 1,
    marginBottom: spacing.sm,
  },
  searchInput: {
    fontSize: typography.fontSize.sm,
  },
  centerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  eventCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF', // Very light indigo
  },
  eventCardContent: {
    padding: spacing.md,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  eventNameSelected: {
    color: colors.primary,
  },
  checkIcon: {
    margin: 0,
    padding: 0,
  },
  eventDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  selfChip: {
    backgroundColor: '#E8F5E9',
  },
  customerChip: {
    backgroundColor: '#E3F2FD',
  },
  categoryChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventType: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
