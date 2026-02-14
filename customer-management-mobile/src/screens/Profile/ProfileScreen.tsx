/**
 * Profile Screen
 * Displays user profile info with logout functionality
 * App: Gifts Track
 */
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Animated, TouchableOpacity } from 'react-native';
import { Text, Button, Divider, Avatar, List } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../../styles/theme';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, isSuperAdmin } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoggingOut(true);
            await logout();
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  }, [logout]);

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header with Gradient */}
        <Animated.View
          style={[
            styles.headerGradientContainer,
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
            <View style={styles.avatarContainer}>
              <Avatar.Text
                size={90}
                label={user?.name ? getInitials(user.name) : 'U'}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {isSuperAdmin() ? '🔐 Super Admin' : '👤 Admin'}
              </Text>
            </View>
            {user?.branch && (
              <Text style={styles.userBranch}>🏢 {user.branch}</Text>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Account Info */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <Divider style={styles.divider} />

            <List.Item
              title="Mobile Number"
              description={user?.mobileNumber || 'N/A'}
              left={(props) => (
                <List.Icon {...props} icon="phone" color={colors.primary} />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Role"
              description={user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
              left={(props) => (
                <List.Icon {...props} icon="shield-account" color={colors.primary} />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            {user?.address && (
              <List.Item
                title="Address"
                description={user.address}
                left={(props) => (
                  <List.Icon {...props} icon="map-marker" color={colors.primary} />
                )}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            )}
            {user?.place && (
              <List.Item
                title="Place"
                description={user.place}
                left={(props) => (
                  <List.Icon {...props} icon="city" color={colors.primary} />
                )}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            )}
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <Divider style={styles.divider} />

            <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')}>
              <List.Item
                title="Change Password"
                description="Update your password"
                left={(props) => (
                  <List.Icon {...props} icon="lock-reset" color={colors.primary} />
                )}
                right={(props) => (
                  <List.Icon {...props} icon="chevron-right" color={colors.textSecondary} />
                )}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>App Information</Text>
            <Divider style={styles.divider} />

            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => (
                <List.Icon {...props} icon="information" color={colors.accent} />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Build"
              description="Production"
              left={(props) => (
                <List.Icon {...props} icon="wrench" color={colors.accent} />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Button
            mode="outlined"
            onPress={handleLogout}
            loading={isLoggingOut}
            disabled={isLoggingOut}
            icon="logout"
            style={styles.logoutButton}
            contentStyle={styles.logoutButtonContent}
            labelStyle={styles.logoutButtonLabel}
            textColor={colors.error}
          >
            Sign Out
          </Button>
        </Animated.View>

        {/* Footer */}
        <Text style={styles.footer}>
          Gifts Track{'\n'}© 2026 All Rights Reserved
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerGradientContainer: {
    marginBottom: spacing.lg,
  },
  headerGradient: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  avatarContainer: {
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarLabel: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold as '700',
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  roleText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.medium as '500',
  },
  userBranch: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  listTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  listDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium as '500',
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  logoutButton: {
    borderColor: colors.error,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  logoutButtonContent: {
    height: 52,
  },
  logoutButtonLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  footer: {
    marginTop: spacing['2xl'],
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
