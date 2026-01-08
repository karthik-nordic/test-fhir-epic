import fs from "fs";
import crypto from "crypto";
import { epicConfig } from "@/config/epic.config";

const isLocal = process.env.EPIC_KEY_MODE === "local";

/* -------------------------------------------------
   Helpers
------------------------------------------------- */
const normalizePem = (pem: string): string =>
  pem.replace(/\r\n/g, "\n").trim() + "\n";

/* -------------------------------------------------
   LOCAL MODE: generate + persist keys
------------------------------------------------- */
const ensureLocalKeyPair = () => {
  if (
    fs.existsSync(epicConfig.privateKeyPath) &&
    fs.existsSync(epicConfig.publicKeyPath)
  ) {
    return;
  }

  console.log("🔑 Generating Epic RSA key pair (local mode)");

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  const cleanPrivatePem = normalizePem(privateKey);
  const cleanPublicPem = normalizePem(publicKey);

  fs.writeFileSync(epicConfig.privateKeyPath, cleanPrivatePem);
  fs.writeFileSync(epicConfig.publicKeyPath, cleanPublicPem);

  /* ---------- Base64 output for env vars ---------- */
  const privateB64 = Buffer.from(cleanPrivatePem, "utf8").toString("base64");
  const publicB64 = Buffer.from(cleanPublicPem, "utf8").toString("base64");

  console.log("\n📦 Base64 keys (copy to env vars)");
  console.log("EPIC_PRIVATE_KEY_BASE64=");
  console.log(privateB64);
  console.log("\nEPIC_PUBLIC_KEY_BASE64=");
  console.log(publicB64);
  console.log("\n⚠️  Do NOT commit these values\n");
};

/* -------------------------------------------------
   PRIVATE KEY
------------------------------------------------- */
export const getPrivateKey = (): crypto.KeyObject => {
  if (isLocal) {
    ensureLocalKeyPair();

    const pem = normalizePem(
      fs.readFileSync(epicConfig.privateKeyPath, "utf8")
    );

    return crypto.createPrivateKey({
      key: pem,
      format: "pem",
      type: "pkcs8"
    });
  }

  const b64 = process.env.EPIC_PRIVATE_KEY_BASE64;
  if (!b64) {
    throw new Error("EPIC_PRIVATE_KEY_BASE64 missing (env mode)");
  }

  const pem = normalizePem(Buffer.from(b64, "base64").toString("utf8"));

  return crypto.createPrivateKey({
    key: pem,
    format: "pem",
    type: "pkcs8"
  });
};

/* -------------------------------------------------
   JWKS
------------------------------------------------- */
export const getJWKS = () => {
  let publicKeyPem: string;

  if (isLocal) {
    ensureLocalKeyPair();
    publicKeyPem = fs.readFileSync(epicConfig.publicKeyPath, "utf8");
  } else {
    const b64 = process.env.EPIC_PUBLIC_KEY_BASE64;
    if (!b64) {
      throw new Error("EPIC_PUBLIC_KEY_BASE64 missing (env mode)");
    }
    publicKeyPem = Buffer.from(b64, "base64").toString("utf8");
  }

  publicKeyPem = normalizePem(publicKeyPem);

  const jwk = crypto
    .createPublicKey({
      key: publicKeyPem,
      format: "pem",
      type: "spki"
    })
    .export({ format: "jwk" });

  return {
    keys: [
      {
        ...jwk,
        use: "sig",
        alg: "RS256",
        kid: epicConfig.keyId
      }
    ]
  };
};

/* -------------------------------------------------
   Startup sanity check (recommended)
------------------------------------------------- */
try {
  getPrivateKey();
  console.log("✅ RSA private key validated successfully");
} catch (err) {
  console.error("❌ RSA private key validation failed", err);
  process.exit(1);
}

