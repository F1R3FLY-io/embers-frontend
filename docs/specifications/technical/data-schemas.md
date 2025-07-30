# Data Schemas - Embers Platform

## Entity Validation Schemas

All data entities use Zod for runtime validation and type safety.

### Core Blockchain Entities

#### Address Schema
```typescript
import { z } from 'zod';

export const AddressSchema = z.object({
  value: z.string()
    .min(1, 'Address cannot be empty')
    .regex(/^[1-9A-HJ-NP-Za-km-z]{51,52}$/, 'Invalid address format')
    .refine((addr) => validateChecksum(addr), 'Invalid address checksum')
});

export type AddressType = z.infer<typeof AddressSchema>;
```

#### Amount Schema
```typescript
export const AmountSchema = z.object({
  value: z.bigint()
    .min(0n, 'Amount cannot be negative')
    .max(BigInt('18446744073709551615'), 'Amount exceeds maximum value'),
  decimals: z.number()
    .int()
    .min(0)
    .max(18)
    .default(18)
});

export type AmountType = z.infer<typeof AmountSchema>;
```

#### PrivateKey Schema
```typescript
export const PrivateKeySchema = z.object({
  bytes: z.instanceof(Uint8Array)
    .refine((key) => key.length === 32, 'Private key must be 32 bytes'),
  format: z.enum(['raw', 'hex', 'base58']).default('raw')
});

export type PrivateKeyType = z.infer<typeof PrivateKeySchema>;
```

#### PublicKey Schema
```typescript
export const PublicKeySchema = z.object({
  bytes: z.instanceof(Uint8Array)
    .refine((key) => key.length === 33 || key.length === 65, 'Invalid public key length'),
  compressed: z.boolean().default(true)
});

export type PublicKeyType = z.infer<typeof PublicKeySchema>;
```

### AI Agent Schemas

#### Agent Schema
```typescript
export const AgentSchema = z.object({
  id: z.string().uuid('Invalid agent ID format'),
  address: AddressSchema,
  name: z.string()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in agent name'),
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning')
    .default('1.0.0'),
  code: z.string()
    .min(1, 'Agent code is required')
    .max(100000, 'Agent code too large'),
  status: z.enum(['draft', 'validating', 'ready', 'deploying', 'deployed', 'failed']),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  deployedAt: z.number().int().positive().optional(),
  contractAddress: AddressSchema.optional()
});

export type AgentType = z.infer<typeof AgentSchema>;
```

#### Agent Header Schema
```typescript
export const AgentHeaderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: z.enum(['draft', 'ready', 'deployed', 'failed']),
  lastModified: z.number().int().positive()
});

export type AgentHeaderType = z.infer<typeof AgentHeaderSchema>;
```

### Wallet Transaction Schemas

#### Transfer Schema
```typescript
export const TransferSchema = z.object({
  id: z.string().uuid(),
  fromAddress: AddressSchema,
  toAddress: AddressSchema,
  amount: AmountSchema,
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  transactionHash: z.string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash format'),
  blockNumber: z.number().int().positive().optional(),
  timestamp: z.number().int().positive(),
  status: z.enum(['pending', 'confirmed', 'failed']),
  gasUsed: z.bigint().min(0n).optional(),
  gasPrice: z.bigint().min(0n).optional(),
  fee: AmountSchema.optional()
});

export type TransferType = z.infer<typeof TransferSchema>;
```

#### Wallet State Schema
```typescript
export const WalletStateSchema = z.object({
  address: AddressSchema,
  balance: AmountSchema,
  nonce: z.bigint().min(0n),
  lastUpdate: z.number().int().positive(),
  isActive: z.boolean().default(true)
});

export type WalletStateType = z.infer<typeof WalletStateSchema>;
```

### API Request/Response Schemas

#### Create Agent Request
```typescript
export const CreateAgentRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  code: z.string().min(1).max(100000),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional()
});

export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;
```

#### Transfer Request
```typescript
export const TransferRequestSchema = z.object({
  recipientAddress: z.string()
    .min(1, 'Recipient address is required')
    .refine((addr) => AddressSchema.safeParse({ value: addr }).success, 
             'Invalid recipient address'),
  amount: z.number()
    .positive('Amount must be positive')
    .max(Number.MAX_SAFE_INTEGER, 'Amount too large'),
  description: z.string().max(500).optional()
});

export type TransferRequest = z.infer<typeof TransferRequestSchema>;
```

#### Deployment Request
```typescript
export const DeploymentRequestSchema = z.object({
  agentId: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  gasLimit: z.bigint().min(21000n).max(10000000n),
  gasPrice: z.bigint().min(1n),
  maxFee: AmountSchema.optional()
});

export type DeploymentRequest = z.infer<typeof DeploymentRequestSchema>;
```

### Error Response Schema

```typescript
export const ErrorResponseSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.record(z.any()).optional(),
  timestamp: z.number().int().positive(),
  requestId: z.string().uuid().optional()
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```

### Utility Schemas

#### Pagination Schema
```typescript
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0)
});

export type PaginationType = z.infer<typeof PaginationSchema>;
```

#### Filter Schema
```typescript
export const FilterSchema = z.object({
  startDate: z.number().int().positive().optional(),
  endDate: z.number().int().positive().optional(),
  status: z.array(z.string()).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional()
});

export type FilterType = z.infer<typeof FilterSchema>;
```

## Schema Validation Utilities

### Custom Validators
```typescript
// Address checksum validation
export function validateChecksum(address: string): boolean {
  // Implementation using Blake2b hashing
  const decoded = base58Decode(address);
  const payload = decoded.slice(0, -4);
  const checksum = decoded.slice(-4);
  const calculatedChecksum = blake2b(payload, 4);
  return Buffer.compare(checksum, calculatedChecksum) === 0;
}

// Transaction hash validation
export function validateTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

// Semantic version validation  
export function validateSemanticVersion(version: string): boolean {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}
```

### Schema Composition
```typescript
// Combine schemas for complex validation
export const CreateAgentWithValidationSchema = CreateAgentRequestSchema
  .extend({
    code: z.string()
      .refine(validateAgentCode, 'Invalid agent code syntax')
      .refine(checkSecurityConstraints, 'Agent code fails security checks')
  });

// Dynamic schema based on user permissions
export function getAgentSchemaForUser(userRole: string) {
  const baseSchema = AgentSchema;
  
  if (userRole === 'admin') {
    return baseSchema.extend({
      systemFlags: z.array(z.string()).optional()
    });
  }
  
  return baseSchema.omit({ contractAddress: true });
}
```

## Database Schema Mappings

### Entity Relationships
```typescript
// Agent -> User relationship
export const AgentWithOwnerSchema = AgentSchema.extend({
  ownerId: z.string().uuid(),
  ownerAddress: AddressSchema,
  permissions: z.array(z.enum(['read', 'write', 'deploy', 'delete']))
});

// Transfer -> Wallet relationship
export const TransferWithWalletSchema = TransferSchema.extend({
  fromWallet: WalletStateSchema,
  toWallet: WalletStateSchema.optional()
});
```