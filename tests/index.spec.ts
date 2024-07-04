import "mocha";
import { assert } from "chai";

import npmPackage from "../src/index";

describe("NPM Package", () => {
  it("should be an object", () => {
    assert.isObject(npmPackage);
  });

  it("should have a getSuiClient property", () => {
    assert.property(npmPackage, "getSuiClient");
  });

  it("should have a setSuiClient property", () => {
    assert.property(npmPackage, "setSuiClient");
  });

  it("should have a getQuote property", () => {
    assert.property(npmPackage, "getQuote");
  });

  it("should have a getSuiPrice property", () => {
    assert.property(npmPackage, "getSuiPrice");
  });

  it("should have a estimateGasFee property", () => {
    assert.property(npmPackage, "estimateGasFee");
  });

  it("should have a buildTx property", () => {
    assert.property(npmPackage, "buildTx");
  });
});
