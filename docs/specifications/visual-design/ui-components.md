# UI Components Specification - Embers Platform

## Design System Overview

The Embers Platform uses a consistent design system built with React 19, SCSS Modules, and responsive design principles. All components follow accessibility guidelines and support both light and dark themes.

## Core Design Principles

### Visual Hierarchy
- **Primary Actions**: Bold, high-contrast buttons with clear CTAs
- **Secondary Actions**: Subtle styling that doesn't compete with primary actions  
- **Information Display**: Clean typography with proper spacing and grouping
- **Status Indicators**: Color-coded states with text alternatives for accessibility

### Color Palette
```scss
// Primary colors
$primary-blue: #2563eb;
$primary-blue-hover: #1d4ed8;
$primary-blue-active: #1e40af;

// Semantic colors
$success-green: #059669;
$warning-yellow: #d97706;
$error-red: #dc2626;
$info-blue: #0284c7;

// Neutral colors
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-500: #6b7280;
$gray-700: #374151;
$gray-900: #111827;
```

### Typography
```scss
// Font family
$font-family-primary: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

// Font weights
$font-weight-regular: 400;
$font-weight-medium: 500;  
$font-weight-semibold: 600;
$font-weight-bold: 700;
$font-weight-extrabold: 800;

// Font sizes
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px  
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
```

## Component Library

### Button Component

**Usage:** Primary and secondary actions throughout the application

**Variants:**
- `primary`: Main call-to-action buttons
- `secondary`: Alternative actions  
- `outline`: Subtle actions with border
- `ghost`: Minimal styling for tertiary actions
- `danger`: Destructive actions with warning styling

**Props Interface:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}
```

**SCSS Module:**
```scss
.button {
  font-family: $font-family-primary;
  font-weight: $font-weight-medium;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.loading {
    position: relative;
    color: transparent;
    
    &::after {
      content: '';
      position: absolute;
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

.primary {
  background-color: $primary-blue;
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: $primary-blue-hover;
  }
}

.secondary {
  background-color: $gray-100;
  color: $gray-700;
  border: 1px solid $gray-200;
  
  &:hover:not(:disabled) {
    background-color: $gray-200;
  }
}
```

### Text Component

**Usage:** Consistent typography across the application

**Variants:**
- `h1`, `h2`, `h3`, `h4`: Heading levels
- `body`: Standard body text
- `caption`: Small descriptive text
- `label`: Form labels and UI labels

**Props Interface:**
```typescript
interface TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  className?: string;
}
```

### WalletInput Component

**Usage:** Address input with validation and formatting

**Features:**
- Real-time address validation
- Copy/paste functionality
- QR code scanning (future)
- Recent addresses dropdown

**Props Interface:**
```typescript
interface WalletInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation: (isValid: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  showRecentAddresses?: boolean;
}
```

### FilePicker Component  

**Usage:** Code upload and file selection for AI agents

**Features:**
- Drag and drop support
- File type validation
- Size limits
- Preview functionality

**Props Interface:**
```typescript
interface FilePickerProps {
  accept?: string;
  maxSize?: number;  
  multiple?: boolean;
  onFileSelect: (files: File[]) => void;
  onError: (error: string) => void;
  children?: React.ReactNode;
}
```

### ContainerWithLogo Component

**Usage:** Layout wrapper with consistent branding

**Features:**
- Responsive layout
- Logo positioning
- Content centering
- Background variants

**Props Interface:**
```typescript
interface ContainerWithLogoProps {
  children: React.ReactNode;
  showLogo?: boolean;
  variant?: 'default' | 'centered' | 'split';
  className?: string;
}
```

## Layout Components

### Page Layouts

#### Home Page Layout
- Hero section with value proposition
- Feature overview cards
- Call-to-action buttons
- Navigation header

#### Dashboard Layout  
- Sidebar navigation
- Main content area
- Quick action toolbar
- Status indicators

#### Modal Layout
- Overlay background
- Centered content container  
- Header with title and close button
- Footer with actions

### Responsive Breakpoints
```scss
$breakpoint-sm: 640px;   // Mobile
$breakpoint-md: 768px;   // Tablet  
$breakpoint-lg: 1024px;  // Desktop
$breakpoint-xl: 1280px;  // Large desktop
```

## Form Components

### Input Validation States
- **Default**: Normal input state
- **Focus**: Active input with blue border
- **Valid**: Green accent with checkmark icon
- **Invalid**: Red accent with error message
- **Disabled**: Grayed out with cursor not-allowed

### Form Field Structure
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
}
```

## Status & Feedback Components

### Status Indicators
```typescript
type StatusType = 'pending' | 'processing' | 'completed' | 'failed';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}
```

### Loading States
- **Button Loading**: Spinner replaces button text
- **Page Loading**: Full-page spinner with branding
- **Section Loading**: Skeleton placeholders for content areas
- **Inline Loading**: Small spinners for dynamic content

### Toast Notifications
```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}
```

## Animation Guidelines

### Micro-interactions
- **Button Hover**: Scale 102% with smooth transition
- **Card Hover**: Subtle shadow elevation  
- **Input Focus**: Border color transition over 200ms
- **Loading States**: Rotating spinners and pulse animations

### Page Transitions
- **Route Changes**: Fade in/out with 300ms duration
- **Modal Open/Close**: Scale and opacity animations
- **Sidebar Toggle**: Slide animations with easing

### CSS Animations
```scss
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## Accessibility Standards

### Keyboard Navigation
- All interactive elements must be focusable
- Clear focus indicators with sufficient contrast
- Logical tab order throughout the application
- Skip links for main content areas

### Screen Reader Support
- Semantic HTML elements (button, nav, main, etc.)
- ARIA labels and descriptions where needed  
- Alt text for all images and icons
- Live regions for dynamic content updates

### Color Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Non-color indicators for status and errors
- High contrast mode support

## Mobile Responsiveness

### Touch Targets
- Minimum 44px touch target size
- Adequate spacing between interactive elements
- Swipe gestures for navigation where appropriate

### Mobile-Specific Components
- Bottom sheet modals for mobile
- Sticky action buttons
- Collapsible navigation
- Optimized form layouts