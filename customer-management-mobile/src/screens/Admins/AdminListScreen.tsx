/**
 * Admin List Screen
 * Displays all admin users (Superadmin only)
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Text, Searchbar, ActivityIndicator, Button, FAB } from 'react-native-paper';
import { HeaderTextButton } from '../../components/Common/HeaderButton';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { AdminCard } from '../../components/Admins';
import { colors, spacing } from '../../styles/theme';
import type { Admin } from '../../types';
import type { AdminStackParamList } from '../../navigation/AdminStackNavigator';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'AdminList'>;

export default function AdminListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isSuperAdmin } = useAuth();
  const hasSuperAdminAccess = isSuperAdmin();

  // State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load admins
  const loadAdmins = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await adminService.getAll();

      if (response.success && response.data) {
        setAdmins(response.data);
        setFilteredAdmins(response.data);
      } else {
        setError(response.message || 'Failed to load admins');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Navigate to create admin
  const handleCreateAdmin = useCallback(() => {
    navigation.navigate('CreateAdmin');
  }, [navigation]);

  // Set header button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderTextButton label="+ New" onPress={handleCreateAdmin} />
      ),
    });
  }, [navigation, handleCreateAdmin]);

  // Initial load
  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadAdmins();
    }, [loadAdmins])
  );

  // Filter admins based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAdmins(admins);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = admins.filter(
      (admin) =>
        admin.name.toLowerCase().includes(query) ||
        admin.mobileNumber.includes(query) ||
        admin.branch?.toLowerCase().includes(query) ||
        admin.cityName?.toLowerCase().includes(query)
    );
    setFilteredAdmins(filtered);
  }, [searchQuery, admins]);

  // Navigate to edit
  const handleEdit = useCallback(
    (admin: Admin) => {
      navigation.navigate('EditAdmin', { adminId: admin.id });
    },
    [navigation]
  );

  // Delete admin
  const handleDelete = useCallback((admin: Admin) => {
    Alert.alert(
      'Delete Admin',
      `Are you sure you want to delete ${admin.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await adminService.delete(admin.id);
              if (response.success) {
                setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
              } else {
                const msg = response.message || 'Failed to delete admin';
                const title = msg.toLowerCase().startsWith('you cannot') ? 'Cannot Delete' : 'Error';
                Alert.alert(title, msg);
              }
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete admin');
            }
          },
        },
      ]
    );
  }, []);

  // Render admin item
  const renderAdminItem = useCallback(
    ({ item }: { item: Admin }) => (
      <AdminCard admin={item} onEdit={handleEdit} onDelete={handleDelete} />
    ),
    [handleEdit, handleDelete]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Admin) => item.id, []);

  // Check access - must be after all hooks
  if (!hasSuperAdminAccess) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>Only superadmins can access admin management.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading admins...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="outlined" onPress={() => loadAdmins()}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name, mobile, branch..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Admin List */}
      <FlatList
        data={filteredAdmins}
        renderItem={renderAdminItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadAdmins(true)}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No admins found' : 'No admins yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search term' : 'Tap the + button to add a new admin'}
            </Text>
            {!searchQuery && (
              <Button
                mode="contained"
                onPress={handleCreateAdmin}
                style={{ marginTop: 16 }}
                icon="plus"
              >
                Add Admin
              </Button>
            )}
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateAdmin}
        color={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
    borderRadius: 28,
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
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchbar: {
    backgroundColor: colors.background,
    elevation: 0,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
