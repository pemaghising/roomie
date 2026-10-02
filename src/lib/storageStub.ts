// ponytail: Roomie never uses Supabase Storage, so supabase-js's eagerly built StorageClient is aliased to this
// stub (vite.config.ts) to keep ~8 kB gzip off the first load. Drop the alias if file uploads ever arrive.
export class StorageClient { constructor(..._args: unknown[]) {} }
export class StorageApiError extends Error {}
