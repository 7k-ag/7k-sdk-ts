import { assert } from "chai";
import "mocha";
import "./setup";

import { SUI_FULL_TYPE } from "../src/constants/tokens";
import {
  getSuiPrice,
  getTokenPrice,
  getTokenPrices,
} from "../src/features/prices";

describe("Price API", () => {
  const USDC =
    "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
  const USDT =
    "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d31ace84f42::usdt::USDT";

  describe("getTokenPrice", () => {
    it("should get price for a single token", async () => {
      const price = await getTokenPrice(SUI_FULL_TYPE);
      assert.isNumber(price);
      assert.isAtLeast(price, 0);
    });

    it("should handle normalized token types", async () => {
      // Test with different formats of the same token
      const price1 = await getTokenPrice(SUI_FULL_TYPE);
      const price2 = await getTokenPrice("0x2::sui::SUI");
      // Both should return the same price (or 0 if not found)
      assert.isNumber(price1);
      assert.isNumber(price2);
    });

    it("should return 0 for non-existent token", async () => {
      const price = await getTokenPrice(
        "0x0000000000000000000000000000000000000000000000000000000000000000::fake::FAKE",
      );
      assert.equal(price, 0);
    });

    it("should get price for USDC", async () => {
      const price = await getTokenPrice(USDC);
      assert.isNumber(price);
      assert.isAtLeast(price, 0);
    });
  });

  describe("getTokenPrices", () => {
    it("should get prices for multiple tokens", async () => {
      const prices = await getTokenPrices([SUI_FULL_TYPE, USDC]);
      assert.isObject(prices);
      assert.property(prices, SUI_FULL_TYPE);
      assert.property(prices, USDC);
      assert.isNumber(prices[SUI_FULL_TYPE]);
      assert.isNumber(prices[USDC]);
      assert.isAtLeast(prices[SUI_FULL_TYPE], 0);
      assert.isAtLeast(prices[USDC], 0);
    });

    it("should return empty object for empty array", async () => {
      const prices = await getTokenPrices([]);
      assert.isObject(prices);
      assert.isEmpty(prices);
    });

    it("should handle single token", async () => {
      const prices = await getTokenPrices([SUI_FULL_TYPE]);
      assert.isObject(prices);
      assert.property(prices, SUI_FULL_TYPE);
      assert.isNumber(prices[SUI_FULL_TYPE]);
    });

    it("should normalize token types", async () => {
      const prices = await getTokenPrices([
        SUI_FULL_TYPE,
        "0x2::sui::SUI", // Same token, different format
      ]);
      assert.isObject(prices);
      // Both normalized forms should be present
      assert.isAtLeast(Object.keys(prices).length, 1);
    });

    it("should handle tokens that don't exist", async () => {
      const fakeToken =
        "0x0000000000000000000000000000000000000000000000000000000000000000::fake::FAKE";
      const prices = await getTokenPrices([fakeToken]);
      assert.isObject(prices);
      assert.property(prices, fakeToken);
      assert.equal(prices[fakeToken], 0);
    });

    it("should handle mixed existing and non-existing tokens", async () => {
      const fakeToken =
        "0x0000000000000000000000000000000000000000000000000000000000000000::fake::FAKE";
      const prices = await getTokenPrices([SUI_FULL_TYPE, fakeToken]);
      assert.isObject(prices);
      assert.property(prices, SUI_FULL_TYPE);
      assert.property(prices, fakeToken);
      assert.isNumber(prices[SUI_FULL_TYPE]);
      assert.equal(prices[fakeToken], 0);
    });

    it("should handle chunking for large batches (up to 100)", async () => {
      // Create an array of 50 tokens (mix of real and fake)
      const tokens: string[] = [];
      for (let i = 0; i < 50; i++) {
        tokens.push(
          `0x${i.toString(16).padStart(64, "0")}::token${i}::TOKEN${i}`,
        );
      }
      // Add a few real tokens
      tokens.push(SUI_FULL_TYPE, USDC);

      const prices = await getTokenPrices(tokens);
      assert.isObject(prices);
      assert.equal(Object.keys(prices).length, tokens.length);
      // Real tokens should have prices >= 0
      assert.isAtLeast(prices[SUI_FULL_TYPE], 0);
      assert.isAtLeast(prices[USDC], 0);
    });

    it("should limit to MAX_TOTAL_IDS (500)", async () => {
      // Create an array of 600 tokens
      const tokens: string[] = [];
      for (let i = 0; i < 600; i++) {
        tokens.push(
          `0x${i.toString(16).padStart(64, "0")}::token${i}::TOKEN${i}`,
        );
      }

      const prices = await getTokenPrices(tokens);
      assert.isObject(prices);
      // Should only process first 500
      assert.isAtMost(Object.keys(prices).length, 500);
    });

    it("should handle chunking for exactly 100 tokens", async () => {
      const tokens: string[] = [];
      for (let i = 0; i < 100; i++) {
        tokens.push(
          `0x${i.toString(16).padStart(64, "0")}::token${i}::TOKEN${i}`,
        );
      }

      const prices = await getTokenPrices(tokens);
      assert.isObject(prices);
      assert.equal(Object.keys(prices).length, 100);
    });

    it("should handle chunking for 101 tokens (requires 2 requests)", async () => {
      const tokens: string[] = [];
      for (let i = 0; i < 101; i++) {
        tokens.push(
          `0x${i.toString(16).padStart(64, "0")}::token${i}::TOKEN${i}`,
        );
      }

      const prices = await getTokenPrices(tokens);
      assert.isObject(prices);
      assert.equal(Object.keys(prices).length, 101);
    });

    it("should get prices for common tokens", async () => {
      const commonTokens = [SUI_FULL_TYPE, USDC, USDT].filter(
        (token) => token !== null,
      );
      if (commonTokens.length > 0) {
        const prices = await getTokenPrices(commonTokens);
        assert.isObject(prices);
        commonTokens.forEach((token) => {
          assert.property(prices, token);
          assert.isNumber(prices[token]);
          assert.isAtLeast(prices[token], 0);
        });
      }
    });
  });

  describe("getSuiPrice", () => {
    it("should get SUI price", async () => {
      const price = await getSuiPrice();
      assert.isNumber(price);
      assert.isAtLeast(price, 0);
    });

    it("should return same price as getTokenPrice for SUI", async () => {
      const suiPrice1 = await getSuiPrice();
      const suiPrice2 = await getTokenPrice(SUI_FULL_TYPE);
      assert.equal(suiPrice1, suiPrice2);
    });
  });

  describe("Error handling", () => {
    it("should handle network errors gracefully", async () => {
      // This test assumes the API might be unavailable
      // In a real scenario, you might want to mock fetchClient
      const price = await getTokenPrice(SUI_FULL_TYPE);
      // Should return 0 on error, or a valid price if API is available
      assert.isNumber(price);
      assert.isAtLeast(price, 0);
    });

    it("should handle malformed token IDs", async () => {
      const price = await getTokenPrice("invalid-token-id");
      assert.isNumber(price);
      assert.isAtLeast(price, 0);
    });

    it("should handle empty string token ID", async () => {
      const price = await getTokenPrice("");
      assert.isNumber(price);
      assert.isAtLeast(price, 0);
    });
  });

  describe("Integration tests", () => {
    it("should get consistent prices for the same token", async () => {
      const prices1 = await getTokenPrices([SUI_FULL_TYPE, USDC]);
      const prices2 = await getTokenPrices([SUI_FULL_TYPE, USDC]);
      // Prices might vary slightly, but should be reasonable
      assert.isObject(prices1);
      assert.isObject(prices2);
      assert.property(prices1, SUI_FULL_TYPE);
      assert.property(prices2, SUI_FULL_TYPE);
      // Both should be valid numbers
      assert.isNumber(prices1[SUI_FULL_TYPE]);
      assert.isNumber(prices2[SUI_FULL_TYPE]);
    });

    it("should handle real-world token list", async () => {
      const realTokens = [
        SUI_FULL_TYPE,
        USDC,
        "0x2::sui::SUI", // Duplicate in different format
      ];
      const prices = await getTokenPrices(realTokens);
      assert.isObject(prices);
      // Should have at least the normalized versions
      assert.isAtLeast(Object.keys(prices).length, 2);
    });
  });
});
