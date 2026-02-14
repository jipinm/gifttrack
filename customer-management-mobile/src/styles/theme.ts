/**
 * Theme Configuration
 * Defines colors, typography, spacing, and other design tokens
 * App: Gifts Track
 */

// Color Palette - Modern gradient-friendly colors
export const colors = {
  // Primary colors - Rich purple/indigo gradient base
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#A5B4FC',
  primaryGradientStart: '#6366F1',
  primaryGradientEnd: '#8B5CF6',

  // Secondary colors - Warm coral/orange
  secondary: '#F97316',
  secondaryDark: '#EA580C',
  secondaryLight: '#FED7AA',
  secondaryGradientStart: '#F97316',
  secondaryGradientEnd: '#FB923C',

  // Accent colors - Teal/cyan for highlights
  accent: '#14B8A6',
  accentDark: '#0D9488',
  accentLight: '#99F6E4',

  // Status colors
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#27272A',
  gray900: '#18181B',

  // Background colors
  background: '#F8FAFC',
  backgroundDark: '#0F172A',
  surface: '#FFFFFF',
  surfaceDark: '#1E293B',

  // Text colors
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textDisabled: '#CBD5E1',
  textPrimaryDark: '#F1F5F9',
  textSecondaryDark: '#94A3B8',

  // Border colors
  border: '#E2E8F0',
  borderDark: '#334155',

  // Gift status colors
  gifted: '#10B981',
  nonGifted: '#94A3B8',

  // Glassmorphism colors
  glassWhite: 'rgba(255, 255, 255, 0.25)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
  glassOverlay: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(0, 0, 0, 0.1)',
} as const;

// Gradient Presets for LinearGradient
export const gradients = {
  primary: ['#6366F1', '#8B5CF6'] as const,
  secondary: ['#F97316', '#FB923C'] as const,
  accent: ['#14B8A6', '#06B6D4'] as const,
  success: ['#10B981', '#34D399'] as const,
  danger: ['#EF4444', '#F87171'] as const,
  sunset: ['#F97316', '#EC4899'] as const,
  ocean: ['#06B6D4', '#3B82F6'] as const,
  purple: ['#8B5CF6', '#EC4899'] as const,
  dark: ['#1E293B', '#0F172A'] as const,
} as const;

// Glassmorphism Styles
export const glassmorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(16px)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
  },
} as const;

// Typography - Enhanced for better readability
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
} as const;

// Spacing scale (based on 4px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// Border Radius - Smoother curves
export const borderRadius = {
  none: 0,
  sm: 6,
  base: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

// Enhanced Shadows with more depth options
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glowSuccess: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// Animation Timing
export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    spring: 'spring',
  },
  scale: {
    pressed: 0.97,
    hover: 1.02,
    bounce: 1.05,
  },
} as const;

// Icon Sizes
export const iconSizes = {
  xs: 14,
  sm: 18,
  base: 22,
  md: 26,
  lg: 34,
  xl: 42,
  '2xl': 56,
} as const;

// Default Theme
export const theme = {
  colors,
  gradients,
  glassmorphism,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  iconSizes,
} as const;

export type Theme = typeof theme;

export default theme;
