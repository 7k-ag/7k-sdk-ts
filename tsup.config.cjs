const { defineConfig } = require("tsup");

module.exports = defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: true,
  skipNodeModulesBundle: true,
  target: "es2020",
  external: [
    "@mysten/sui",
    "@pythnetwork/pyth-sui-js",
    "@bluefin-exchange/bluefin7k-aggregator-sdk",
    "@cetusprotocol/aggregator-sdk",
    "@flowx-finance/sdk",
  ],
});
