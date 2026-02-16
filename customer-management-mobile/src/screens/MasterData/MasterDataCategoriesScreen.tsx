/**
 * Master Data Categories Screen
 * Shows list of master data categories that can be managed
 * Super Admin only
 */
import React, { useCallback, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, List, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../../styles/theme';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import type { MasterDataCategory } from '../../types';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'MasterDataCategories'>;

interface CategoryItem {
  key: MasterDataCategory;
  title: string;
  description: string;
  icon: string;
}

const MASTER_DATA_CATEGORIES: CategoryItem[] = [
  {
    key: 'eventTypes',
    title: 'Event Types',
    description: 'Reception, Wedding, Birthday, etc.',
    icon: 'calendar-star',
  },
  {
    key: 'giftTypes',
    title: 'Gift Types',
    description: 'Cash, Gold, Utensil, etc.',
    icon: 'gift',
  },
  {
    key: 'invitationStatus',
    title: 'Invitation Status',
    description: 'Invited, Not Invited, Confirmed, etc.',
    icon: 'email-check',
  },
  {
    key: 'careOfOptions',
    title: 'Care-of Options',
    description: 'Self, Family Member, etc.',
    icon: 'account-group',
  },
];

export default function MasterDataCategoriesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isSuperAdmin } = useAuth();
  const hasSuperAdminAccess = isSuperAdmin();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleCategoryPress = useCallback(
    (category: CategoryItem) => {
      navigation.navigate('MasterDataList', {
        category: category.key,
        title: category.title,
      });
    },
    [navigation]
  );

  const renderCategoryItem = useCallback(
    ({ item, index }: { item: CategoryItem; index: number }) => (
      <Animated.View
        style={[
          styles.categoryItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30 * (index + 1), 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.7}
        >
          <List.Item
            title={item.title}
            description={item.description}
            left={(props) => (
              <List.Icon {...props} icon={item.icon} color={colors.primary} />
            )}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />
            )}
            titleStyle={styles.categoryTitle}
            descriptionStyle={styles.categoryDescription}
          />
        </TouchableOpacity>
      </Animated.View>
    ),
    [fadeAnim, handleCategoryPress]
  );

  const keyExtractor = useCallback((item: CategoryItem) => item.key, []);

  // Access check
  if (!hasSuperAdminAccess) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>Only Super Admins can manage master data.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={gradients.primary}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Master Data Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage app reference data like event types, gift types, and more
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Categories List */}
      <FlatList
        data={MASTER_DATA_CATEGORIES}
        renderItem={renderCategoryItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    backgroundColor: colors.background,
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
  headerContainer: {
    marginBottom: spacing.md,
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  categoryItem: {
    marginBottom: spacing.xs,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  categoryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
  },
  categoryDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  separator: {
    height: spacing.xs,
  },
});
