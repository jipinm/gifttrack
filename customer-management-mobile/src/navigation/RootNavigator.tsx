/**
 * Root Navigator
 * Manages authentication state and routes to appropriate navigator
 * App: Gifts Track
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography, shadows } from '../styles/theme';

const { width } = Dimensions.get('window');

export default function RootNavigator() {
  const { isAuthenticated, isLoading, verifyToken } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  // Animation values for splash screen
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate splash screen elements
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for loader
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [logoScale, logoOpacity, textOpacity, pulseAnim]);

  useEffect(() => {
    const verifyAuth = async () => {
      if (isAuthenticated) {
        // Verify token validity with the API
        await verifyToken();
      }
      setIsVerifying(false);
    };

    if (!isLoading) {
      verifyAuth();
    }
  }, [isLoading, isAuthenticated, verifyToken]);

  // Show splash screen while loading
  if (isLoading || isVerifying) {
    return (
      <View style={styles.splashContainer}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#A855F7']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🎁</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.splashTitle}>Gifts Track</Text>
          <Text style={styles.splashTagline}>Track gifts with ease</Text>
        </Animated.View>

        <Animated.View
          style={[styles.loaderContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <ActivityIndicator size="large" color={colors.white} style={styles.loader} />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.splashSubtitle}>Loading...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -width * 0.2,
    right: -width * 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.lg,
  },
  logoEmoji: {
    fontSize: 56,
  },
  splashTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -1,
  },
  splashTagline: {
    fontSize: typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  loaderContainer: {
    marginVertical: spacing.lg,
  },
  loader: {
    marginVertical: spacing.md,
  },
  splashSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
