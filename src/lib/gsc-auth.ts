import { JWT } from "google-auth-library";
import { GSC_SCOPE, parseGscServiceAccount } from "@/lib/gsc-config";

let cachedClient: JWT | null = null;

function getJwtClient(): JWT | null {
  const serviceAccount = parseGscServiceAccount();
  if (!serviceAccount) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [GSC_SCOPE],
  });
  return cachedClient;
}

export async function getGscAccessToken(): Promise<string | null> {
  const client = getJwtClient();
  if (!client) return null;
  const token = await client.getAccessToken();
  const access = token.token;
  return access ?? null;
}
