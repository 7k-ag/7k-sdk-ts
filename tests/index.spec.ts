import "mocha";
import { assert } from "chai";

import npmPackage from "../src/index";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

describe("NPM Package", () => {
  it("should be an object", () => {
    assert.isObject(npmPackage);
  });

  // config
  it("should have a Config property", () => {
    assert.property(npmPackage, "Config");
  });

  // api key
  it("should be able to set and get api key", () => {
    npmPackage.Config.setApiKey("test_api_key");
    assert.equal(npmPackage.Config.getApiKey(), "test_api_key");
  });

  // sui client
  it("should be able to set and get sui client", () => {
    const suiClient = new SuiClient({
      url: getFullnodeUrl("mainnet"),
    });
    npmPackage.Config.setSuiClient(suiClient);
    assert.equal(npmPackage.Config.getSuiClient(), suiClient);
  });

  // prices
  it("should have a getTokenPrice property", () => {
    assert.property(npmPackage, "getTokenPrice");
  });

  it("should have a getTokenPrices property", () => {
    assert.property(npmPackage, "getTokenPrices");
  });

  it("should have a getSuiPrice property", () => {
    assert.property(npmPackage, "getSuiPrice");
  });

  // swap
  it("should have a getQuote property", () => {
    assert.property(npmPackage, "getQuote");
  });

  it("should have a estimateGasFee property", () => {
    assert.property(npmPackage, "estimateGasFee");
  });

  it("should have a buildTx property", () => {
    assert.property(npmPackage, "buildTx");
  });

  it("should have a getSwapHistory property", () => {
    assert.property(npmPackage, "getSwapHistory");
  });

  // limit order
  it("should have a placeLimitOrder property", () => {
    assert.property(npmPackage, "placeLimitOrder");
  });

  it("should have a getOpenLimitOrders property", () => {
    assert.property(npmPackage, "getOpenLimitOrders");
  });

  it("should have a cancelLimitOrder property", () => {
    assert.property(npmPackage, "cancelLimitOrder");
  });

  it("should have a claimExpiredLimitOrder property", () => {
    assert.property(npmPackage, "claimExpiredLimitOrder");
  });

  it("should have a getClosedLimitOrders property", () => {
    assert.property(npmPackage, "getClosedLimitOrders");
  });

  // dca
  it("should have a placeDcaOrder property", () => {
    assert.property(npmPackage, "placeDcaOrder");
  });

  it("should have a getOpenDcaOrders property", () => {
    assert.property(npmPackage, "getOpenDcaOrders");
  });

  it("should have a cancelDcaOrder property", () => {
    assert.property(npmPackage, "cancelDcaOrder");
  });

  it("should have a getClosedDcaOrders property", () => {
    assert.property(npmPackage, "getClosedDcaOrders");
  });

  it("should have a getDcaOrderExecutions property", () => {
    assert.property(npmPackage, "getDcaOrderExecutions");
  });
});
