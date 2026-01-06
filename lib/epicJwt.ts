import jwt from "jsonwebtoken";
import crypto from "crypto";
import { epicConfig } from "@/config/epic.config";
import { getPrivateKey } from "./epicKeys";

export const generateClientAssertion = (): string => {
  const privateKey = getPrivateKey();

  const payload = {
    iss: epicConfig.clientId,
    sub: epicConfig.clientId,
    aud: epicConfig.tokenUrl,
    exp: Math.floor(Date.now() / 1000) + epicConfig.jwtExpirySeconds,
    jti: crypto.randomUUID()
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    header: { kid: epicConfig.keyId }
  });
};
