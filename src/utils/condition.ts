export function assert(
  condition: boolean,
  message?: string | null,
): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
