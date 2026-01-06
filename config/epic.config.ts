export const epicConfig = {
  clientId: process.env.EPIC_CLIENT_ID!,
  tokenUrl: "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",

  keyId: process.env.PEM_KEY_ID!,

  privateKeyPath: "./epic-private.key",
  publicKeyPath: "./epic-public.key",

  jwtExpirySeconds: 300
} as const;

if (!epicConfig.clientId) {
  throw new Error("EPIC_CLIENT_ID is missing");
}

if (!epicConfig.keyId) {
  throw new Error("PEM_KEY_ID is missing");
}
