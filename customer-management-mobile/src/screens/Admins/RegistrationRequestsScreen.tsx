/**
 * Registration Requests Screen
 * Super Admin only: View and approve / reject admin registration requests.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Chip, Button, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { Admin, AdminStatus, RegistrationRequestAction } from '../../types';

type FilterValue = AdminStatus | 'all';

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

const STATUS_COLORS: Record<AdminStatus, string> = {
  pending: '#FFC107',
  approved: colors.success,
  rejected: colors.error,
};

const STATUS_LABELS: Record<AdminStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function RegistrationRequestsScreen() {
  const [requests, setRequests] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadRequests = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const status = activeFilter === 'all' ? 'all' : activeFilter;
        const response = await adminService.getRegistrationRequests(status);

        if (response.success && response.data) {
          setRequests(response.data);
        } else {
          setError(response.message || 'Failed to load registration requests.');
        }
      } catch {
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeFilter]
  );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  // ── Action (approve / reject) ────────────────────────────────────────────────
  const handleAction = useCallback(
    (admin: Admin, action: RegistrationRequestAction) => {
      const actionLabel = action === 'approve' ? 'Approve' : 'Reject';
      const message =
        action === 'approve'
          ? `Approve registration for "${admin.name}"? They will be able to log in immediately.`
          : `Reject registration for "${admin.name}"? They will not be able to log in.`;

      Alert.alert(`${actionLabel} Registration`, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setProcessingId(admin.id);
              const response = await adminService.actOnRegistrationRequest(admin.id, action);
              if (response.success) {
                const resultLabel = action === 'approve' ? 'approved' : 'rejected';
                Alert.alert('Success', `Registration ${resultLabel} successfully.`);
                loadRequests();
              } else {
                Alert.alert('Error', response.message || 'Failed to process request.');
              }
            } catch {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]);
    },
    [loadRequests]
  );

  // ── Item renderer ────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Admin }) => {
      const statusColor = STATUS_COLORS[item.status] ?? '#9E9E9E';
      const isProcessing = processingId === item.id;
      const isPending = item.status === 'pending';

      return (
        <View style={styles.card}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMobile}>{item.mobileNumber}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {STATUS_LABELS[item.status] ?? item.status}
              </Text>
            </View>
          </View>

          {/* Details */}
          {item.address ? (
            <Text style={styles.cardDetail} numberOfLines={2}>
              📍 {item.address}
              {item.districtName ? `, ${item.districtName}` : ''}
              {item.stateName ? `, ${item.stateName}` : ''}
            </Text>
          ) : null}
          {item.branch ? (
            <Text style={styles.cardDetail}>🏢 {item.branch}</Text>
          ) : null}
          <Text style={styles.cardDate}>
            Submitted: {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>

          {/* Actions — only for pending requests */}
          {isPending && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.actionRow}>
                <Button
                  mode="contained"
                  onPress={() => handleAction(item, 'approve')}
                  disabled={isProcessing}
                  loading={isProcessing}
                  style={[styles.actionButton, styles.approveButton]}
                  labelStyle={styles.approveButtonLabel}
                  icon="check-circle"
                  compact
                >
                  Approve
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleAction(item, 'reject')}
                  disabled={isProcessing}
                  style={[styles.actionButton, styles.rejectButton]}
                  labelStyle={styles.rejectButtonLabel}
                  icon="close-circle"
                  compact
                >
                  Reject
                </Button>
              </View>
            </>
          )}
        </View>
      );
    },
    [processingId, handleAction]
  );

  const keyExtractor = useCallback((item: Admin) => item.id, []);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            selected={activeFilter === opt.value}
            onPress={() => setActiveFilter(opt.value)}
            style={[styles.filterChip, activeFilter === opt.value && styles.filterChipActive]}
            textStyle={[
              styles.filterChipText,
              activeFilter === opt.value && styles.filterChipTextActive,
            ]}
            compact
          >
            {opt.label}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="outlined" onPress={() => loadRequests()}>
            Try Again
          </Button>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadRequests(true)}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No registration requests</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'pending'
                  ? 'No pending requests at the moment.'
                  : `No ${activeFilter} requests found.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
  },
  cardMobile: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  cardDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textDisabled ?? colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  approveButtonLabel: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
  },
  rejectButton: {
    borderColor: colors.error,
  },
  rejectButtonLabel: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
