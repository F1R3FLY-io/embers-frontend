# API Specification - Embers Platform

## Overview

The Embers Platform API provides endpoints for AI agent management, wallet operations, and blockchain interactions. The API follows REST principles and uses JSON for data exchange.

## Base Configuration

- **Base URL**: `http://localhost:8080` (development)
- **Protocol**: HTTPS in production
- **Content Type**: `application/json`
- **Authentication**: Wallet-based signing

## API Client Generation

The client SDK is auto-generated from OpenAPI schema:

```bash
# Fetch latest schema from backend
curl -o embers-api-schema.json http://localhost:8080/swagger-ui/openapi.json

# Generate TypeScript client
docker run -v $PWD:/local openapitools/openapi-generator-cli generate \
  -i /local/embers-api-schema.json \
  -g typescript-fetch \
  -o /local/src/api-client \
  -c /local/openapitools.json
```

## Authentication

### Wallet Authentication
All protected endpoints require wallet signature authentication:

```typescript
// Client configuration
const apiClient = new APIClient({
  basePath: 'http://localhost:8080',
  headers: {
    'X-Wallet-Address': walletAddress,
    'X-Signature': messageSignature,
    'X-Timestamp': timestamp
  }
});
```

## AI Agents API

### Agent Management

#### Create Agent
```
POST /api/ai-agents/create/prepare
POST /api/ai-agents/create/send
```

**Prepare Request:**
```typescript
interface CreateAgentReq {
  name: string;
  description?: string;
  code: string;
  version?: string;
}
```

**Response:**
```typescript
interface CreateAgentResp {
  agentId: string;
  transactionData: SignedContract;
  estimatedGas: UInt64;
}
```

#### Get Agent
```
GET /api/ai-agents/{address}
GET /api/ai-agents/{address}/{id}
```

**Response:**
```typescript
interface Agent {
  id: string;
  address: string;
  name: string;
  description?: string;
  version: string;
  status: RequestStatus;
  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;
}
```

#### Save Agent
```
POST /api/ai-agents/{id}/save/prepare
POST /api/ai-agents/{id}/save/send
```

#### Deploy Agent
```
POST /api/ai-agents/{address}/{id}/{version}/deploy/prepare  
POST /api/ai-agents/{address}/{id}/{version}/deploy/send
```

**Deploy Response:**
```typescript
interface DeployAgentResp {
  contractAddress: string;
  transactionHash: string;
  deploymentStatus: RequestStatus;
  gasUsed: UInt64;
}
```

#### List Agent Versions
```
GET /api/ai-agents/{address}/{id}/versions
```

### Agent Testing

#### Create Test Wallet
```
POST /api/ai-agents/test/wallet
```

**Response:**
```typescript
interface CreateTestwalletResp {
  address: string;
  privateKey: string;
  balance: Amount;
}
```

#### Deploy Test Agent
```
POST /api/ai-agents/test/deploy/prepare
POST /api/ai-agents/test/deploy/send
```

## Wallets API

### Wallet Operations

#### Get Wallet State
```
GET /api/wallets/{address}/state
```

**Response:**
```typescript
interface WalletStateAndHistory {
  address: string;
  balance: Amount;
  nonce: UInt64;
  transactions: Transfer[];
  lastUpdate: UnixTimestamp;
}
```

#### Transfer Tokens
```
POST /api/wallets/transfer/prepare
POST /api/wallets/transfer/send
```

**Transfer Request:**
```typescript
interface TransferReq {
  recipientAddress: string;
  amount: Amount;
  description?: string;
}
```

**Transfer Response:**
```typescript
interface TransferResp {
  transactionHash: string;
  status: RequestStatus;
  gasUsed: UInt64;
  fee: Amount;
}
```

## Data Models

### Core Types

#### Address
```typescript
// Blockchain address with validation
class Address {
  static fromString(address: string): Address;
  toString(): string;
}
```

#### Amount  
```typescript
// Token amounts with decimal precision
class Amount {
  static tryFrom(value: number): Amount;
  toNumber(): number;
  toString(): string;
}
```

#### PrivateKey
```typescript
// Cryptographic private key management
class PrivateKey {
  static new(): PrivateKey;
  static fromString(key: string): PrivateKey;
  getPublicKey(): PublicKey;
  sign(message: Uint8Array): Uint8Array;
}
```

### Request/Response Types

#### Request Status
```typescript
enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

#### Transfer Record
```typescript
interface Transfer {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: Amount;
  description?: string;
  timestamp: UnixTimestamp;
  transactionHash: string;
  status: RequestStatus;
}
```

#### Signed Contract
```typescript
interface SignedContract {
  contractCode: string;
  signature: string;
  gasLimit: UInt64;
  gasPrice: UInt64;
}
```

## Error Handling

### Standard Error Response
```typescript
interface InternalError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: UnixTimestamp;
}
```

### Error Codes
- `INVALID_ADDRESS`: Malformed blockchain address
- `INSUFFICIENT_FUNDS`: Not enough balance for operation
- `INVALID_SIGNATURE`: Wallet signature verification failed
- `AGENT_NOT_FOUND`: Requested agent does not exist
- `DEPLOYMENT_FAILED`: Agent deployment transaction failed
- `NETWORK_ERROR`: Blockchain network connectivity issues

## Rate Limiting

- **Rate Limit**: 100 requests per minute per wallet address
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Timestamp when limit resets

## WebSocket Events (Future)

### Real-time Updates
```typescript
// Transaction status updates
interface TransactionUpdate {
  transactionHash: string;
  status: RequestStatus;
  confirmations: number;
}

// Agent deployment progress  
interface DeploymentProgress {
  agentId: string;
  stage: 'compiling' | 'deploying' | 'verifying' | 'completed';
  progress: number; // 0-100
}
```