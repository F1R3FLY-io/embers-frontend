# f1r3sky-client-sdk

A client SDK for interacting with the f1r3sky platform.

## Features
- Send assets between users
- Deploy AI agents

## Installation

```bash
npm install f1r3sky-client-sdk
```

Or, if using yarn:

```bash
yarn add f1r3sky-client-sdk
```

## Usage
### send money example
```typescript
// Initialize a new wallet with a private key
const privateKey = PrivateKey.new();
const client = new Wallet({
    host: 'http://localhost',
    port: 3100,
    privateKey: privateKey,
    headers: {} as HTTPHeaders
});

// Create a transfer
const recipientAddress = Address.fromString("1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3");
const transferAmount = Amount.tryFrom(1000);
const transferDescription = Description.tryFromString("This is a test transfer with a valid description.");

// Send the money
const result = client.sendMoney(recipientAddress, transferAmount, transferDescription);
```

### Get wallet state example
```typescript
// Initialize a new wallet with a private key
const privateKey = PrivateKey.new();
const client = new Wallet({
    host: 'http://localhost',
    port: 3100,
    privateKey: privateKey,
    headers: {} as HTTPHeaders
});

// Get the wallet state
const walletState = await client.getWalletState();
```

## Testing

To run tests:

```bash
npm test
```

Lint the code with:

```bash
npm run lint
```

## Contributing

1. Fork the repository.
2. Clone your fork:
    ```bash
    git clone https://github.com/your-username/f1r3sky-client-sdk.git
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Create a new branch for your feature or fix:
    ```bash
    git checkout -b feature/my-feature
    ```
5. Make your changes and commit:
    ```bash
    git add .
    git commit -m "Describe your changes"
    ```
6. Push your branch and open a pull request.

Please ensure your code passes all tests and follows the project's linting rules before submitting a PR.

## License

See [LICENSE](./LICENSE) for details.