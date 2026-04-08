import jwt from "jsonwebtoken";

const TOKEN_ENDPOINT = "https://auth.worksmobile.com/oauth2/v2.0/token";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function generateJWT(): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: process.env.LINEWORKS_CLIENT_ID,
    sub: process.env.LINEWORKS_SERVICE_ACCOUNT,
    iat: now,
    exp: now + 3600,
  };

  const privateKey = process.env.LINEWORKS_PRIVATE_KEY!.replace(/\\n/g, "\n");

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const assertion = generateJWT();

  const params = new URLSearchParams({
    assertion,
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    client_id: process.env.LINEWORKS_CLIENT_ID!,
    client_secret: process.env.LINEWORKS_CLIENT_SECRET!,
    scope: "bot task calendar",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to get access token: ${res.status} ${body}`);
  }

  const data = await res.json();

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}
