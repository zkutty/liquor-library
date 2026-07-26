import assert from "node:assert/strict";
import test from "node:test";
import { readAccessConfig, verifyAccessJwt } from "../worker/access.ts";

const TEAM_DOMAIN = "example.cloudflareaccess.com";
const AUD = "test-audience-tag";
const NOW = Date.UTC(2026, 0, 1) ;

const keyPair = await crypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);

const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
const KID = "test-key-1";

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

function encodeSegment(value: unknown): string {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)));
}

async function mintToken(
  claimOverrides: Record<string, unknown> = {},
  headerOverrides: Record<string, unknown> = {},
  signingKey: CryptoKey = keyPair.privateKey,
): Promise<string> {
  const header = { alg: "RS256", kid: KID, typ: "JWT", ...headerOverrides };
  const claims = {
    aud: AUD,
    iss: `https://${TEAM_DOMAIN}`,
    exp: Math.floor(NOW / 1000) + 3600,
    email: "zbkutlow@gmail.com",
    ...claimOverrides,
  };

  const signingInput = `${encodeSegment(header)}.${encodeSegment(claims)}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

function requestWith(token?: string): Request {
  const headers = new Headers();
  if (token) headers.set("Cf-Access-Jwt-Assertion", token);
  return new Request("https://liquor-library.workers.dev/api/wines", { headers });
}

const config = { teamDomain: TEAM_DOMAIN, aud: AUD };

// Serve the generated public key in place of Cloudflare's certs endpoint.
let certsRequests = 0;
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input instanceof Request ? input.url : input);
  assert.equal(url, `https://${TEAM_DOMAIN}/cdn-cgi/access/certs`);
  certsRequests += 1;
  return new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: KID }] }), {
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

test("readAccessConfig requires both settings", () => {
  assert.equal(readAccessConfig({}), null);
  assert.equal(readAccessConfig({ ACCESS_TEAM_DOMAIN: TEAM_DOMAIN }), null);
  assert.equal(readAccessConfig({ ACCESS_AUD: AUD }), null);
  assert.equal(readAccessConfig({ ACCESS_TEAM_DOMAIN: "  ", ACCESS_AUD: AUD }), null);
  assert.deepEqual(readAccessConfig({ ACCESS_TEAM_DOMAIN: TEAM_DOMAIN, ACCESS_AUD: AUD }), config);
});

test("unconfigured Access reports not_configured", async () => {
  const result = await verifyAccessJwt(requestWith(await mintToken()), null, NOW);
  assert.equal(result.state, "not_configured");
});

test("a correctly signed assertion is accepted", async () => {
  const result = await verifyAccessJwt(requestWith(await mintToken()), config, NOW);
  assert.equal(result.state, "valid");
  assert.equal(result.state === "valid" ? result.email : null, "zbkutlow@gmail.com");
});

test("a missing assertion is rejected", async () => {
  const result = await verifyAccessJwt(requestWith(), config, NOW);
  assert.equal(result.state, "invalid");
  assert.equal(result.state === "invalid" ? result.reason : null, "missing assertion");
});

test("a token signed by a different key is rejected", async () => {
  const attacker = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const token = await mintToken({}, {}, attacker.privateKey);

  const result = await verifyAccessJwt(requestWith(token), config, NOW);
  assert.equal(result.state, "invalid");
  assert.equal(result.state === "invalid" ? result.reason : null, "signature verification failed");
});

test("a tampered payload is rejected", async () => {
  const token = await mintToken();
  const [header, , signature] = token.split(".");
  const forged = encodeSegment({ aud: AUD, iss: `https://${TEAM_DOMAIN}`, exp: Math.floor(NOW / 1000) + 3600, email: "attacker@example.com" });

  const result = await verifyAccessJwt(requestWith(`${header}.${forged}.${signature}`), config, NOW);
  assert.equal(result.state, "invalid");
  assert.equal(result.state === "invalid" ? result.reason : null, "signature verification failed");
});

test("the alg=none downgrade is rejected", async () => {
  const header = encodeSegment({ alg: "none", kid: KID });
  const claims = encodeSegment({ aud: AUD, iss: `https://${TEAM_DOMAIN}`, exp: Math.floor(NOW / 1000) + 3600 });

  const result = await verifyAccessJwt(requestWith(`${header}.${claims}.`), config, NOW);
  assert.equal(result.state, "invalid");
  assert.equal(result.state === "invalid" ? result.reason : null, "unexpected algorithm");
});

test("an expired token is rejected", async () => {
  const token = await mintToken({ exp: Math.floor(NOW / 1000) - 1 });

  const result = await verifyAccessJwt(requestWith(token), config, NOW);
  assert.equal(result.state, "invalid");
  assert.equal(result.state === "invalid" ? result.reason : null, "token expired");
});

test("a token for another application is rejected", async () => {
  const token = await mintToken({ aud: "some-other-app" });

  const result = await verifyAccessJwt(requestWith(token), config, NOW);
  assert.equal(result.state, "invalid");
  assert.equal(result.state === "invalid" ? result.reason : null, "audience mismatch");
});

test("a token from another team is rejected", async () => {
  const token = await mintToken({ iss: "https://attacker.cloudflareaccess.com" });

  const result = await verifyAccessJwt(requestWith(token), config, NOW);
  assert.equal(result.state, "invalid");
  assert.equal(result.state === "invalid" ? result.reason : null, "issuer mismatch");
});

test("an audience array containing the expected tag is accepted", async () => {
  const token = await mintToken({ aud: ["another-app", AUD] });

  const result = await verifyAccessJwt(requestWith(token), config, NOW);
  assert.equal(result.state, "valid");
});

test("malformed tokens are rejected", async () => {
  for (const value of ["", "not-a-jwt", "a.b", "a.b.c.d"]) {
    const result = await verifyAccessJwt(requestWith(value), config, NOW);
    assert.equal(result.state, "invalid", `expected ${JSON.stringify(value)} to be rejected`);
  }
});

test("signing keys are cached across verifications", async () => {
  const before = certsRequests;
  await verifyAccessJwt(requestWith(await mintToken()), config, NOW);
  await verifyAccessJwt(requestWith(await mintToken()), config, NOW);
  assert.equal(certsRequests, before, "expected no additional certs fetches within the cache TTL");
});
