/**
 * Today Events Notification Component
 * Displays a notification after login if there are events scheduled for today
 * Features: sound notification, remind later, do not display again, close
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Vibration } from 'react-native';
import { Modal, Portal, Text, Button, IconButton, Card, Divider } from 'react-native-paper';
import { customerService } from '../../services/customerService';
import { storage } from '../../utils/storage';
import { playAlertSound, unloadAlertSound } from '../../utils/alertSound';
import { colors, spacing, borderRadius, shadows, typography } from '../../styles/theme';
import type { Customer } from '../../types';

const STORAGE_KEY_HIDE_TODAY_EVENTS = '@hideToday EventsNotification';
const STORAGE_KEY_REMIND_LATER = '@remindLaterTimestamp';
const REMIND_LATER_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface TodayEventsNotificationProps {
  onNavigateToCustomer?: (customerId: string) => void;
}

export default function TodayEventsNotification({
  onNavigateToCustomer,
}: TodayEventsNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [todayCustomers, setTodayCustomers] = useState<Customer[]>([]);
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

  // Fetch customers with today's events
  const fetchTodayEvents = useCallback(async () => {
    try {
      const shouldShow = await shouldShowNotification();
      if (!shouldShow) {
        return;
      }

      const todayDate = getTodayDateString();
      const response = await customerService.getAll({
        eventDate: todayDate,
        page: 1,
        perPage: 100, // Get up to 100 customers with today's events
      });

      if (response.success && response.data) {
        let customers: Customer[] = [];
        
        // Handle paginated or non-paginated response
        if ('data' in response.data && Array.isArray(response.data.data)) {
          customers = response.data.data;
        } else if (Array.isArray(response.data)) {
          customers = response.data;
        }

        if (customers.length > 0) {
          setTodayCustomers(customers);
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

  // Handle customer tap
  const handleCustomerTap = useCallback(
    (customerId: string) => {
      setVisible(false);
      if (onNavigateToCustomer) {
        onNavigateToCustomer(customerId);
      }
    },
    [onNavigateToCustomer]
  );

  if (!visible || todayCustomers.length === 0) {
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
              <Text style={styles.countText}>{todayCustomers.length}</Text>
              {todayCustomers.length === 1 ? ' event' : ' events'} scheduled for today!
            </Text>
          </View>

          {/* Customer list (show up to 5) */}
          <View style={styles.customerList}>
            {todayCustomers.slice(0, 5).map((customer, index) => (
              <View key={customer.id}>
                <View
                  style={styles.customerItem}
                >
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerDetail}>
                      Event • {customer.mobileNumber}
                    </Text>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={20}
                    iconColor={colors.gray400}
                    onPress={() => handleCustomerTap(customer.id)}
                  />
                </View>
                {index < Math.min(todayCustomers.length, 5) - 1 && (
                  <Divider style={styles.customerDivider} />
                )}
              </View>
            ))}
            
            {todayCustomers.length > 5 && (
              <Text style={styles.moreText}>
                +{todayCustomers.length - 5} more events
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
  customerList: {
    padding: spacing.sm,
    maxHeight: 300,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
  },
  customerDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerDivider: {
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
