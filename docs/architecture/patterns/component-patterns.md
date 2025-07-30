# Component Patterns - Embers Platform

## Overview

This document outlines the established patterns and conventions for React components in the Embers Platform. These patterns ensure consistency, maintainability, and developer productivity across the codebase.

## File Organization Patterns

### Component Directory Structure
```
components/
├── Button/
│   ├── Button.tsx              # Main component implementation
│   ├── Button.module.scss      # Component-specific styles
│   ├── Button.module.scss.d.ts # Generated TypeScript definitions
│   └── index.ts               # Re-export for clean imports
```

### Import/Export Patterns
```typescript
// Button/index.ts - Clean re-exports
export { default } from './Button';
export type { ButtonProps } from './Button';

// Component usage - clean imports
import Button from '@/components/Button';
import type { ButtonProps } from '@/components/Button';
```

### Path Alias Usage
```typescript
// Always use path aliases for internal imports
import Button from '@/components/Button';
import { useWallet } from '@/hooks/useWallet';
import { ApiClient } from '@/lib/api-client';

// External libraries first, then internal imports
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/Button';
```

## Component Definition Patterns

### Functional Component with TypeScript
```typescript
// Define props interface first
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

// Use default parameters for optional props where appropriate
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className
}: ButtonProps) {
  // Component implementation
}
```

### Props Interface Conventions
```typescript
// Use descriptive names and document complex props
interface WalletInputProps {
  /** Current wallet address value */
  value: string;
  /** Callback when address changes */
  onChange: (address: string) => void;
  /** Callback when validation state changes */
  onValidation?: (isValid: boolean, error?: string) => void;
  /** Placeholder text for empty input */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Show dropdown with recent addresses */
  showRecentAddresses?: boolean;
}
```

## SCSS Module Patterns

### CSS Class Naming
```scss
// Use camelCase for CSS classes in modules
.button {
  // Base styles
  
  &.primary {
    // Variant styles
  }
  
  &.loading {
    // State styles
  }
  
  &:disabled {
    // Pseudo-class styles
  }
}

.iconButton {
  // Compound component names
}
```

### Responsive Design Pattern
```scss
.container {
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
  
  @media (min-width: 1024px) {
    padding: 3rem;
  }
}
```

### CSS Custom Properties for Theming
```scss
.button {
  background-color: var(--color-primary, #2563eb);
  color: var(--color-primary-text, white);
  
  &:hover {
    background-color: var(--color-primary-hover, #1d4ed8);
  }
}
```

## State Management Patterns

### Local State with useState
```typescript
function WalletInput({ value, onChange, onValidation }: WalletInputProps) {
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string>();
  
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    
    // Validate address format
    const validation = validateAddress(newValue);
    setIsValid(validation.isValid);
    setError(validation.error);
    
    // Notify parent of validation state
    onValidation?.(validation.isValid, validation.error);
  }, [onChange, onValidation]);
  
  return (
    // JSX implementation
  );
}
```

### Server State with React Query
```typescript
function AgentsList() {
  const { 
    data: agents, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return (
    <div>
      {agents?.map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
```

### Context for Global State
```typescript
// Create context with provider pattern
function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const connect = useCallback(async () => {
    // Connection logic
  }, []);
  
  const value = useMemo(() => ({
    address,
    isConnected,
    connect,
    disconnect: () => {
      setAddress(null);
      setIsConnected(false);
    }
  }), [address, isConnected, connect]);
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
```

## Event Handling Patterns

### Callback Props
```typescript
interface FilePickerProps {
  onFileSelect: (files: File[]) => void;
  onError: (error: string) => void;
  onProgress?: (progress: number) => void;
}

function FilePicker({ onFileSelect, onError, onProgress }: FilePickerProps) {
  const handleDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      onError('Some files were rejected due to invalid format or size');
      return;
    }
    
    onFileSelect(acceptedFiles);
  }, [onFileSelect, onError]);
  
  // Implementation with react-dropzone
}
```

### Form Handling
```typescript
function CreateAgentForm() {
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    code: '',
  });
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const validation = validateAgentData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Submit logic
    createAgent(formData);
  }, [formData]);
  
  const handleInputChange = useCallback((field: keyof CreateAgentRequest) => 
    (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    }, []);
    
  return (
    <form onSubmit={handleSubmit}>
      <TextInput 
        label="Agent Name"
        value={formData.name}
        onChange={handleInputChange('name')}
      />
      {/* More form fields */}
    </form>
  );
}
```

## Error Handling Patterns

### Error Boundaries
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}
```

### Async Error Handling
```typescript
function DeployAgentButton({ agentId }: { agentId: string }) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string>();
  
  const handleDeploy = useCallback(async () => {
    try {
      setIsDeploying(true);
      setError(undefined);
      
      await deployAgent(agentId);
      
      // Success feedback
      toast.success('Agent deployed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deployment failed';
      setError(errorMessage);
      
      // Error feedback
      toast.error(errorMessage);
    } finally {
      setIsDeploying(false);
    }
  }, [agentId]);
  
  return (
    <div>
      <Button 
        onClick={handleDeploy} 
        loading={isDeploying}
        disabled={isDeploying}
      >
        Deploy Agent
      </Button>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}
```

## Performance Patterns

### Memoization
```typescript
// Memoize expensive calculations
const ExpensiveComponent = memo(function ExpensiveComponent({ 
  data, 
  onSelect 
}: { 
  data: LargeDataSet[]; 
  onSelect: (item: LargeDataSet) => void; 
}) {
  const processedData = useMemo(() => {
    return data.map(item => expensiveProcessing(item));
  }, [data]);
  
  const handleSelect = useCallback((item: LargeDataSet) => {
    onSelect(item);
  }, [onSelect]);
  
  return (
    <div>
      {processedData.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onSelect={handleSelect} 
        />
      ))}
    </div>
  );
});
```

### Code Splitting
```typescript
// Lazy load heavy components
const AgentEditor = lazy(() => import('../AgentEditor/AgentEditor'));

function CreateAgentPage() {
  return (
    <div>
      <h1>Create Agent</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <AgentEditor />
      </Suspense>
    </div>
  );
}
```

## Testing Patterns

### Component Testing Setup
```typescript
// components/Button/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('loading');
  });
});
```

### Mock Patterns
```typescript
// __mocks__/api-client.ts
export const mockApiClient = {
  getAgents: jest.fn(),
  createAgent: jest.fn(),
  deployAgent: jest.fn(),
};

// Test file
jest.mock('@/lib/api-client', () => mockApiClient);
```

## Accessibility Patterns

### ARIA Labels and Descriptions
```typescript
function WalletInput({ value, error, ...props }: WalletInputProps) {
  const inputId = useId();
  const errorId = useId();
  
  return (
    <div>
      <label htmlFor={inputId}>Wallet Address</label>
      <input
        id={inputId}
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <div id={errorId} role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
}
```

### Keyboard Navigation
```typescript
function DropdownMenu({ isOpen, onClose }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Focus first menu item when opened
      const firstItem = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
      firstItem?.focus();
    }
  }, [isOpen]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        // Navigate to next item
        break;
      case 'ArrowUp':
        // Navigate to previous item
        break;
    }
  }, [onClose]);
  
  return (
    <div
      ref={menuRef}
      role="menu"
      onKeyDown={handleKeyDown}
      // Additional props
    >
      {/* Menu items */}
    </div>
  );
}
```