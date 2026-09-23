// @php-wasm/node-8-5 ships no types; check-content only needs its loader.
declare module "@php-wasm/node-8-5" {
  import type { PHPLoaderModule } from "@php-wasm/universal"
  export function getPHPLoaderModule(): Promise<PHPLoaderModule & { dependencyFilename: string }>
}
