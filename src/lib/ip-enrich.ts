/**
 * IP enrichment via ipinfo.io.
 *
 * Returns the ISP / carrier name (e.g. "Verizon", "Comcast", "T-Mobile")
 * for a given IP address. Used by the waiver-sign server action so the
 * leads table can display who's actually signing up at-a-glance.
 *
 * - Free tier: ~1000 lookups/day without a token. Add IPINFO_TOKEN to your
 *   environment for 50k/month (free signup at ipinfo.io/signup).
 * - Non-blocking: returns `null` on any failure (timeout, rate-limit, parse).
 *   The caller MUST treat null gracefully — never propagate the error.
 * - Strips Autonomous-System prefixes from the raw `org` field, e.g.
 *     "AS7922 Comcast Cable Communications, LLC" → "Comcast Cable Communications, LLC"
 *     "AS22394 Cellco Partnership DBA Verizon Wireless" → "Cellco Partnership DBA Verizon Wireless"
 *   Keeps the legal-entity suffixes for now (rather than over-cleaning) so
 *   downstream analytics can still group on the full string.
 */

const IPINFO_TIMEOUT_MS = 2000;

/** Skip lookup for obvious non-public addresses. */
function isLookupableIp(ip: string): boolean {
  if (!ip || ip === "unknown") return false;
  // IPv4 private ranges
  if (/^10\./.test(ip)) return false;
  if (/^192\.168\./.test(ip)) return false;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) return false;
  if (/^127\./.test(ip)) return false;
  // IPv6 loopback / link-local
  if (ip === "::1" || /^fe80:/i.test(ip)) return false;
  return true;
}

function stripAsPrefix(org: string): string {
  // ipinfo's `org` field is shaped like "AS<num> <Name>". Strip the prefix.
  return org.replace(/^AS\d+\s+/, "").trim();
}

/**
 * Look up the ISP for an IP. Returns `null` on any failure.
 * Never throws.
 */
export async function lookupIsp(ip: string): Promise<string | null> {
  if (!isLookupableIp(ip)) return null;

  const token = process.env.IPINFO_TOKEN;
  const url = token
    ? `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${token}`
    : `https://ipinfo.io/${encodeURIComponent(ip)}/json`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IPINFO_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[ip-enrich] ${ip} -> HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { org?: string; company?: { name?: string } };
    // Prefer paid-plan `company.name` if present (cleaner), else strip prefix from `org`.
    const companyName = data.company?.name?.trim();
    if (companyName) return companyName;
    if (data.org) return stripAsPrefix(data.org);
    return null;
  } catch (err) {
    console.warn(`[ip-enrich] ${ip} -> error:`, err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
