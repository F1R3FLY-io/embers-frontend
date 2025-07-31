# Client SDK Source

## Overview

TypeScript SDK for blockchain wallet operations and AI agent deployment on the Embers Platform. Provides type-safe interfaces for all blockchain interactions with built-in validation and error handling.

## Architecture Context

- **Layer:** Data Access/Integration Layer
- **Dependencies:** Cryptographic libraries (@noble/curves, js-sha3, blakejs), Zod validation
- **Dependents:** Frontend application (`apps/embers/`), external integrators

## Key Abstractions

### Primary Classes/Modules

- **Wallet** - Main client class for blockchain operations and API interactions
- **Address** - Blockchain address validation and formatting
- **Amount** - Secure token amount handling with decimal precision
- **PrivateKey/PublicKey** - Cryptographic key management and operations
- **API Client** - Auto-generated client for backend service integration

### Design Patterns Used

- **Builder Pattern** - Fluent API for wallet and transaction construction
- **Factory Pattern** - Address and key creation with validation
- **Strategy Pattern** - Different serialization formats for keys and amounts
- **Error Handling** - Result pattern with typed errors for safe operation handling

## File Organization

```
src/
├── api-client/              # Auto-generated API client from OpenAPI
│   ├── apis/               # API endpoint interfaces (AIAgentsApi, WalletsApi)
│   ├── models/             # TypeScript models for API data
│   └── runtime.ts          # HTTP client configuration and utilities
├── entities/               # Core blockchain entity classes
│   ├── Address.ts          # Blockchain address validation and operations
│   ├── Amount.ts           # Token amount handling with precision
│   ├── PrivateKey.ts       # Private key generation and cryptographic operations
│   ├── PublicKey.ts        # Public key derivation and verification
│   └── Wallet.ts           # Main wallet class for user operations
├── functions.ts            # High-level utility functions
├── serialization.ts        # Data serialization utilities
└── index.ts               # Public API exports
```

## Features

- Send assets between users
- Deploy AI agents

## Installation

Or, if using yarn:

## Usage

### send tokens example

```typescript
// Initialize a new wallet with a private key
const privateKey = PrivateKey.new();
const client = new Wallet({
  host: "http://localhost",
  port: 3100,
  privateKey: privateKey,
  headers: {} as HTTPHeaders,
});

// Create a transfer
const recipientAddress = Address.fromString(
  "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
);
const transferAmount = Amount.tryFrom(1000);
const transferDescription = Description.tryFromString(
  "This is a test transfer with a valid description.",
);

// Send the tokens
const result = client.sendTokens(
  recipientAddress,
  transferAmount,
  transferDescription,
);
```

### Get wallet state example

```typescript
// Initialize a new wallet with a private key
const privateKey = PrivateKey.new();
const client = new Wallet({
  host: "http://localhost",
  port: 3100,
  privateKey: privateKey,
  headers: {} as HTTPHeaders,
});

// Get the wallet state
const walletState = await client.getWalletState();
```

## Testing

To run tests:

```bash
pnpm test
```

Lint the code with:

```bash
pnpm run lint
```

## Contributing

1. Fork the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/my-feature
   ```
4. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Describe your changes"
   ```
5. Push your branch and open a pull request.

Please ensure your code passes all tests and follows the project's linting rules before submitting a PR.

## License

UNLICENSED

## Important Implementation Details

### For LLM Context

**Coding Conventions:**

- All entities use static factory methods for creation with validation
- Zod schemas for runtime type validation and parsing
- Immutable data structures where possible
- Comprehensive error handling with typed error objects
- Cryptographic operations use audited libraries only

**Error Handling:**

- Custom error classes for different failure modes
- Result types for operations that can fail
- Validation errors include detailed context
- Network errors have retry metadata
- Cryptographic errors are never swallowed

**Testing Strategy:**

- Unit tests for each entity with edge cases
- Mock API server using Counterfact for integration tests
- Property-based testing for cryptographic operations
- Test vectors from blockchain specifications

**Performance Considerations:**

- Lazy loading of cryptographic operations
- Caching of derived keys and addresses
- Efficient serialization for large data sets
- Memory-safe handling of private key material

### Configuration

**Build Configuration:**

- Vite for bundling with UMD, ESM, and CJS outputs
- TypeScript with strict mode and declaration generation
- Jest for testing with Node.js environment
- TSDoc for comprehensive API documentation

**API Client Generation:**

```bash
# Fetch OpenAPI schema from backend
curl -o embers-api-schema.json http://localhost:8080/swagger-ui/openapi.json

# Generate TypeScript client
docker run -v $PWD:/local openapitools/openapi-generator-cli generate \
  -i /local/embers-api-schema.json \
  -g typescript-fetch \
  -o /local/src/api-client
```

## Common Tasks

### Adding New Entity Type

1. Create entity class in `src/entities/NewEntity.ts`
2. Implement static factory methods with validation
3. Add Zod schema for runtime validation if needed
4. Export from `src/index.ts`
5. Write comprehensive unit tests

### Extending API Integration

1. Update OpenAPI schema from backend
2. Regenerate API client using Docker command
3. Add high-level wrapper functions in appropriate entity
4. Update integration tests with new endpoints

### Adding Cryptographic Operations

1. Research established implementations and standards
2. Use audited libraries (@noble/curves, @scure/base)
3. Add comprehensive test vectors
4. Document security considerations and assumptions

### Debugging Tips

**Common Issues:**

- **Address validation failing:** Check address format and checksum calculation
- **Amount precision errors:** Verify decimal handling and BigInt operations
- **API authentication errors:** Validate wallet signature and timestamp
- **Serialization mismatches:** Ensure consistent encoding between client and server

**Useful Debugging Techniques:**

- Use hex encoding for inspecting binary data
- Test against known good test vectors from blockchain specs
- Validate API requests with curl before implementing in SDK

**Key Log Statements:**

- Private key generation and derivation processes
- API request/response payloads (excluding sensitive data)
- Address validation results and error details
- Transaction signing and verification steps

## Related Documentation

- [Business Requirements](../../docs/requirements/business-requirements.md) - SDK requirements and use cases

## Testing

**Unit Tests:** Located in `tests/` directory

- `Address.test.ts` - Address validation and formatting
- `Amount.test.ts` - Token amount operations and precision
- `PrivateKey.test.ts` - Key generation and cryptographic operations
- `PublicKey.test.ts` - Key derivation and validation
- `transferTokens.test.ts` - End-to-end transfer operations

**Integration Tests:** Using Counterfact mock server

- API client integration with mocked responses
- Error handling for network failures
- Authentication and signature validation
- Rate limiting and retry logic

**Test Data:** Mock data in `mocks/` directory

- API response fixtures for all endpoints
- Test vectors for cryptographic operations
- Error response examples for failure scenarios

**Running Tests:**

```bash
# Run all tests with coverage
pnpm test

# Run tests with mock API server
pnpm test

# Generate and serve documentation
pnpm docs
```

## Security Considerations

**Private Key Handling:**

- Keys never leave client-side memory
- Secure random generation using Web Crypto API
- Memory is cleared after cryptographic operations
- No logging or serialization of private key material

**Address Validation:**

- Comprehensive checksum validation prevents typos
- Format validation ensures blockchain compatibility
- Test vectors from official blockchain specifications
- Protection against address format attacks

**Amount Handling:**

- BigInt arithmetic prevents floating-point precision errors
- Overflow protection for large token amounts
- Validation of decimal precision limits
- Protection against integer overflow attacks

---

_Last Updated: 2025-01-30 - Added security considerations and comprehensive debugging guidance_
