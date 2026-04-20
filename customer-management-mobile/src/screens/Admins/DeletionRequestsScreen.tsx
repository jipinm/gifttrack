/**
 * Deletion Requests Screen
 * Super Admin only: View and act on admin account deletion requests
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Chip, Divider, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { adminService } from '../../services/adminService';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { AdminDeletionRequest, DeletionRequestStatus } from '../../types';

const STATUS_FILTERS: { label: string; value: DeletionRequestStatus | 'all' }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

const STATUS_COLORS: Record<DeletionRequestStatus, string> = {
  pending: '#FFC107',
  approved: colors.success,
  rejected: colors.error,
};

export default function DeletionRequestsScreen() {
  const [requests, setRequests] = useState<AdminDeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DeletionRequestStatus | 'all'>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const status = activeFilter === 'all' ? undefined : activeFilter;
      const response = await adminService.getDeletionRequests(status);

      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        setError(response.message || 'Failed to load deletion requests.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const handleAction = useCallback(
    (request: AdminDeletionRequest, action: 'approve' | 'reject') => {
      const actionLabel = action === 'approve' ? 'Approve' : 'Reject';
      const actionMessage =
        action === 'approve'
          ? `Are you sure you want to approve the deletion request for "${request.adminName}"? This will permanently delete their account.`
          : `Are you sure you want to reject the deletion request for "${request.adminName}"? Their account will remain active.`;

      Alert.alert(`${actionLabel} Request`, actionMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: action === 'approve' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setProcessingId(request.id);
              const response = await adminService.actOnDeletionRequest(request.id, action);

              if (response.success) {
                Alert.alert(
                  'Success',
                  action === 'approve'
                    ? `Admin account "${request.adminName}" has been deleted.`
                    : `Deletion request for "${request.adminName}" has been rejected.`
                );
                loadRequests();
              } else {
                Alert.alert('Failed', response.message || `Failed to ${action} request.`);
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

  const renderItem = useCallback(
    ({ item }: { item: AdminDeletionRequest }) => {
      const isProcessing = processingId === item.id;
      const statusColor = STATUS_COLORS[item.status];

      return (
        <View style={styles.requestCard}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{item.adminName}</Text>
              <Text style={styles.adminMobile}>{item.adminMobile}</Text>
              {item.adminBranch ? (
                <Text style={styles.adminBranch}>🏢 {item.adminBranch}</Text>
              ) : null}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          <Divider style={styles.cardDivider} />

          <Text style={styles.dateText}>
            Requested: {new Date(item.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </Text>

          {/* Action buttons for pending requests */}
          {item.status === 'pending' && (
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                onPress={() => handleAction(item, 'approve')}
                loading={isProcessing}
                disabled={isProcessing}
                icon="check-circle"
                style={[styles.actionButton, styles.approveButton]}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabel}
                buttonColor={colors.success}
                compact
              >
                Approve
              </Button>
              <Button
                mode="outlined"
                onPress={() => handleAction(item, 'reject')}
                loading={isProcessing}
                disabled={isProcessing}
                icon="close-circle"
                style={[styles.actionButton, styles.rejectButton]}
                contentStyle={styles.actionButtonContent}
                labelStyle={styles.actionButtonLabelReject}
                textColor={colors.error}
                compact
              >
                Reject
              </Button>
            </View>
          )}
        </View>
      );
    },
    [handleAction, processingId]
  );

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={activeFilter === f.value}
            onPress={() => setActiveFilter(f.value)}
            style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
            textStyle={activeFilter === f.value ? styles.filterChipTextActive : styles.filterChipText}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => loadRequests()} style={{ marginTop: spacing.md }}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadRequests(true)}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                {activeFilter === 'pending'
                  ? 'No pending deletion requests.'
                  : `No ${activeFilter === 'all' ? '' : activeFilter} requests found.`}
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
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
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
    color: colors.white,
    fontSize: typography.fontSize.xs,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  adminInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  adminName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.text,
  },
  adminMobile: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  adminBranch: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  cardDivider: {
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  approveButton: {},
  rejectButton: {
    borderColor: colors.error,
  },
  actionButtonContent: {
    paddingVertical: 2,
  },
  actionButtonLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  actionButtonLabelReject: {
    fontSize: typography.fontSize.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
  },
});
