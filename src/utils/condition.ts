export function assert(
  condition: any,
  message?: string | null,
): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
