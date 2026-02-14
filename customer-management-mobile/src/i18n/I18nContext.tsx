/**
 * Internationalization Context and Hook
 * Provides translation functionality across the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import {
  translations,
  defaultLanguage,
  supportedLanguages,
  type SupportedLanguage,
  type TranslationKeys,
} from './translations';

// Storage key for persisting language preference
const LANGUAGE_STORAGE_KEY = 'app_language';

// Get device language
const getDeviceLanguage = (): SupportedLanguage => {
  let deviceLanguage: string;
  
  if (Platform.OS === 'ios') {
    deviceLanguage = 
      NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
      'en';
  } else {
    deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'en';
  }
  
  // Extract language code (e.g., 'en_US' -> 'en')
  const languageCode = deviceLanguage.split(/[-_]/)[0].toLowerCase();
  
  // Check if the language is supported
  const isSupported = supportedLanguages.some(lang => lang.code === languageCode);
  
  return isSupported ? (languageCode as SupportedLanguage) : defaultLanguage;
};

// Type for interpolation params
type InterpolationParams = Record<string, string | number>;

// Nested key path type
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}` | K
        : K
      : never
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

// Context type
interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: TranslationKey, params?: InterpolationParams) => string;
  isRTL: boolean;
  supportedLanguages: typeof supportedLanguages;
}

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): string | undefined => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  
  return typeof current === 'string' ? current : undefined;
};

// Interpolate string with params
const interpolate = (text: string, params?: InterpolationParams): string => {
  if (!params) return text;
  
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() ?? match;
  });
};

// Provider props
interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
}

/**
 * I18n Provider Component
 * Wraps the app to provide translation functionality
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  initialLanguage 
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    initialLanguage || defaultLanguage
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        
        if (savedLanguage && supportedLanguages.some(l => l.code === savedLanguage)) {
          setLanguageState(savedLanguage as SupportedLanguage);
        } else if (!initialLanguage) {
          // Use device language if no saved preference
          const deviceLang = getDeviceLanguage();
          setLanguageState(deviceLang);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadLanguage();
  }, [initialLanguage]);

  // Set language and persist to storage
  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
      // Still update the state even if storage fails
      setLanguageState(lang);
    }
  }, []);

  // Translation function
  const t = useCallback((key: TranslationKey, params?: InterpolationParams): string => {
    // Get translation for current language
    let translation = getNestedValue(translations[language], key);
    
    // Fallback to default language if not found
    if (translation === undefined && language !== defaultLanguage) {
      translation = getNestedValue(translations[defaultLanguage], key);
    }
    
    // Return key if translation not found
    if (translation === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    return interpolate(translation, params);
  }, [language]);

  // Check if current language is RTL
  const isRTL = useMemo(() => {
    // Add RTL languages here if needed
    const rtlLanguages: SupportedLanguage[] = [];
    return rtlLanguages.includes(language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRTL,
    supportedLanguages,
  }), [language, setLanguage, t, isRTL]);

  // Optionally wait for initialization
  // For now, render immediately with default language
  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to access i18n functionality
 */
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  
  return context;
};

/**
 * Hook to get just the translation function
 * Lightweight version for components that only need to translate
 */
export const useT = (): ((key: TranslationKey, params?: InterpolationParams) => string) => {
  const { t } = useTranslation();
  return t;
};

/**
 * Hook to get current language
 */
export const useLanguage = (): {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  supportedLanguages: typeof supportedLanguages;
} => {
  const { language, setLanguage, supportedLanguages } = useTranslation();
  return { language, setLanguage, supportedLanguages };
};

/**
 * Standalone translation function for use outside React components
 * Uses default language - for use in utilities, constants, etc.
 */
export const translate = (key: string, params?: InterpolationParams): string => {
  const translation = getNestedValue(translations[defaultLanguage], key);
  
  if (translation === undefined) {
    return key;
  }
  
  return interpolate(translation, params);
};

/**
 * Format number according to locale
 */
export const formatNumber = (value: number, language: SupportedLanguage = defaultLanguage): string => {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
  };
  
  try {
    return new Intl.NumberFormat(localeMap[language]).format(value);
  } catch {
    return value.toString();
  }
};

/**
 * Format currency according to locale
 */
export const formatCurrency = (
  value: number, 
  language: SupportedLanguage = defaultLanguage,
  currency: string = 'INR'
): string => {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
  };
  
  try {
    return new Intl.NumberFormat(localeMap[language], {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `₹${value}`;
  }
};

/**
 * Format date according to locale
 */
export const formatDate = (
  date: Date | string,
  language: SupportedLanguage = defaultLanguage,
  options?: Intl.DateTimeFormatOptions
): string => {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
  };
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(localeMap[language], defaultOptions).format(dateObj);
  } catch {
    return dateObj.toLocaleDateString();
  }
};

export default I18nProvider;
