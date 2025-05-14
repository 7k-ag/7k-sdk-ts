# BluefinX Protocol Integration

BluefinX is a decentralized exchange protocol integrated into the 7k Protocol
SDK. This document outlines how to use the BluefinX features for token swaps on
the Sui network.

## Overview

BluefinX provides Request For Quote service (RFQ) functionality for token swaps
with the following key features:

- RFQ-based trading system
- Sponsored transactions for gas-less swaps
- MEV protection

## Usage

### Basic Swap Example

```typescript
import { getQuote, buildTx, executeTx } from "@7kprotocol/sdk-ts";

// Example swap parameters
const swapParams = {
  amountIn: "10000000000", // Amount in base units (e.g., 10 SUI)
  tokenIn: "0x2::sui::SUI", // Input token type
  tokenOut: "0x...::usdc::USDC", // Output token type
  sources: ["bluefinx"], // Default sources do not include bluefinx, it must be explicitly specified
};

// Execute the swap
const quote = await getQuote(swapParams);
const { tx } = await buildTx({
  quoteResponse: quote,
  accountAddress: "0xSenderAddress",
  slippage: 0.01, // 1%
  commission: {
    partner: "<address to receive fee>",
    commissionBps: 0, // Ignore commission for BluefinX transaction
  },
});
const { signature, bytes } = await signTransaction({
  transaction: tx instanceof BluefinXTx ? tx.txBytes : tx,
});
const res = await executeTx(tx, signature, bytes);
```

### Transaction Flow

1. **Quote Generation**: The SDK first obtains a quote for the swap
2. **Transaction building and sponsorship**: The transaction is sponsored by
   BluefinX for gas-less execution
3. **User Signature**: User signs the sponsored transaction
4. **Execution**: The signed transaction is submitted and executed on-chain

## Important Notes

1. Default sources do not include BluefinX, it must be explicitly specified in
   the sources array on `getQuote` method
2. SDK provides `executeTx` method to execute both `BluefinXTx` and
   `Transaction`. If you need more control on the execution, use
   `executeBluefinTx` method
3. Always use the SDK's provided methods for executing BluefinX transactions
4. Quotes have an expiration time and must be executed before they expire
5. All amounts should be specified in base units (smallest denomination)
6. The protocol requires valid signatures for both the quote and the transaction
7. The commissionBps for BluefinX transaction always zero, regardless of the
   commissionBps specified on `buildTx` method

## Error Handling

The SDK will throw appropriate errors in the following cases:

- Invalid token types
- Insufficient balance
- Expired quotes
- Failed signature verification
- Network issues

For detailed error handling, wrap your calls in try-catch blocks and check the
response status.
