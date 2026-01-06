export const epicConfig = {
  clientId: process.env.EPIC_CLIENT_ID!,
  tokenUrl: "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",

  keyId: "epic-key-1",

  privateKeyPath: "./epic-private.key",
  publicKeyPath: "./epic-public.key",

  jwtExpirySeconds: 300
} as const;

if (!epicConfig.clientId) {
  throw new Error("EPIC_CLIENT_ID is missing");
}
