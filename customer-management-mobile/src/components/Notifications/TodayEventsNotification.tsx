/**
 * Today Events Notification Component
 * Displays a notification after login if there are events scheduled for today
 * Features: sound notification, remind later, do not display again, close
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Vibration, Pressable } from 'react-native';
import { Modal, Portal, Text, Button, IconButton, Card, Divider } from 'react-native-paper';
import { eventService } from '../../services/eventService';
import { storage } from '../../utils/storage';
import { playAlertSound, unloadAlertSound } from '../../utils/alertSound';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { Event } from '../../types';

const STORAGE_KEY_HIDE_TODAY_EVENTS = '@hideToday EventsNotification';
const STORAGE_KEY_REMIND_LATER = '@remindLaterTimestamp';
const REMIND_LATER_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface TodayEventsNotificationProps {
  onNavigateToEvent?: (eventId: string) => void;
}

export default function TodayEventsNotification({
  onNavigateToEvent,
}: TodayEventsNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const hasChecked = useRef(false);

  // Format today's date as YYYY-MM-DD
  const getTodayDateString = useCallback(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // Check if notifications should be shown
  const shouldShowNotification = useCallback(async (): Promise<boolean> => {
    try {
      // Check if user selected "do not display again"
      const hideNotification = await storage.get<boolean>(STORAGE_KEY_HIDE_TODAY_EVENTS);
      if (hideNotification) {
        return false;
      }

      // Check if "remind later" was clicked recently
      const remindLaterTimestamp = await storage.get<number>(STORAGE_KEY_REMIND_LATER);
      if (remindLaterTimestamp) {
        const now = Date.now();
        if (now - remindLaterTimestamp < REMIND_LATER_DURATION) {
          return false;
        }
        // Clear expired remind later timestamp
        await storage.remove(STORAGE_KEY_REMIND_LATER);
      }

      return true;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true;
    }
  }, []);

  // Fetch events scheduled for today
  const fetchTodayEvents = useCallback(async () => {
    try {
      const shouldShow = await shouldShowNotification();
      if (!shouldShow) {
        return;
      }

      const todayDate = getTodayDateString();
      const response = await eventService.getAll({
        dateFrom: todayDate,
        dateTo: todayDate,
        page: 1,
        perPage: 100,
      });

      if (response.success && response.data) {
        let events: Event[] = [];
        const raw = response.data as any;
        
        // Handle API shape: { events: [...], pagination: {...} } or { data: [...] }
        if (Array.isArray(raw.events)) {
          events = raw.events;
        } else if (Array.isArray(raw.data)) {
          events = raw.data;
        } else if (Array.isArray(raw)) {
          events = raw;
        }

        if (events.length > 0) {
          setTodayEvents(events);
          setVisible(true);
          
          // Play alert sound + vibration
          playAlertSound().catch(() => {});
          Vibration.vibrate([0, 250, 100, 250]);
        }
      }
    } catch (error) {
      console.error('Error fetching today events:', error);
    }
  }, [shouldShowNotification, getTodayDateString]);

  // Check for today's events on mount
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      fetchTodayEvents();
    }
  }, [fetchTodayEvents]);

  // Handle close
  const handleClose = useCallback(() => {
    setVisible(false);
    unloadAlertSound();
  }, []);

  // Handle remind later
  const handleRemindLater = useCallback(async () => {
    try {
      await storage.set(STORAGE_KEY_REMIND_LATER, Date.now());
      setVisible(false);
    } catch (error) {
      console.error('Error setting remind later:', error);
      setVisible(false);
    }
  }, []);

  // Handle do not display again
  const handleDoNotDisplay = useCallback(async () => {
    try {
      await storage.set(STORAGE_KEY_HIDE_TODAY_EVENTS, true);
      setVisible(false);
    } catch (error) {
      console.error('Error setting do not display:', error);
      setVisible(false);
    }
  }, []);

  // Handle event tap
  const handleEventTap = useCallback(
    (eventId: string) => {
      setVisible(false);
      if (onNavigateToEvent) {
        onNavigateToEvent(eventId);
      }
    },
    [onNavigateToEvent]
  );

  if (!visible || todayEvents.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.bellIcon}>🔔</Text>
              <Text style={styles.title}>Today's Events</Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={handleClose}
              iconColor={colors.gray500}
            />
          </View>

          <Divider />

          {/* Event count message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              You have{' '}
              <Text style={styles.countText}>{todayEvents.length}</Text>
              {todayEvents.length === 1 ? ' event' : ' events'} scheduled for today!
            </Text>
          </View>

          {/* Event list (show up to 5) */}
          <View style={styles.eventList}>
            {todayEvents.slice(0, 5).map((event, index) => (
              <View key={event.id}>
                <Pressable
                  style={styles.eventItem}
                  onPress={() => handleEventTap(event.id)}
                  android_ripple={{ color: colors.primaryLight }}
                >
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
                    <Text style={styles.eventDetail} numberOfLines={1}>
                      {event.eventType?.name} • {event.customerCount ?? 0} {(event.customerCount ?? 0) === 1 ? 'customer' : 'customers'}
                    </Text>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={colors.gray400}
                    onPress={() => handleEventTap(event.id)}
                  />
                </Pressable>
                {index < Math.min(todayEvents.length, 5) - 1 && (
                  <Divider style={styles.eventDivider} />
                )}
              </View>
            ))}
            
            {todayEvents.length > 5 && (
              <Text style={styles.moreText}>
                +{todayEvents.length - 5} more events
              </Text>
            )}
          </View>

          <Divider style={styles.actionDivider} />

          {/* Action buttons */}
          <View style={styles.actionContainer}>
            <Button
              mode="text"
              onPress={handleRemindLater}
              textColor={colors.gray600}
              compact
              style={styles.actionButton}
            >
              Remind Later
            </Button>
            <Button
              mode="text"
              onPress={handleDoNotDisplay}
              textColor={colors.gray500}
              compact
              style={styles.actionButton}
            >
              Don't Show Again
            </Button>
            <Button
              mode="contained"
              onPress={handleClose}
              style={styles.closeButton}
              compact
            >
              Close
            </Button>
          </View>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    padding: spacing.lg,
    margin: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bellIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
  },
  messageContainer: {
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  messageText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  countText: {
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.primary,
    fontSize: typography.fontSize.lg,
  },
  eventList: {
    padding: spacing.sm,
    maxHeight: 300,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
  },
  eventDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventDivider: {
    marginHorizontal: spacing.sm,
  },
  moreText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    fontWeight: typography.fontWeight.medium as '500',
  },
  actionDivider: {
    marginTop: spacing.xs,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    marginHorizontal: 0,
  },
  closeButton: {
    backgroundColor: colors.primary,
  },
});
