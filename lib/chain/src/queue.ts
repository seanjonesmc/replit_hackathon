/**
 * Runs jobs one at a time in call order. A job resolves with a value for its
 * caller plus a `holdUntil` promise; the next job starts only once that
 * settles. The chain client holds the queue until each transaction is mined,
 * so every write is estimated and sent against its predecessors' effects.
 */
export class SerialQueue {
  #tail: Promise<void> = Promise.resolve();

  run<T>(job: () => Promise<{ value: T; holdUntil: Promise<unknown> }>): Promise<T> {
    const started = this.#tail.then(job);
    const ignore = () => undefined;
    this.#tail = started.then(({ holdUntil }) => holdUntil.then(ignore, ignore), ignore);
    return started.then(({ value }) => value);
  }
}
