/**
 * Accessibility Utilities
 * Helpers for improving app accessibility
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';

// ============================================================================
// Accessibility State Hooks
// ============================================================================

/**
 * Hook to detect if screen reader is enabled
 */
export function useScreenReader() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsEnabled(enabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to detect if reduce motion is enabled
 */
export function useReduceMotion() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkReduceMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsEnabled(enabled);
    };

    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to detect if bold text is enabled (iOS only)
 */
export function useBoldText() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const checkBoldText = async () => {
      const enabled = await AccessibilityInfo.isBoldTextEnabled();
      setIsEnabled(enabled);
    };

    checkBoldText();

    const subscription = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Hook to detect grayscale mode (iOS only)
 */
export function useGrayscale() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const checkGrayscale = async () => {
      const enabled = await AccessibilityInfo.isGrayscaleEnabled();
      setIsEnabled(enabled);
    };

    checkGrayscale();

    const subscription = AccessibilityInfo.addEventListener(
      'grayscaleChanged',
      setIsEnabled
    );

    return () => subscription.remove();
  }, []);

  return isEnabled;
}

/**
 * Combined hook for all accessibility settings
 */
export function useAccessibilitySettings() {
  const isScreenReaderEnabled = useScreenReader();
  const isReduceMotionEnabled = useReduceMotion();
  const isBoldTextEnabled = useBoldText();
  const isGrayscaleEnabled = useGrayscale();

  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isBoldTextEnabled,
    isGrayscaleEnabled,
  };
}

// ============================================================================
// Accessibility Actions
// ============================================================================

/**
 * Announce a message to screen reader
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * Set accessibility focus to an element
 * @param reactTag - The React tag/ref of the element
 */
export function setAccessibilityFocus(reactTag: number | null): void {
  if (reactTag) {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  }
}

// ============================================================================
// Accessibility Props Helpers
// ============================================================================

export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button' | 'link' | 'search' | 'image' | 'keyboardkey' | 'text' | 'adjustable' | 'imagebutton' | 'header' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

/**
 * Create accessibility props for a button
 */
export function buttonA11yProps(
  label: string,
  hint?: string,
  disabled?: boolean
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { disabled },
  };
}

/**
 * Create accessibility props for a text input
 */
export function inputA11yProps(
  label: string,
  hint?: string,
  value?: string
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityValue: value ? { text: value } : undefined,
  };
}

/**
 * Create accessibility props for a header
 */
export function headerA11yProps(label: string): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'header',
    accessibilityLabel: label,
  };
}

/**
 * Create accessibility props for an image
 */
export function imageA11yProps(label: string): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: label,
  };
}

/**
 * Create accessibility props for a link
 */
export function linkA11yProps(label: string, hint?: string): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'link',
    accessibilityLabel: label,
    accessibilityHint: hint || 'Opens a link',
  };
}

/**
 * Create accessibility props for a checkbox
 */
export function checkboxA11yProps(
  label: string,
  checked: boolean,
  disabled?: boolean
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'checkbox',
    accessibilityLabel: label,
    accessibilityState: { checked, disabled },
  };
}

/**
 * Create accessibility props for a switch/toggle
 */
export function switchA11yProps(
  label: string,
  checked: boolean,
  disabled?: boolean
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'switch',
    accessibilityLabel: label,
    accessibilityState: { checked, disabled },
  };
}

/**
 * Create accessibility props for a progress indicator
 */
export function progressA11yProps(
  label: string,
  current: number,
  min: number = 0,
  max: number = 100
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityRole: 'progressbar',
    accessibilityLabel: label,
    accessibilityValue: { min, max, now: current },
  };
}

/**
 * Create accessibility props for a list item
 */
export function listItemA11yProps(
  label: string,
  index: number,
  total: number,
  selected?: boolean
): AccessibilityProps {
  return {
    accessible: true,
    accessibilityLabel: `${label}, item ${index + 1} of ${total}`,
    accessibilityState: { selected },
  };
}

// ============================================================================
// Color Contrast Utilities
// ============================================================================

/**
 * Calculate relative luminance of a color
 * @param hex - Hex color string (e.g., '#FFFFFF')
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * WCAG requires 4.5:1 for normal text, 3:1 for large text
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @returns Contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Get accessible text color for a background
 * @param backgroundColor - Background color (hex)
 * @returns '#FFFFFF' or '#000000' based on best contrast
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

// ============================================================================
// Keyboard Navigation Helpers
// ============================================================================

/**
 * Create keyboard event handler for accessibility
 */
export function handleKeyboardNavigation(
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) {
  return (event: { key: string }) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        onEnter?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
      case 'ArrowUp':
        onArrowUp?.();
        break;
      case 'ArrowDown':
        onArrowDown?.();
        break;
    }
  };
}

export default {
  useScreenReader,
  useReduceMotion,
  useBoldText,
  useGrayscale,
  useAccessibilitySettings,
  announceForAccessibility,
  setAccessibilityFocus,
  buttonA11yProps,
  inputA11yProps,
  headerA11yProps,
  imageA11yProps,
  linkA11yProps,
  checkboxA11yProps,
  switchA11yProps,
  progressA11yProps,
  listItemA11yProps,
  getContrastRatio,
  meetsContrastRequirements,
  getAccessibleTextColor,
  handleKeyboardNavigation,
};
