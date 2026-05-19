/** Minimal IndexedDB mock for provider unit tests in Node. */
const memoryStore = new Map<string, unknown>();

function createMockRequest<T>(result: T): IDBOpenDBRequest {
  const req = {
    result,
    error: null,
    onsuccess: null as ((ev: Event) => void) | null,
    onerror: null as ((ev: Event) => void) | null,
    onupgradeneeded: null as ((ev: IDBVersionChangeEvent) => void) | null,
  } as unknown as IDBOpenDBRequest;

  queueMicrotask(() => {
    req.onsuccess?.({ target: req } as Event);
  });
  return req;
}

const mockDb = {
  objectStoreNames: {
    contains: () => false,
  },
  createObjectStore: () => ({}),
  transaction: (_store: string, mode: IDBTransactionMode) => {
    let oncomplete: (() => void) | null = null;
    const tx = {
      objectStore: () => ({
        get: (key: string) => {
          const getReq = createMockRequest(memoryStore.get(key));
          return getReq;
        },
        put: (value: unknown, key: string) => {
          memoryStore.set(key, value);
          return createMockRequest(undefined);
        },
      }),
      get oncomplete() {
        return oncomplete;
      },
      set oncomplete(fn: (() => void) | null) {
        oncomplete = fn;
        if (mode === "readwrite") {
          queueMicrotask(() => fn?.());
        }
      },
      onerror: null,
    };
    return tx as unknown as IDBTransaction;
  },
} as unknown as IDBDatabase;

globalThis.indexedDB = {
  open: () => {
    const req = createMockRequest(mockDb);
    queueMicrotask(() => {
      req.onupgradeneeded?.({ target: req } as IDBVersionChangeEvent);
      req.onsuccess?.({ target: req } as Event);
    });
    return req;
  },
} as IDBFactory;

Object.defineProperty(globalThis, "navigator", {
  value: { onLine: true },
  configurable: true,
});
