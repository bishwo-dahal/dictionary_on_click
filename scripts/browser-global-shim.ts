import browserApi from "webextension-polyfill";

(globalThis as typeof globalThis & { browser: typeof browserApi }).browser = browserApi;
