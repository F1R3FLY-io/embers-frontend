# Embers Platform Project Guidelines

## Project Context

- This is the Embers Platform - a blockchain-based AI agent deployment and management platform with integrated wallet functionality.
- This is a React 19 project using TypeScript, Vite, and SCSS Modules (monorepo structure with pnpm workspaces).
- The platform enables users to create, edit, and deploy AI agents to blockchain with secure wallet operations.
- **Monorepo Structure**: Root package.json defines workspaces: `["packages/*", "apps/*"]`
- The project consists of:
  - Frontend application (`apps/embers/`) - Main UI for agent management
  - Test UI application (`apps/test-ui/`) - Framework for testing and demo
  - TypeScript client SDK (`packages/client/`) - Wallet and agent deployment operations
  - Future library packages in `packages/` for shared functionality
- If the user does not provide enough information with their prompts, ask the user to clarify before executing the task. This should be included in all tasks including writing unit tests, scaffolding the project, as well as implementation of individual modules. In general, follow a test driven development approach whereby unit tests are developed in parallel with the individual components, and features.

## Commands

- Development: `pnpm dev` (automatically builds client SDK first, then starts frontend)
- Build: `pnpm build`
- Test: `pnpm test`
- Lint: `pnpm lint` (ESLint with TypeScript rules)
- Install dependencies: `pnpm install`
- DO NOT ever `git add`, `git rm` or `git commit, or git push` code. Allow the Claude user to always manually review git changes. `git mv` and `git push` are permitted and inform the developer.
- DO NOT ever remove tests from eslint or type checks.
- Run `pnpm test && pnpm build` to test code changes before proceeding to a prompt for more instructions or the next task.
- **Operating outside of local repository (with .git/ directory root)**: Not permitted and any file or other operations require user approval and notification

## Code Style

- **TypeScript**: Use TypeScript for all files. Enable `strictNullChecks`.
- Organize imports: React first, third-party libraries next, local imports last.
- **Component Structure**: Functional components with React hooks.
- **Naming**: PascalCase for components, camelCase for functions/variables.
- **Error Handling**: Log errors with proper context, avoid console.log in production.
- **CSS**: Use SCSS Modules for styling with proper responsive design.
- Follow existing component patterns with clear props interfaces.
- Follow existing error handling patterns with optional chaining and fallbacks.
- When adding source code or new files, enhance, update, and provide new unit tests using the existing testing patterns.
- If unused variables are required, deliberately prefix them with an \_, underscore and set eslint up appropriately.
- Maintain 90%+ test coverage target.
- DO NOT USE emoticons in documenation or the code base

## Best Practices

- Keep console logging to minimum, prefer `console.warn` or `console.error`
- Follow React 19 best practices with modern hooks patterns
- Use React Router v7 for routing
- Implement proper types for all components and functions
- Maintain responsive design across all components
- Test UI on mobile and desktop viewports
- Implement proper error boundaries
- Use dynamic imports for non-critical components (code splitting)
- Use TanStack Query for server state management
- Use React Context for local state management

## Testing Best Practices

- DO NOT use console.warn with expects in unit tests to check for component behavior
- Prefer these testing approaches instead:
  - Render components with Testing Library and check DOM updates/content
  - Use test-ids to identify rendered elements with screen.getByTestId()
  - Spy on component rendering using proper mocks
  - Use router mocks to verify navigation behavior directly
  - Test actual user interactions and their effects
  - Spy on fetch/API calls to verify data handling
  - Test history state changes directly
- Always mock external dependencies consistently
- Write tests that focus on behavior over implementation details
- Use await/waitFor for asynchronous operations
- Unit tests should not look for specific text when testing pages. Instead, they should be written to find the DOM structure, elements, and functional behavior. Ask the user to clarify how best to test components when uncertain.
- Create component stubs with data-testid attributes for complex child components

## Project Structure

- Keep the current project structure up to date in the [README.md](./README.md)
- When priming project context on start, read the [README.md](./README.md) as well.
- **Monorepo Structure**: Using pnpm workspaces with `packages/*` and `apps/*`
- **Documentation hierarchy**:
  - `docs/requirements/` - User stories, business requirements, acceptance criteria
  - `docs/specifications/` - Technical specifications and design documents
  - `docs/architecture/` - System design and architectural decisions
    - `docs/architecture/decisions/` - ADRs for architectural choices
    - `docs/architecture/diagrams/` - Visual system representations
    - `docs/architecture/patterns/` - Established patterns and conventions
- **Applications** in `apps/`:
  - `apps/embers/` - Main frontend application
  - `apps/test-ui/` - Test UI framework for demo/testing libraries
- **Packages** in `packages/`:
  - `packages/client/` - TypeScript SDK for wallet and AI agent operations
  - Future library packages follow structure: `src/`, `dist/`, `tests/`, package-specific configs

## Key Features

### Frontend Application (`apps/embers/`)

- **AI Agent Management**: Create, edit, and deploy AI agents to blockchain
- **Wallet Integration**: Secure wallet functionality with authentication
- **Protected Routes**: Authentication-gated access to sensitive operations
- **Modern UI**: React 19 with SCSS modules and responsive design

### Client SDK (`packages/client/`)

- **Wallet Operations**: Send tokens, check balances, manage wallet state
- **AI Agent Deployment**: Deploy and interact with AI agents on-chain
- **Cryptographic Security**: Built with Noble curves for secure key management
- **Type Safety**: Full TypeScript support with Zod validation

## Environment Variables

Required environment variables should be configured appropriately for the frontend and SDK:

- `VITE_API_URL`: Backend API endpoint
- `VITE_CHAIN_ID`: Blockchain network ID
- Additional environment variables as needed for API keys and service integrations

## Common Tasks

- If connected to a `mcp-shell-server` also known as just a "shell", run all shell commands through that mcp server. This approach will automatically restrict which commands can be run and properly configure the shell environment.
- Review `git history` to determine how code base evolved or history for particular files and functions.
- Check if the development server is running prior to using your MCP tools to check the website locally. Inform the user to start the server on their own to QA or view the site.
- Use documentation-first approach:
  - Start with `docs/requirements/` for business requirements and user stories
  - Review `docs/specifications/` for technical specifications
  - Check `docs/architecture/` for system design constraints and patterns
  - Reference directory-level READMEs for source code context

## Project Specifics

- **Authentication**: Wallet-based authentication for protected routes
- **Private Key Management**: Secure key generation and storage with Noble curves
- **Address Validation**: Cryptographic address verification
- **API Integration**: Auto-generated client from OpenAPI schema
- Observe the eslint rules when writing code
- Make use of browser tools if installed in MCP subsystem
- Follow type safety with Zod runtime validation

## Security Considerations

- **CSP Headers**: Content Security Policy implementation
- **Input Sanitization**: All user inputs properly sanitized
- **API Rate Limiting**: Implement rate limiting for API calls
- **HTTPS Only**: Force HTTPS in production
- Follow security best practices and never introduce code that exposes or logs secrets and keys
- Never commit secrets or keys to the repository

## Performance Optimization

- Target Lighthouse scores of 90+ for all metrics
- Use Vite's built-in optimization features
- Implement proper code splitting with dynamic imports
- Optimize for mobile and desktop viewports
- Use React 19's performance features effectively

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite, SCSS Modules
- **State Management**: TanStack Query, React Context
- **Routing**: React Router v7
- **Cryptography**: @noble/curves, js-sha3, blakejs
- **Testing**: Jest with React Testing Library
- **Build Tools**: Vite, pnpm workspaces
- **Linting**: ESLint, Prettier, Stylelint

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
