import type { LookupProvider } from "./types.js";

/** Placeholder providers — real implementations in todo 3. */
function missProvider(id: LookupProvider["id"]): LookupProvider {
  return {
    id,
    async lookup() {
      return { kind: "miss" };
    },
  };
}

/** Default chain order; orchestrator walks this list per variant. */
export function createDefaultProviders(): LookupProvider[] {
  return [
    missProvider("cache"),
    missProvider("wiktionary-rest"),
    missProvider("wiktionary-action"),
    missProvider("free-dictionary"),
    missProvider("datamuse"),
  ];
}
