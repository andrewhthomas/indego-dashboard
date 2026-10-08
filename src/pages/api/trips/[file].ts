import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { QUARTER_FILES } from "@/lib/trip-data";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const file = params.file ?? "";
  if (!QUARTER_FILES.includes(file)) {
    return new Response("Not found", { status: 404 });
  }

  const object = await env.TRIPS_BUCKET.get(file, { onlyIf: request.headers });
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  // Objects are stored gzipped (Content-Encoding: gzip in their R2 metadata).
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("ETag", object.httpEtag);

  // No body means the If-None-Match precondition matched.
  if (!("body" in object)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(object.body, {
    headers,
    // Pass the stored bytes through instead of letting the runtime re-encode.
    encodeBody: headers.has("Content-Encoding") ? "manual" : "automatic",
  });
};
