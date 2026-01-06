import fs from "fs";
import crypto from "crypto";
import { epicConfig } from "@/config/epic.config";

const ensureKeyPair = (): void => {
  if (
    fs.existsSync(epicConfig.privateKeyPath) &&
    fs.existsSync(epicConfig.publicKeyPath)
  ) {
    return;
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });

  fs.writeFileSync(epicConfig.privateKeyPath, privateKey);
  fs.writeFileSync(epicConfig.publicKeyPath, publicKey);
};

export const getPrivateKey = (): Buffer => {
  ensureKeyPair();
  return fs.readFileSync(epicConfig.privateKeyPath);
};

export const getJWKS = (): { keys: unknown[] } => {
  ensureKeyPair();

  const publicKeyPem = fs.readFileSync(epicConfig.publicKeyPath, "utf8");
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
