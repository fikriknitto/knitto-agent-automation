let chain: Promise<unknown> = Promise.resolve();

/** Run ADB commands one at a time to avoid pile-up under multi-tab SSE load. */
export function runSerial<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}
