/**
 * Components Index
 * Central export for all components
 */

// Common Components
export {
  Button,
  Input,
  Dropdown,
  DatePicker,
  Card,
  Loading,
  LoadingSpinner,
  Skeleton,
  SkeletonCard,
  EmptyState,
  ErrorMessage,
  Toast,
  ToastProvider,
  useToast,
  ConfirmDialog,
  SearchBar,
  Badge,
  GiftedBadge,
  NonGiftedBadge,
  AdminBadge,
  SuperadminBadge,
  ErrorBoundary,
  OptimizedList,
} from './Common';

export type { ButtonVariant, DropdownOption } from './Common';

// Layout Components
export { Header, Container, Section } from './Layout';

// Customer Components
export { CustomerCard, CustomerSearchBar, CustomerFilters } from './Customers';

// Gift Components
export { GiftCard, GiftList, GiftSummary } from './Gifts';

// Admin Components
export { AdminCard } from './Admins';

// Dropdown Components
export {
  StateDropdown,
  DistrictDropdown,
  CityDropdown,
  EventTypeDropdown,
  GiftTypeDropdown,
  InvitationStatusDropdown,
} from './Dropdowns';

// Notification Components
export { TodayEventsNotification } from './Notifications';
