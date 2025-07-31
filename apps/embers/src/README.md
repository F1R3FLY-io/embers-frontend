# Frontend Application Source

## Overview

React 19 frontend application for the Embers Platform, providing user interface for AI agent management.

## Architecture Context

- **Layer:** Presentation Layer
- **Dependencies:** `embers-client-sdk`, external blockchain libraries
- **Dependents:** None (top-level application)

## Key Abstractions

### Primary Components

- **App.tsx** - Root application component with routing and providers
- **WalletProvider** - Global wallet state management and blockchain connectivity
- **ProtectedRoute** - Authentication wrapper for secure pages
- **Page Components** - Route-level components (Home, Login, Create, Edit)

### Design Patterns Used

- **Provider Pattern** - Context-based state management for wallet and query client
- **Protected Routes** - Authentication guards for sensitive operations
- **Component Composition** - Reusable UI components with consistent API
- **Hook Pattern** - Custom hooks for wallet operations and API interactions

## File Organization

```
src/
├── lib/
│   ├── components/         # Reusable UI components
│   ├── providers/          # Context providers for global state
│   └── queries/            # React Query hooks and API calls
├── pages/                  # Route-level page components
├── public/                 # Static assets (fonts, icons, images)
├── App.tsx                 # Root application component
├── main.tsx                # Application entry point
└── vite-env.d.ts           # Vite TypeScript definitions
```

## Important Implementation Details

### For LLM Context

**Coding Conventions:**

- All components use TypeScript with strict mode enabled
- SCSS modules for component-specific styling (`.module.scss`)
- Path aliases with `@/` prefix for clean imports
- Functional components with React hooks (no class components)

**Error Handling:**

- React Query handles API errors with automatic retries
- Component-level error boundaries for UI error recovery
- Form validation with real-time feedback
- Wallet errors displayed via toast notifications

**Testing Strategy:**

- Jest + React Testing Library for component tests
- Focus on user interactions rather than implementation details
- Mock wallet provider and API clients for isolated testing
- Test IDs for reliable element selection

**Performance Considerations:**

- React.memo() for expensive re-renders
- useMemo() and useCallback() for optimization
- Code splitting with React.lazy() for heavy components
- Bundle size monitoring with build analyzer

### Key Interfaces

**Wallet Context API:**

```typescript
interface WalletContextType {
  readonly privateKey: Uint8Array;
  readonly address: string;
  sendTokens: (
    to: string,
    amount: bigint,
    description?: string,
  ) => Promise<void>;
}
```

**Component Props Patterns:**

```typescript
// Standard component props interface
interface ComponentProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

### Configuration

**Environment Variables:**

- API endpoints configured via Vite environment variables
- Development vs production builds handled automatically
- Asset optimization and code splitting configured in `vite.config.ts`

**Build Configuration:**

- TypeScript strict mode with additional checks
- SCSS processing with CSS modules
- Hot module replacement for development
- Optimized production builds with tree shaking

## Common Tasks

### Adding New Page Component

1. Create component in `src/pages/ComponentName/`
2. Implement component with TypeScript interface
3. Create corresponding SCSS module
4. Add to component index exports
5. Add route to `App.tsx` routing configuration
6. Update navigation if needed
7. Add to protected routes if authentication required
8. Write unit tests in `tests/` directory

### Creating Reusable Component

1. Create directory in `src/lib/components/ComponentName/`
2. Implement component with TypeScript interface
3. Create corresponding SCSS module
4. Add to component index exports
5. Write unit tests in `tests/` directory

### Integrating New API Endpoint

1. Add React Query hook in `src/lib/queries/`
2. Import and use hook in relevant components
3. Handle loading, error, and success states
4. Add optimistic updates if appropriate

### Debugging Tips

**Common Issues:**

- **Wallet not connecting:** Check network settings
- **API calls failing:** Verify backend server is running on correct port
- **Styles not applying:** Ensure SCSS module imports are correct
- **TypeScript errors:** Run `pnpm typecheck` for detailed error information

**Useful Debugging Techniques:**

- React DevTools for component state inspection
- Network tab for API request debugging
- Console logging with structured data
- Wallet provider state logging in development mode

**Key Log Statements:**

- Wallet connection attempts and results
- API request/response cycles
- Form validation errors and successes
- Route navigation and authentication checks

## Related Documentation

- [User Stories](../../../docs/requirements/user-stories.md) - Requirements driving this implementation
- [Component Patterns](../../../docs/architecture/patterns/component-patterns.md) - Established development patterns

## Testing

**Unit Tests:** Located in component `tests/` directories

- Button, Text, WalletInput, and other UI components
- Page components with mocked dependencies
- Custom hooks with test utilities

**Integration Tests:** Planned for critical user flows

- Wallet connection and transaction workflows
- Agent creation and deployment processes
- Navigation and routing functionality

**Test Data:** Mock data and fixtures in `tests/mocks/`

- Agent mock data for development and testing
- Wallet state mocks for isolated testing
- API response mocks for error scenario testing

---

_Last Updated: 2025-01-30 - Added comprehensive LLM context and debugging guidance_
