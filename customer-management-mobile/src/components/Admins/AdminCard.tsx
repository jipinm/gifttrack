/**
 * Admin Card Component
 * Displays admin user info with modern styling and animations
 */
import React, { memo, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type { Admin } from '../../types';

interface AdminCardProps {
  admin: Admin;
  onPress?: (admin: Admin) => void;
  onEdit?: (admin: Admin) => void;
  onDelete?: (admin: Admin) => void;
}

function AdminCard({ admin, onPress, onEdit, onDelete }: AdminCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const formatMobile = (mobile: string): string => {
    if (mobile.length === 10) {
      return `${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return mobile;
  };

  return (
    <Pressable
      onPress={() => onPress?.(admin)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.card}>
          {/* Accent bar */}
          <View style={styles.accentBar} />
          
          <View style={styles.content}>
            {/* Header with Avatar and Name */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="shield-account" size={24} color={colors.primary} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.name} numberOfLines={1}>{admin.name}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>Admin</Text>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actions}>
                {onEdit && (
                  <IconButton
                    icon="pencil-outline"
                    size={20}
                    iconColor={colors.primary}
                    onPress={() => onEdit(admin)}
                    style={styles.actionButton}
                  />
                )}
                {onDelete && (
                  <IconButton
                    icon="trash-can-outline"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => onDelete(admin)}
                    style={styles.actionButton}
                  />
                )}
              </View>
            </View>

            {/* Info Rows */}
            <View style={styles.infoSection}>
              {/* Mobile Number */}
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="phone" size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.value}>{formatMobile(admin.mobileNumber)}</Text>
              </View>

              {/* Branch */}
              {admin.branch && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="office-building" size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.value}>{admin.branch}</Text>
                </View>
              )}

              {/* City */}
              {admin.cityName && (
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.value}>{admin.cityName}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.md,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  content: {
    padding: spacing.base,
    paddingLeft: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
    marginLeft: -spacing.xs,
  },
  infoSection: {
    marginTop: spacing.xs,
    paddingLeft: 52, // Align with text after avatar
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default memo(AdminCard);
