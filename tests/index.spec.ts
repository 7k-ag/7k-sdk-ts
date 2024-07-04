import "mocha";
import { assert } from "chai";

import npmPackage from "../src/index";

describe("NPM Package", () => {
  it("should be an object", () => {
    assert.isObject(npmPackage);
  });

  it("should have a buildTx property", () => {
    assert.property(npmPackage, "buildTx");
  });
});
