/**
 * User Preferences Context
 * Stores and manages user preferences (theme, language, etc.)
 */
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../config/env';

type ThemeMode = 'light' | 'dark' | 'system';

interface UserPreferences {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  defaultPageSize: number;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // in seconds
}

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notificationsEnabled: true,
  defaultPageSize: 20,
  autoRefreshEnabled: true,
  autoRefreshInterval: 300, // 5 minutes
};

const PREFERENCES_STORAGE_KEY = STORAGE_KEYS.THEME_PREFERENCE + '_all';

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * Load preferences from storage
   */
  const loadPreferences = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const stored = await storage.get<UserPreferences>(PREFERENCES_STORAGE_KEY);

      if (stored) {
        // Merge with defaults to ensure all keys exist
        setPreferences({
          ...defaultPreferences,
          ...stored,
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save preferences to storage
   */
  const savePreferences = async (newPreferences: UserPreferences): Promise<void> => {
    try {
      await storage.set(PREFERENCES_STORAGE_KEY, newPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  };

  /**
   * Update a single preference
   */
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  /**
   * Update multiple preferences at once
   */
  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<void> => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = async (): Promise<void> => {
    setPreferences(defaultPreferences);
    await savePreferences(defaultPreferences);
  };

  const value = useMemo(
    () => ({
      preferences,
      isLoading,
      updatePreference,
      updatePreferences,
      resetPreferences,
    }),
    [preferences, isLoading]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export type { UserPreferences, ThemeMode };
export default PreferencesProvider;
