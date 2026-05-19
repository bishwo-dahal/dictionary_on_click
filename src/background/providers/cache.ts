import type { DictionaryLanguageId } from "../../shared/languages.js";
import type { LookupResult } from "../../shared/types.js";
import type { LookupProvider, ProviderOutcome } from "./types.js";

const DB_NAME = "dictionary-on-click";
const DB_VERSION = 1;
const STORE = "lookups";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheRecord {
  result: LookupResult;
  fetchedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export function cacheKey(language: DictionaryLanguageId, word: string): string {
  return `${language}:${word.toLowerCase()}`;
}

async function readCache(key: string): Promise<CacheRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as CacheRecord | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveToCache(result: LookupResult): Promise<void> {
  const key = cacheKey(result.language, result.lemma);
  const record: CacheRecord = {
    result: { ...result, cachedAt: Date.now() },
    fetchedAt: Date.now(),
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const cacheProvider: LookupProvider = {
  id: "cache",
  async lookup(word, language, _signal) {
    const key = cacheKey(language, word);
    const record = await readCache(key);
    if (!record) {
      return { kind: "miss" };
    }

    const age = Date.now() - record.fetchedAt;
    const stale = age > TTL_MS;
    const result: LookupResult = {
      ...record.result,
      cachedAt: record.fetchedAt,
      stale,
      partial: stale,
    };

    if (stale) {
      return { kind: "stale", result };
    }

    return { kind: "hit", result };
  },
};
