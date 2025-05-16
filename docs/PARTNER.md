# Overview

The 7k protocol does not charge any commission fees on user transactions. But
partners can specify their own commission fees up to 500 bps (5%). If a partner
charges commission fees, the 7k protocol takes 20% of the fees charged. For
example, if a partner charges 0.1% commission fees, 0.02% of the fees will go to
7k and 0.08% will go to the partner.

From version `3.0.0`, the mechanism for handling partner commission fees has
been updated. Previously, fees were automatically transferred to your wallet
after each transaction. Now, fees are collected and stored in a Vault, and
integrators (partners) must manually withdraw their fees by calling the
`vault::claim_commission` function. This change reduces gas costs for end users
and provides greater flexibility in managing your fees. This document explains
the new fee withdrawal process, how to integrate it into your system, and the
benefits of the updated mechanism.

## Why the Change?

- Reduced Gas Costs: Storing fees in the `Vault` instead of transferring them
  directly reduces gas costs for users, making transactions more cost-efficient.
- Flexibility: You can choose when to withdraw fees, optimizing gas costs or
  batching multiple withdrawals for efficiency.
- Transparency: All fee withdrawal activities are recorded via events
  (Withdraw), ensuring easy tracking of your earnings.

## How It Works

### Fee Collection

- Partner can set their commission address and commission fee up to 5% (500
  basis points) using the `commission` params in the `buildTx` method.
  (**Important**: The commission address must be a valid Sui address and only
  this address can withdraw the fees.)
- Fees are stored in a `Vault` object within the partners table, linked to your
  partner address and the specific asset type (e.g., 0x2::sui::SUI).

### Fee Withdrawal

- Partner must call the `claim_commission` function in the `vault` module to
  withdraw accumulated fees.
- A `Withdraw` event is emitted to log the withdrawal, including the asset type,
  amount, and recipient address.

### Get all claimable fees

```typescript
const getAllClaimable = async (partner: string) => {
  const client = new SuiClient({
    url: getFullNodeUrl("mainnet"),
  });
  const handle = await client.getDynamicFieldObject({
    parentId: _7K_PARTNER_HANDLE,
    name: { type: "address", value: partner },
  });
  const handleId = (handle.data.content as any)?.fields.value.fields.id.id;
  if (!handleId) {
    return {};
  }
  const dynamic_fields: DynamicFieldInfo[] = [];
  let cursor: string | null = null;
  while (true) {
    const result = await client.getDynamicFields({
      parentId: handleId,
      cursor,
    });
    dynamic_fields.push(...result.data);
    if (result.hasNextPage) {
      cursor = result.nextCursor;
    } else {
      break;
    }
  }
  const map: Record<string, string> = {};
  const ids = dynamic_fields.map((b) => b.objectId);
  for (let i = 0; i < ids.length; i += 50) {
    const balances = await client.multiGetObjects({
      ids: ids.slice(i, i + 50),
      options: { showContent: true },
    });
    balances.map((b) => {
      if (b.data?.content && b.data.content.dataType === "moveObject") {
        let fields = b.data.content.fields as any;
        if (fields.value !== "0") {
          map[("0x" + fields.name.fields.name) as string] =
            fields.value as string;
        }
      }
    });
  }
  console.log("claimable tokens:", map);
  return map;
};
```

### Smart Contract Details

The claim_commission function is defined in the vault module as follows:

```move
public fun claim_commission<Asset>(
    self: &mut Vault,
    config: &Config,
    ctx: &mut TxContext,
): Coin<Asset>
```

Inputs

- self: The Vault object storing your fees.
- config: The Config object to verify the contract version.
- ctx: The transaction context, including your address as the sender.
- Asset: The asset type you wish to withdraw (e.g., 0x2::sui::SUI).

Output:

- Return `Coin<Asset>`.

Events

- `Withdraw`: Emitted with details of the withdrawal (coin type, amount,
  recipient).

```move
public struct Withdraw has copy, drop {
    coin_type: TypeName,
    amount: u64,
    recipient: address,
}
```

Errors

- `EInvalidVersion = 1000`: Triggered if the config version does not match the
  current contract version

### Package and Object IDs

- Package ID: 0xe8f996ea6ff38c557c253d3b93cfe2ebf393816487266786371aa4532a9229f2
- Config Object:
  0x47442a93f7727d188ba7cb71031170d1786af70013cb7ad5115f3fe877ff0c54
- Vault: 0x442ad50389ed5cda6f7a6f5a7ae6361a4c05ef1d9fb2e54fbba5a268d690bfe6
- Partner Handle:
  0x2648d9b734649ab50d3b0af3816bedca811b77a82b3214baf3524b2309d8f95c
