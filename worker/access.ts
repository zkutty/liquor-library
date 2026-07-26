/**
 * Cloudflare Access JWT verification.
 *
 * Access is enforced at the edge (Workers -> Settings -> Domains & Routes ->
 * Enable Cloudflare Access). This module re-verifies the assertion inside the
 * Worker so that a misconfigured or removed Access application cannot silently
 * expose the collection API.
 *
 * Cloudflare signs the assertion with RS256 and publishes the public keys at
 * `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`.
 */

export const ACCESS_JWT_HEADER = "Cf-Access-Jwt-Assertion";

export type AccessConfig = {
  teamDomain: string;
  aud: string;
};

export type AccessResult =
  | { state: "not_configured" }
  | { state: "valid"; email?: string }
  | { state: "invalid"; reason: string };

type JsonWebKey_ = {
  kid: string;
  kty: string;
  alg?: string;
  n: string;
  e: string;
};

type AccessClaims = {
  aud?: string | string[];
  iss?: string;
  exp?: number;
  nbf?: number;
  email?: string;
};

/**
 * Returns the Access configuration only when both values are present, so a
 * half-configured environment is treated as unconfigured rather than as a
 * silently passing check.
 */
export function readAccessConfig(env: Record<string, unknown>): AccessConfig | null {
  const teamDomain = typeof env.ACCESS_TEAM_DOMAIN === "string" ? env.ACCESS_TEAM_DOMAIN.trim() : "";
  const aud = typeof env.ACCESS_AUD === "string" ? env.ACCESS_AUD.trim() : "";

  if (!teamDomain || !aud) {
    return null;
  }

  return { teamDomain, aud };
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeJsonSegment<T>(segment: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment))) as T;
}

const keyCache = new Map<string, { keys: JsonWebKey_[]; fetchedAt: number }>();
const KEY_CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchSigningKeys(teamDomain: string, now: number): Promise<JsonWebKey_[]> {
  const cached = keyCache.get(teamDomain);

  if (cached && now - cached.fetchedAt < KEY_CACHE_TTL_MS) {
    return cached.keys;
  }

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);

  if (!response.ok) {
    throw new Error(`Access certs request failed with status ${response.status}`);
  }

  const body = (await response.json()) as { keys?: JsonWebKey_[] };
  const keys = body.keys ?? [];

  keyCache.set(teamDomain, { keys, fetchedAt: now });

  return keys;
}

function audienceMatches(claims: AccessClaims, expected: string): boolean {
  if (Array.isArray(claims.aud)) {
    return claims.aud.includes(expected);
  }

  return claims.aud === expected;
}

/**
 * Verifies the Access assertion on a request. Returns `not_configured` when the
 * Worker has no Access settings, so callers can decide how to treat that case.
 */
export async function verifyAccessJwt(
  request: Request,
  config: AccessConfig | null,
  now: number = Date.now(),
): Promise<AccessResult> {
  if (!config) {
    return { state: "not_configured" };
  }

  const token = request.headers.get(ACCESS_JWT_HEADER);

  if (!token) {
    return { state: "invalid", reason: "missing assertion" };
  }

  const segments = token.split(".");

  if (segments.length !== 3) {
    return { state: "invalid", reason: "malformed token" };
  }

  const [headerSegment, payloadSegment, signatureSegment] = segments;

  let header: { kid?: string; alg?: string };
  let claims: AccessClaims;

  try {
    header = decodeJsonSegment(headerSegment);
    claims = decodeJsonSegment(payloadSegment);
  } catch {
    return { state: "invalid", reason: "undecodable token" };
  }

  if (header.alg !== "RS256") {
    return { state: "invalid", reason: "unexpected algorithm" };
  }

  if (!audienceMatches(claims, config.aud)) {
    return { state: "invalid", reason: "audience mismatch" };
  }

  if (claims.iss !== `https://${config.teamDomain}`) {
    return { state: "invalid", reason: "issuer mismatch" };
  }

  const nowSeconds = Math.floor(now / 1000);

  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds) {
    return { state: "invalid", reason: "token expired" };
  }

  if (typeof claims.nbf === "number" && claims.nbf > nowSeconds) {
    return { state: "invalid", reason: "token not yet valid" };
  }

  let keys: JsonWebKey_[];

  try {
    keys = await fetchSigningKeys(config.teamDomain, now);
  } catch {
    return { state: "invalid", reason: "signing keys unavailable" };
  }

  const candidates = header.kid ? keys.filter((key) => key.kid === header.kid) : keys;

  if (candidates.length === 0) {
    return { state: "invalid", reason: "unknown signing key" };
  }

  const data = new TextEncoder().encode(`${headerSegment}.${payloadSegment}`);
  const signature = decodeBase64Url(signatureSegment);

  for (const key of candidates) {
    try {
      const publicKey = await crypto.subtle.importKey(
        "jwk",
        { kty: key.kty, n: key.n, e: key.e, alg: "RS256", ext: true },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"],
      );

      const verified = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        signature as BufferSource,
        data as BufferSource,
      );

      if (verified) {
        return { state: "valid", email: claims.email };
      }
    } catch {
      // Try the next candidate key rather than failing on one unusable entry.
    }
  }

  return { state: "invalid", reason: "signature verification failed" };
}
