import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getQuote, buildTx, getSuiClient } from "@7kprotocol/sdk-ts";

const YOUR_WALLET_ADDRESS = "<YOUR_WALLET>";
const YOUR_SEEDPHASE = "<YOUR_SEEDPHASE>";

async function main() {
  try {
    const quoteResponse = await getQuote({
      tokenIn: "0x2::sui::SUI", // SUI
      tokenOut:
        "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", // USDC
      amountIn: "1000000000", // 1 SUI
    });

    console.log("quoteResponse", quoteResponse);

    const { tx } = await buildTx({
      quoteResponse,
      accountAddress: YOUR_WALLET_ADDRESS,
      slippage: 0.01,
      commission: {
        partner: YOUR_WALLET_ADDRESS,
        commissionBps: 0,
      },
    });

    // sign the transaction
    const client = getSuiClient();
    const keyPair = Ed25519Keypair.deriveKeypair(YOUR_SEEDPHASE);
    const sender = keyPair.getPublicKey().toSuiAddress();
    tx.setSender(sender);
    tx.setGasBudget(10000000);
    const bytes = await tx.build({
      client,
    });
    const serializedSignature = (await keyPair.signTransaction(bytes))
      .signature;

    // verify the signature locally
    const verifySignature = await keyPair
      .getPublicKey()
      .verifyTransaction(bytes, serializedSignature);
    if (!verifySignature) {
      throw new Error("Invalid signature");
    }

    // execute transaction
    const res = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: serializedSignature,
    });

    console.log("res", res);
  } catch (error) {
    console.error("Error: ", error);
  }
}

main();
