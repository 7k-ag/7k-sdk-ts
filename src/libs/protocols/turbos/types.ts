export interface PoolFields {
  coin_a: string;
  coin_b: string;
  deploy_time_ms: string;
  fee: number;
  fee_growth_global_a: string;
  fee_growth_global_b: string;
  fee_protocol: number;
  id: { id: string };
  liquidity: string;
  max_liquidity_per_tick: string;
  protocol_fees_a: string;
  protocol_fees_b: string;
  reward_infos: {
    type: string;
    fields: {
      emissions_per_second: string;
      growth_global: string;
      id: {
        id: string;
      };
      manager: string;
      vault: string;
      vault_coin_type: string;
    };
  }[];
  reward_last_updated_time_ms: string;
  sqrt_price: string;
  tick_current_index: {
    type: string;
    fields: { bits: number };
  };
  tick_map: {
    type: string;
    fields: {
      id: { id: string };
      size: string;
    };
  };
  tick_spacing: number;
  unlocked: boolean;
}

export interface Pool extends PoolFields {
  objectId: string;
  type: string;
  types: PoolTypes;
}

export type PoolTypes = [string, string, string];
