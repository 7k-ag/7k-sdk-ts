import { TransactionResult } from "@mysten/sui.js/transactions";
import { Unarray } from "./utilities";

export type TransactionResultItem = Unarray<TransactionResult>;
