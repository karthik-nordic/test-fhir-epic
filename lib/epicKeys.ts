import fs from "fs";
import crypto from "crypto";
import { epicConfig } from "@/config/epic.config";

const isLocal = process.env.EPIC_KEY_MODE === "local";

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

  fs.writeFileSync(epicConfig.privateKeyPath, privateKey);
  fs.writeFileSync(epicConfig.publicKeyPath, publicKey);

  /* ---------- Base64 output for Vercel ---------- */
  const privateB64 = Buffer.from(privateKey).toString("base64");
  const publicB64 = Buffer.from(publicKey).toString("base64");

  console.log("\n📦 Base64 keys (copy to Vercel env vars)");
  console.log("EPIC_PRIVATE_KEY_BASE64=");
  console.log(privateB64);
  console.log("\nEPIC_PUBLIC_KEY_BASE64=");
  console.log(publicB64);
  console.log("\n⚠️  Do NOT commit these values\n");
};

/* -------------------------------------------------
   PRIVATE KEY
------------------------------------------------- */
export const getPrivateKey = (): Buffer => {
  if (isLocal) {
    ensureLocalKeyPair();
    return fs.readFileSync(epicConfig.privateKeyPath);
  }

  const b64 = process.env.EPIC_PRIVATE_KEY_BASE64;
  if (!b64) {
    throw new Error("EPIC_PRIVATE_KEY_BASE64 missing (env mode)");
  }

  return Buffer.from(b64, "base64");
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

  const jwk = crypto.createPublicKey(publicKeyPem).export({ format: "jwk" });

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
