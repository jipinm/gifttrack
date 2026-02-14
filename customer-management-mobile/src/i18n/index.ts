/**
 * i18n Module Index
 * Internationalization support for the app
 */

// Main provider and hooks
export {
  I18nProvider,
  useTranslation,
  useT,
  useLanguage,
  translate,
  formatNumber,
  formatCurrency,
  formatDate,
  type TranslationKey,
} from './I18nContext';

// Translations and types
export {
  translations,
  supportedLanguages,
  defaultLanguage,
  type SupportedLanguage,
  type TranslationKeys,
} from './translations';

// Re-export for convenience
export { en } from './translations/en';
export { hi } from './translations/hi';
