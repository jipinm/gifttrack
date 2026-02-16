/**
 * Master Data List Screen
 * Shows items in a master data category with create/edit/enable-disable functionality
 * Super Admin only
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  FAB,
  Switch,
  Badge,
  IconButton,
} from 'react-native-paper';
import { HeaderIconButton } from '../../components/Common/HeaderButton';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { masterDataService } from '../../services/masterDataService';
import { useAuth } from '../../context/AuthContext';
import { useMasterData } from '../../context/MasterDataContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type { MasterDataItem } from '../../types';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'MasterDataList'>;
type RouteProps = RouteProp<ProfileStackParamList, 'MasterDataList'>;

export default function MasterDataListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { category, title } = route.params;
  const { isSuperAdmin } = useAuth();
  const { refreshMasterData } = useMasterData();
  const hasSuperAdminAccess = isSuperAdmin();

  // State
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  // Load items
  const loadItems = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const response = await masterDataService.getAllByCategory(category);

        if (response.success && response.data) {
          // Validate response is an array of master data items
          if (Array.isArray(response.data)) {
            setItems(response.data);
          } else {
            setError('Invalid response format from server');
          }
        } else {
          setError(response.message || 'Failed to load data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [category]
  );

  // Navigate to create - defined early for use in header
  const handleCreate = useCallback(() => {
    navigation.navigate('MasterDataForm', {
      category,
      title,
    });
  }, [navigation, category, title]);

  // Set header title and add button
  useEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <HeaderIconButton icon="plus" onPress={handleCreate} />
      ),
    });
  }, [navigation, title, handleCreate]);

  // Initial load
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  // Handle toggle active status
  const handleToggleActive = useCallback(
    async (item: MasterDataItem) => {
      const action = item.isActive ? 'disable' : 'enable';
      
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} ${item.name}`,
        `Are you sure you want to ${action} "${item.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: action.charAt(0).toUpperCase() + action.slice(1),
            style: item.isActive ? 'destructive' : 'default',
            onPress: async () => {
              try {
                setTogglingId(item.id);
                const response = await masterDataService.toggleActiveByCategory(category, item.id);

                if (response.success && response.data) {
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id ? { ...i, isActive: response.data!.isActive, isDefault: response.data!.isDefault } : i
                    )
                  );
                  // Refresh master data context to update app-wide
                  await refreshMasterData();
                } else {
                  Alert.alert('Error', response.message || 'Failed to update status');
                }
              } catch (err) {
                Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
              } finally {
                setTogglingId(null);
              }
            },
          },
        ]
      );
    },
    [category, refreshMasterData]
  );

  // Navigate to edit
  const handleEdit = useCallback(
    (item: MasterDataItem) => {
      navigation.navigate('MasterDataForm', {
        category,
        title,
        itemId: item.id,
        itemName: item.name,
      });
    },
    [navigation, category, title]
  );

  // Handle set as default
  const handleSetDefault = useCallback(
    async (item: MasterDataItem) => {
      if (item.isDefault) return; // Already default
      if (!item.isActive) {
        Alert.alert('Cannot Set Default', 'Disabled items cannot be set as default. Enable the item first.');
        return;
      }

      Alert.alert(
        'Set Default',
        `Set "${item.name}" as the default ${title.slice(0, -1).toLowerCase()}?\n\nThis will be preselected automatically in forms.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Default',
            onPress: async () => {
              try {
                setSettingDefaultId(item.id);
                const response = await masterDataService.setDefaultByCategory(category, item.id);

                if (response.success) {
                  // Update local state: clear old default, set new one
                  setItems((prev) =>
                    prev.map((i) => ({
                      ...i,
                      isDefault: i.id === item.id,
                    }))
                  );
                  await refreshMasterData();
                } else {
                  Alert.alert('Error', response.message || 'Failed to set default');
                }
              } catch (err) {
                Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
              } finally {
                setSettingDefaultId(null);
              }
            },
          },
        ]
      );
    },
    [category, title, refreshMasterData]
  );

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: MasterDataItem }) => (
      <View style={[styles.itemCard, !item.isActive && styles.itemCardDisabled]}>
        <View style={styles.itemContent}>
          <View style={styles.itemMain}>
            <Text style={[styles.itemName, !item.isActive && styles.itemNameDisabled]}>
              {item.name}
            </Text>
            {item.isDefault && (
              <Badge style={styles.defaultBadge} size={20}>
                Default
              </Badge>
            )}
            {!item.isActive && (
              <Badge style={styles.disabledBadge} size={20}>
                Disabled
              </Badge>
            )}
          </View>
          <View style={styles.itemActions}>
            <IconButton
              icon={item.isDefault ? 'star' : 'star-outline'}
              iconColor={item.isDefault ? colors.warning : colors.textSecondary}
              size={20}
              onPress={() => handleSetDefault(item)}
              disabled={item.isDefault || settingDefaultId === item.id}
              style={styles.actionButton}
            />
            <IconButton
              icon="pencil"
              iconColor={colors.primary}
              size={20}
              onPress={() => handleEdit(item)}
              style={styles.actionButton}
            />
            <Switch
              value={item.isActive ?? true}
              onValueChange={() => handleToggleActive(item)}
              disabled={togglingId === item.id}
              color={colors.success}
            />
          </View>
        </View>
      </View>
    ),
    [handleEdit, handleToggleActive, handleSetDefault, togglingId, settingDefaultId]
  );

  // Key extractor
  const keyExtractor = useCallback((item: MasterDataItem) => item.id.toString(), []);

  // Access check
  if (!hasSuperAdminAccess) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>Only Super Admins can manage master data.</Text>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadItems()}>
          <Text style={styles.retryText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Items</Text>
          <Text style={styles.emptyText}>Tap the + button to add the first item</Text>
        </View>
        <FAB icon="plus" style={styles.fab} onPress={handleCreate} color={colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {items.filter((i) => i.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {items.filter((i) => !i.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Disabled</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadItems(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} onPress={handleCreate} color={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    padding: spacing.md,
  },
  retryText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as '500',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  itemCardDisabled: {
    backgroundColor: colors.background,
    opacity: 0.8,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium as '500',
    color: colors.textPrimary,
  },
  itemNameDisabled: {
    color: colors.textSecondary,
  },
  disabledBadge: {
    backgroundColor: colors.error,
    fontSize: typography.fontSize.xs,
  },
  defaultBadge: {
    backgroundColor: colors.warning,
    fontSize: typography.fontSize.xs,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
  separator: {
    height: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});
