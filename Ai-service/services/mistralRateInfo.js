export function logRateLimitHeaders(res) {
    console.log("[Mistral] Rate-limit headers:", {
        remaining: res.headers.get("x-ratelimit-remaining"),
        limit: res.headers.get("x-ratelimit-limit"),
        reset: res.headers.get("x-ratelimit-reset"),
        retryAfter: res.headers.get("retry-after"),
    });
}