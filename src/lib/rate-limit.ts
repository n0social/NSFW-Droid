type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Returns true if the request is within the limit. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Returns a 429 JSON response when over limit; otherwise null. */
export function rateLimitExceededResponse(
  request: Request,
  keyPrefix: string,
  limit: number,
  windowMs: number,
): Response | null {
  const ip = clientIp(request);
  if (rateLimit(`${keyPrefix}:${ip}`, limit, windowMs)) return null;
  return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
}
