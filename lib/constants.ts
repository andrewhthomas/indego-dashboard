/**
 * Shared constants. Keep this file tiny — only values referenced from three or
 * more places belong here.
 */

/**
 * Root of the Vercel Blob Storage bucket containing Indego quarterly trip CSVs.
 * Consumers append a filename (e.g. `indego-trips-2025-q3.csv`).
 */
export const BLOB_BASE_URL =
  "https://oilg24vboskpv84u.public.blob.vercel-storage.com";
