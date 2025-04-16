# 7K TypeScript SDK

## Installation

```bash
npm i @7kprotocol/sdk-ts
```

## Usage

You can import the entire SDK as a module:

```typescript
import SevenK from "@7kprotocol/sdk-ts";
```

or import specific functions as needed:

```typescript
import { getQuote, buildTx } from "@7kprotocol/sdk-ts";
```

## Config

Configuration is optional, but if provided, it must be set before invoking any
SDK functions.

### Set API Key

If you’re calling our API from your server, contact us to request dedicated API
keys and minimize the risk of rate limiting.

```typescript
import { Config } from "@7kprotocol/sdk-ts";

Config.setApiKey("YOUR_API_KEY");
console.log("API key", Config.getApiKey());
```

### Set Sui Client

```typescript
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Config } from "@7kprotocol/sdk-ts";

const network = "mainnet";
const suiClient = new SuiClient({ url: getFullnodeUrl(network) });
Config.setSuiClient(suiClient);
console.log("Sui client", Config.getSuiClient());
```

Note: this package only supports **mainnet** for now.

## Swap

See [Swap](docs/SWAP.md).

## Limit Orders

See [Limit Orders](docs/LIMIT.md).

## DCA Orders

See [DCA Orders](docs/DCA.md).

## Prices

```typescript
import { getTokenPrice, getTokenPrices, getSuiPrice } from "@7kprotocol/sdk-ts";

const tokenPrice = await getTokenPrice(
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
);

const tokenPrices = await getTokenPrices([
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
]);

const suiPrice = await getSuiPrice();
```

## Miscellaneous

If you encounter issues when importing functions from this SDK in a Node.js
environment, refer to [src/examples/nodejs/](./src/examples/nodejs/) for
guidance.

## License

7K TypeScript SDK released under the MIT license. See the [LICENSE](./LICENSE)
file for details.
