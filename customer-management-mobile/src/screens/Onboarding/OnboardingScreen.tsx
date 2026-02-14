/**
 * Onboarding Screen
 * App introduction and feature highlights for first-time users
 * App: Gifts Track
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  Animated,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';
import { storage } from '../../utils/storage';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Gifts Track',
    description:
      'Your complete solution for managing customers and tracking gifts with ease.',
    icon: '🎁',
    backgroundColor: '#6366F1',
  },
  {
    id: '2',
    title: 'Customer Management',
    description:
      'Add, edit, and organize customer information. Search and filter to find anyone instantly.',
    icon: '👥',
    backgroundColor: '#F97316',
  },
  {
    id: '3',
    title: 'Smart Gift Tracking',
    description:
      'Keep track of all gifts given to customers. Record values, types, and dates effortlessly.',
    icon: '✨',
    backgroundColor: '#10B981',
  },
  {
    id: '4',
    title: 'Always Accessible',
    description:
      'Access your data anytime, anywhere. Works seamlessly online and offline.',
    icon: '📱',
    backgroundColor: '#8B5CF6',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const STORAGE_KEY = 'onboarding_complete';

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const viewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await storage.set(STORAGE_KEY, true);
    onComplete();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale }], opacity }]}
        >
          <Text style={styles.icon}>{item.icon}</Text>
        </Animated.View>
        <Animated.View style={[styles.textContainer, { opacity }]}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            accessibilityLabel={item.title}
          >
            {item.title}
          </Text>
          <Text
            style={styles.description}
            accessibilityLabel={item.description}
          >
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 20, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                },
              ]}
              accessibilityLabel={`Page ${index + 1} of ${slides.length}`}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {!isLastSlide && (
        <View style={styles.skipContainer}>
          <Button
            mode="text"
            onPress={handleSkip}
            textColor={colors.white}
            accessibilityLabel="Skip onboarding"
            accessibilityHint="Skips remaining slides and goes to app"
          >
            Skip
          </Button>
        </View>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
        accessibilityLabel="Onboarding slides"
      />

      {/* Bottom section */}
      <View style={styles.bottomContainer}>
        {renderPagination()}

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
          contentStyle={styles.nextButtonContent}
          labelStyle={styles.nextButtonLabel}
          accessibilityLabel={isLastSlide ? 'Get Started' : 'Next slide'}
          accessibilityHint={
            isLastSlide
              ? 'Completes onboarding and opens the app'
              : 'Navigates to next slide'
          }
        >
          {isLastSlide ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

/**
 * Check if onboarding has been completed
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const completed = await storage.get<boolean>(STORAGE_KEY);
  return !!completed;
}

/**
 * Reset onboarding status (for testing)
 */
export async function resetOnboarding(): Promise<void> {
  await storage.remove(STORAGE_KEY);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  skipContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...shadows.lg,
  },
  icon: {
    fontSize: 72,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginHorizontal: 4,
  },
  nextButton: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  nextButtonContent: {
    height: 58,
  },
  nextButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;
