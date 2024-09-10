import { defineComponent, provide, inject, ref, useAttrs } from "vue";

function createSlotsProxy(propsProxy: any, slots: any) {
  let getSlots: any;

  if (Object.keys(slots).length === 1) {
    getSlots = () => slots.default();
  } else {
    const slotsGetters = {};

    for (const key in slots) {
      Object.defineProperty(slotsGetters, key, {
        get() {
          return slots[key]();
        },
      });
    }

    getSlots = () => slotsGetters;
  }

  return new Proxy(propsProxy, {
    get(target, p) {
      if (p === "slots") {
        return getSlots();
      }

      return target[p];
    },
  });
}

export function createComponent(template: () => any): () => any;
export function createComponent<P extends Record<string, any>>(
  template: (props: P) => any
): (props: P) => any;
export function createComponent<S>(
  setup: () => S,
  template: (state: S) => any
): (props: Record<string, never>) => any;
export function createComponent<
  SP extends Record<string, any>,
  P extends Record<string, any>,
  S
>(
  setup: (props: SP) => S,
  template: (state: S, props: P) => any
): (props: SP & P) => any;
export function createComponent(...args: any[]): any {
  if (args.length === 1) {
    return defineComponent({
      inheritAttrs: false,
      name: args[0].name,
      setup(_, context) {
        return args[0].bind(null, createSlotsProxy(useAttrs(), context.slots));
      },
    });
  }

  if (args.length === 2) {
    return defineComponent({
      name: args[1].name,
      inheritAttrs: false,
      setup(_, context) {
        const propsSlotsProxy = createSlotsProxy(useAttrs(), context.slots);
        const state = args[0](propsSlotsProxy);

        return args[1].bind(null, state, propsSlotsProxy);
      },
    });
  }

  throw new Error("Invalid definition");
}

export function createProvider<S extends Record<string, any>>() {
  const symbol = Symbol();

  return [
    (state: S) => {
      provide(symbol, state);

      return state;
    },
    () => inject(symbol) as S,
  ] as const;
}

type PendingPromise<T> = Promise<T> & {
  status: "pending";
};

type FulfilledPromise<T> = Promise<T> & {
  status: "fulfilled";
  value: T;
};

type RejectedPromise<T> = Promise<T> & {
  status: "rejected";
  reason: unknown;
};

export type ObservablePromise<T> =
  | PendingPromise<T>
  | FulfilledPromise<T>
  | RejectedPromise<T>;

export function createPendingPromise<T>(
  promise: Promise<T>
): PendingPromise<T> {
  return Object.assign(promise, {
    status: "pending" as const,
  });
}

export function createFulfilledPromise<T>(
  promise: Promise<T>,
  value: T
): FulfilledPromise<T> {
  return Object.assign(promise, {
    status: "fulfilled" as const,
    value,
  });
}

export function createRejectedPromise<T>(
  promise: Promise<T>,
  reason: unknown
): RejectedPromise<T> {
  return Object.assign(promise, {
    status: "rejected" as const,
    reason,
  });
}

// This is responsible for creating the observable promise by
// handling the resolved and rejected state of the initial promise and
// notifying
export function createObservablePromise<T>(
  promise: Promise<any>,
  abortController: AbortController,
  onSettled: (promise: FulfilledPromise<T> | RejectedPromise<T>) => void
): ObservablePromise<T> {
  const observablePromise = createPendingPromise(
    promise
      .then(function (resolvedValue) {
        if (abortController.signal.aborted) {
          return;
        }

        onSettled(
          createFulfilledPromise(Promise.resolve(resolvedValue), resolvedValue)
        );

        return resolvedValue;
      })
      .catch((rejectedReason) => {
        if (abortController.signal.aborted) {
          return;
        }

        const rejectedPromise = Promise.reject(rejectedReason);

        onSettled(createRejectedPromise(rejectedPromise, rejectedReason));

        return rejectedPromise;
      })
  );

  observablePromise.catch(() => {
    // When consuming a promise form a signal we do not consider it an unhandled promise anymore.
    // This catch prevents the browser from identifying it as unhandled, but will still be a rejected
    // promise if you try to consume it
  });

  return observablePromise;
}

export function promise<T>(): {
  get promise(): ObservablePromise<T> | undefined;
  set promise(newValue: Promise<T> | undefined);
};
export function promise<T>(promise: Promise<T>): {
  get promise(): ObservablePromise<T>;
  set promise(newValue: Promise<T>);
};
export function promise<T>(promise?: Promise<T>) {
  let abortController = new AbortController();

  const promiseValue = ref(
    promise
      ? createObservablePromise(
          promise,
          abortController,
          (settledObservablePromise) => {
            promiseValue.value = settledObservablePromise;
          }
        )
      : undefined
  );

  return {
    get promise() {
      return promiseValue.value as any;
    },
    set promise(newValue: Promise<T>) {
      abortController.abort();
      abortController = new AbortController();

      let isSettled = false;
      const newPromise = createObservablePromise(
        newValue,
        abortController,
        (settledObservablePromise) => {
          isSettled = true;
          promiseValue.value = settledObservablePromise;
        }
      );

      newPromise.then(() => {
        // We do not immediately set the promise, cause it might already be a resolved promise, meaning
        // it would create a flicker in the UI
        if (!isSettled) {
          promiseValue.value = promiseValue.value;
        }
      });
    },
  } as any;
}

export type Query<T> = [
  () => {
    promise: ObservablePromise<T>;
    state: QueryState;
  },
  () => void
];

export type QueryState = "idle" | "fetching" | "refetching";

export function query<T>(fetchData: () => Promise<T>) {
  let abortController = new AbortController();

  const queryRef = ref<{
    promise: ObservablePromise<T>;
    state: QueryState;
  }>({
    promise: createObservablePromise(
      fetchData(),
      abortController,
      (settledObservablePromise) => {
        queryRef.value = {
          state: "idle",
          // It is just because of the readonly typing
          // @ts-ignore
          promise: settledObservablePromise,
        };
      }
    ),
    state: "fetching",
  });

  function invalidate() {
    abortController?.abort();
    const currentAbortController = (abortController = new AbortController());

    queryRef.value = {
      ...queryRef.value,
      state: "refetching",
    };

    return fetchData()
      .then((data) => {
        if (currentAbortController.signal.aborted) {
          return;
        }
        queryRef.value = {
          ...queryRef.value,
          // It is just because of the readonly typing
          // @ts-ignore
          promise: createFulfilledPromise(Promise.resolve(data), data),
        };
      })
      .catch((error) => {
        if (currentAbortController.signal.aborted) {
          return;
        }
        queryRef.value = {
          ...queryRef.value,
          promise: createRejectedPromise(Promise.reject(error), error),
        };
      })
      .finally(() => {
        if (currentAbortController.signal.aborted) {
          return;
        }

        queryRef.value = {
          ...queryRef.value,
          state: "idle",
        };
      });
  }

  return [queryRef, invalidate] as const;
}

export type Mutation<T> = [
  () =>
    | {
        promise: ObservablePromise<void>;
        data: T;
      }
    | undefined,
  (data: T) => ObservablePromise<void>
];

export function mutation<T, U>(mutator: (data: U) => Promise<T>) {
  let abortController: AbortController | undefined;

  const mutationRef = ref<
    | {
        promise: ObservablePromise<void>;
        data: U;
      }
    | undefined
  >(undefined);

  function mutate(data: U) {
    abortController?.abort();
    const currentAbortController = (abortController = new AbortController());

    mutationRef.value = {
      promise: createObservablePromise(
        mutator(data),
        currentAbortController,
        (settledObservablePromise) => {
          if (settledObservablePromise.status === "fulfilled") {
            mutationRef.value = undefined;
          } else {
            mutationRef.value = {
              // Not sure why the typing is done this way
              // @ts-ignore
              data,
              promise: settledObservablePromise,
            };
          }
        }
      ),
      // Because of unwrap typing, weird stuff
      // @ts-ignore
      data,
    };

    return mutationRef.value!.promise;
  }

  return [mutation, mutate] as const;
}
