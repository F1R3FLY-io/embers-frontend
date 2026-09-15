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
│   └── index.ts                # Re-export for clean imports
```

### Import/Export Patterns

```typescript
// Button/index.ts - Clean re-exports
export { default } from "./Button";
export type { ButtonProps } from "./Button";

// Component usage - clean imports
import Button from "@/components/Button";
import type { ButtonProps } from "@/components/Button";
```

### Path Alias Usage

```typescript
// Always use path aliases for internal imports
import Button from "@/components/Button";
import { useWallet } from "@/hooks/useWallet";
import { ApiClient } from "@/lib/api-client";

// External libraries first, then internal imports
import React from "react";
import { useQuery } from "@tanstack/react-query";
import Button from "@/components/Button";
```

## Component Definition Patterns

### Functional Component with TypeScript

```typescript
// Define props interface first
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

// Use default parameters for optional props where appropriate
export default function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  children,
  onClick,
  className,
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

### No Fixed Height Cap on Content of Unbounded Length

A `max-height` in pixels is only safe when the content it bounds has a knowable
maximum size. Applied to a list that grows with user data it silently hides whatever
does not fit, and the defect is invisible until the list crosses the threshold — so
it ships, passes review, and resurfaces later as "items are missing".

This happened. A 300px cap on the graph sidebar's agent panel, combined with
`overflow: hidden`, hid every agent past the sixth with no scrollbar to reach them.
The number of visible rows is `floor(300 / 48) = 6`, and there were six agents until
there were seven. See
[the post-mortem](../../post-mortems/AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md).

**Do not:**

```scss
/* The cap is a guess about how much content there will be. Content wins. */
.panel.open {
  max-height: 300px;
  overflow: hidden; /* worse: removes the scrollbar that would have saved it */
}
```

**Do** — let the element size to its content, and give an ancestor the overflow:

```scss
.panel.open.fit-content {
  max-height: none;
  overflow: visible;
}

.sidebar-body {
  flex: 1;
  overflow-y: auto; /* one scroll region, not one per panel */
}
```

`max-height: none` rather than a larger number is the point: the panel fits three
rows or ninety, and shrinks again when rows are removed, so no count is encoded
anywhere. `Accordion`'s `fitContent` prop is the sanctioned form of this — see
`src/lib/components/Accordion/Accordion.tsx`.

A fixed cap remains correct where a bounded, scrolling box is the intent — a log
panel, for instance. The distinction is whether the content's length is knowable in
advance, not whether the cap looks reasonable today.

Two consequences worth knowing. `overflow: hidden` on a capped element is what turns
an overflow into a dead end, so prefer `auto` even when you expect the content to
fit. And no unit test can catch clipping — jsdom has no layout engine, so
`scrollHeight` and `clientHeight` are both `0`. Fixtures should therefore exceed any
cap the component could plausibly have, and the visual check belongs in a browser.

#### When the container's size is genuinely fixed

Sometimes the container cannot size to its content: a dashboard card is a fixed
`height: 200px` because a grid of cards has to line up. The rule still applies, but
its remedy changes — bound the _content_ instead, in both directions:

```scss
/* The card is fixed at 200px and a name is user-supplied text of no fixed length.
   Clamping contains it; without this, a long name overflows the card and pushes the
   grid around it out of shape. */
.agent-name {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow-wrap: anywhere;
}
```

```ts
// src/lib/forms/nameField.ts — the other half, shared so the agent and team forms
// cannot drift apart.
export const NAME_MAX_LENGTH = 64;
export const nameField = () => z.string().nonempty().max(NAME_MAX_LENGTH);
```

**Both halves are required, and for different reasons.** Validation stops new names
from ever needing the clamp, but it cannot reach the ones already written: a record on
chain is immutable, and a wallet may hold names created before the bound existed. The
clamp cannot replace validation either, since it only hides the overflow and leaves a
name nobody can read in full. This is the same defect as the sidebar's, found by
re-running that defect's own pattern over the rest of the stylesheets — see
[§10.1](../../post-mortems/AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md#101-the-patterns-as-searches).

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
  const handleDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        onError("Some files were rejected due to invalid format or size");
        return;
      }

      onFileSelect(acceptedFiles);
    },
    [onFileSelect, onError],
  );

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
// tests/components/Button/Button.test.tsx
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
// tests/mocks/api-client.ts
export const mockApiClient = {
  getAgents: jest.fn(),
  createAgent: jest.fn(),
  deployAgent: jest.fn(),
};

// Test file
jest.mock("@/lib/api-client", () => mockApiClient);
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
