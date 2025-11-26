// Polyfill for AbortSignal.any() for Bun compatibility
// This is needed because @pythnetwork/hermes-client uses AbortSignal.any()
// which is not available in Bun runtime
if (typeof AbortSignal !== "undefined" && !AbortSignal.any) {
  AbortSignal.any = function (signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signals.forEach((signal) => {
      if (signal.aborted) {
        abort();
      } else {
        signal.addEventListener("abort", abort, { once: true });
      }
    });
    return controller.signal;
  } as any;
}
