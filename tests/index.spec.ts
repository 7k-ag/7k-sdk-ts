import { assert } from "chai";
import "mocha";

import npmPackage from "../src/index";

describe("NPM Package", () => {
  it("should be an object", () => {
    assert.isObject(npmPackage);
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
