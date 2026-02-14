/**
 * Translation Files Index
 */

export { en, type TranslationKeys } from './en';
export { hi } from './hi';

import { en } from './en';
import { hi } from './hi';

export const translations = {
  en,
  hi,
} as const;

export type SupportedLanguage = keyof typeof translations;

export const supportedLanguages: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

export const defaultLanguage: SupportedLanguage = 'en';
