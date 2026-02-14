/**
 * English Translations
 * Default language for the application
 */

export const en = {
  // Common
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    done: 'Done',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    retry: 'Retry',
    refresh: 'Refresh',
    close: 'Close',
    open: 'Open',
    add: 'Add',
    remove: 'Remove',
    select: 'Select',
    all: 'All',
    none: 'None',
    required: 'Required',
    optional: 'Optional',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
  },

  // Authentication
  auth: {
    login: 'Login',
    logout: 'Logout',
    mobileNumber: 'Mobile Number',
    password: 'Password',
    loginButton: 'Sign In',
    loggingIn: 'Signing In...',
    loginError: 'Invalid credentials. Please try again.',
    sessionExpired: 'Your session has expired. Please login again.',
    logoutConfirm: 'Are you sure you want to logout?',
    welcomeBack: 'Welcome back!',
  },

  // Onboarding
  onboarding: {
    skip: 'Skip',
    getStarted: 'Get Started',
    welcome: 'Welcome to Gifts Track',
    welcomeDesc: 'Your complete solution for managing customers and tracking gifts with ease.',
    customerManagement: 'Customer Management',
    customerManagementDesc: 'Add, edit, and organize customer information. Search and filter to find anyone instantly.',
    giftTracking: 'Smart Gift Tracking',
    giftTrackingDesc: 'Keep track of all gifts given to customers. Record values, types, and dates effortlessly.',
    stayConnected: 'Always Accessible',
    stayConnectedDesc: 'Access your data anytime, anywhere. Works seamlessly online and offline.',
  },

  // Navigation
  navigation: {
    customers: 'Customers',
    gifts: 'Gifts',
    admins: 'Admins',
    profile: 'Profile',
    settings: 'Settings',
  },

  // Customers
  customers: {
    title: 'Customers',
    addCustomer: 'Add Customer',
    editCustomer: 'Edit Customer',
    customerDetails: 'Customer Details',
    noCustomers: 'No customers found',
    noCustomersDesc: 'Add your first customer to get started.',
    searchPlaceholder: 'Search by name or mobile...',
    name: 'Name',
    mobile: 'Mobile Number',
    address: 'Address',
    state: 'State',
    district: 'District',
    city: 'City',
    eventType: 'Event Type',
    eventDate: 'Event Date',
    invitationStatus: 'Invitation Status',
    notes: 'Notes',
    deleteConfirm: 'Are you sure you want to delete this customer?',
    deleteSuccess: 'Customer deleted successfully',
    createSuccess: 'Customer created successfully',
    updateSuccess: 'Customer updated successfully',
    gifted: 'Gifted',
    notGifted: 'Not Gifted',
    totalGiftValue: 'Total Gift Value',
    callCustomer: 'Call Customer',
  },

  // Gifts
  gifts: {
    title: 'Gifts',
    addGift: 'Add Gift',
    editGift: 'Edit Gift',
    giftDetails: 'Gift Details',
    noGifts: 'No gifts recorded',
    noGiftsDesc: 'Add a gift for this customer.',
    giftType: 'Gift Type',
    giftValue: 'Gift Value',
    description: 'Description',
    deleteConfirm: 'Are you sure you want to delete this gift?',
    deleteSuccess: 'Gift deleted successfully',
    createSuccess: 'Gift created successfully',
    updateSuccess: 'Gift updated successfully',
    totalGifts: 'Total Gifts',
    totalValue: 'Total Value',
  },

  // Admins
  admins: {
    title: 'Admin Management',
    addAdmin: 'Add Admin',
    editAdmin: 'Edit Admin',
    adminDetails: 'Admin Details',
    noAdmins: 'No admins found',
    branch: 'Branch',
    place: 'Place',
    role: 'Role',
    deleteConfirm: 'Are you sure you want to delete this admin?',
    deleteSuccess: 'Admin deleted successfully',
    createSuccess: 'Admin created successfully',
    updateSuccess: 'Admin updated successfully',
    superadminOnly: 'Only superadmins can access this feature.',
  },

  // Profile
  profile: {
    title: 'Profile',
    personalInfo: 'Personal Information',
    preferences: 'Preferences',
    security: 'Security',
    about: 'About',
    version: 'Version',
    theme: 'Theme',
    language: 'Language',
    notifications: 'Notifications',
  },

  // Validation
  validation: {
    required: '{{field}} is required',
    invalidMobile: 'Please enter a valid 10-digit mobile number',
    invalidEmail: 'Please enter a valid email address',
    minLength: '{{field}} must be at least {{min}} characters',
    maxLength: '{{field}} must not exceed {{max}} characters',
    positiveNumber: '{{field}} must be a positive number',
    invalidDate: 'Please enter a valid date',
    passwordComplexity: 'Password must contain uppercase, lowercase, and number',
  },

  // Errors
  errors: {
    genericError: 'Something went wrong. Please try again.',
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested resource was not found.',
    validationError: 'Please check your input and try again.',
    timeout: 'Request timed out. Please try again.',
  },

  // Messages
  messages: {
    noData: 'No data available',
    pullToRefresh: 'Pull to refresh',
    loadingMore: 'Loading more...',
    endOfList: 'No more items',
    offlineMode: 'You are offline',
    backOnline: 'You are back online',
    changesSaved: 'Changes saved successfully',
    confirmDelete: 'This action cannot be undone.',
  },

  // Dates
  dates: {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    daysAgo: '{{count}} days ago',
    inDays: 'In {{count}} days',
  },

  // Filters
  filters: {
    title: 'Filters',
    applyFilters: 'Apply Filters',
    clearFilters: 'Clear Filters',
    dateRange: 'Date Range',
    from: 'From',
    to: 'To',
    status: 'Status',
  },
};

export type TranslationKeys = typeof en;
export default en;
