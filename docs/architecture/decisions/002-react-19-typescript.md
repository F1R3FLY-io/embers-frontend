# ADR-002: React 19 with TypeScript Frontend Stack

## Status
Accepted

## Context
We need to select a frontend technology stack for the Embers Platform that supports modern development practices, provides excellent developer experience, and can handle complex blockchain interactions with type safety.

## Decision
We will use React 19 with TypeScript, Vite as the build tool, and SCSS Modules for styling.

## Rationale

### React 19 Benefits
1. **Concurrent Features**: Built-in support for concurrent rendering and automatic batching
2. **Server Components**: Future-ready for potential SSR implementation
3. **React Compiler**: Automatic optimization without manual memoization
4. **Improved Hooks**: Enhanced useEffect and new hooks like useOptimistic
5. **Community Support**: Largest ecosystem and community in frontend development

### TypeScript Benefits
1. **Type Safety**: Compile-time error detection for blockchain address validation, amount calculations
2. **Developer Experience**: IntelliSense, refactoring support, and documentation through types
3. **API Integration**: Strong typing for auto-generated API clients from OpenAPI schema
4. **Error Prevention**: Prevents common runtime errors in financial calculations
5. **Team Collaboration**: Self-documenting code with interface definitions

### Vite Build Tool
1. **Fast Development**: Hot module replacement with instant updates
2. **Modern Defaults**: ES modules, optimized builds, code splitting
3. **Plugin Ecosystem**: Rich plugin system for TypeScript, React, and CSS processing
4. **Production Optimization**: Tree shaking and minimal bundle sizes
5. **TypeScript Integration**: First-class TypeScript support without configuration

### SCSS Modules
1. **Scoped Styles**: Automatic CSS class scoping prevents style conflicts
2. **TypeScript Integration**: Generated type definitions for CSS classes
3. **SCSS Features**: Variables, mixins, and functions for maintainable styles
4. **Component Isolation**: Styles are co-located with components
5. **Build Integration**: Seamless integration with Vite build process

## Implementation

### Package Dependencies
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.7.1",
    "@tanstack/react-query": "^5.83.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.9",
    "@types/react-dom": "^19.1.7",
    "@vitejs/plugin-react": "^4.7.0",
    "typescript": "~5.8.3",
    "vite": "^7.0.6",
    "sass-embedded": "^1.89.2",
    "vite-plugin-sass-dts": "^1.3.31"
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [
    react(),
    sassDts({
      enabledMode: ['development', 'production'],
      global: {
        generate: true,
        outputFilePath: path.resolve(__dirname, './src/global.scss.d.ts')
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

## Component Architecture

### Component Structure
```typescript
// Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick 
}: ButtonProps) {
  return (
    <button 
      className={classNames(styles.button, styles[variant], styles[size])}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### SCSS Module Structure
```scss
// Button/Button.module.scss
.button {
  font-family: 'Manrope', sans-serif;
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  
  &.primary {
    background-color: #2563eb;
    color: white;
    
    &:hover {
      background-color: #1d4ed8;
    }
  }
  
  &.sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}
```

## State Management Strategy

### React Query for Server State
```typescript
// queries/ai-agents/queries.ts
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agent: CreateAgentRequest) => apiClient.createAgent(agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}
```

### Context for Global State
```typescript
// providers/wallet/WalletProvider.tsx
interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
```

## Consequences

### Positive
- **Type Safety**: Compile-time error detection prevents runtime errors in financial operations
- **Developer Productivity**: Excellent tooling and development experience
- **Performance**: React 19 optimizations and Vite's fast builds
- **Maintainability**: Strong typing and modular CSS improve code quality
- **Future-Proof**: Latest versions with long-term support and migration paths

### Negative
- **Learning Curve**: Team needs familiarity with React 19 features and TypeScript
- **Build Complexity**: Additional configuration for TypeScript and SCSS modules
- **Bundle Size**: React and TypeScript add to the initial bundle size

### Mitigation Strategies
1. **Training**: Team onboarding for React 19 and TypeScript best practices
2. **Documentation**: Clear examples and patterns for component development
3. **Code Splitting**: Dynamic imports and route-based splitting for performance
4. **Type Utilities**: Shared type definitions and utility functions

## Alternatives Considered

### Vue.js with TypeScript
- **Pros**: Excellent TypeScript integration, simpler learning curve
- **Cons**: Smaller ecosystem, less team expertise

### Svelte/SvelteKit
- **Pros**: Smaller bundle sizes, compile-time optimizations
- **Cons**: Smaller ecosystem, less mature TypeScript support

### Angular
- **Pros**: Full TypeScript framework, enterprise features
- **Cons**: Heavy framework, steeper learning curve, overkill for this project

### Plain JavaScript
- **Pros**: Simpler setup, faster initial development
- **Cons**: No type safety for blockchain operations, harder to maintain

## References
- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [CSS Modules Specification](https://github.com/css-modules/css-modules)