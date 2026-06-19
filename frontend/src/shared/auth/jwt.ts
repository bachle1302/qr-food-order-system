type JwtPayload = {
  exp?: number;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  if (typeof atob !== "function") {
    return null;
  }

  try {
    return atob(padded);
  } catch {
    return null;
  }
}

export function getJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  const decoded = decodeBase64Url(payload);
  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    return {
      exp: typeof record.exp === "number" ? record.exp : undefined,
    };
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, clockSkewSeconds = 10) {
  const payload = getJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + clockSkewSeconds;
}
