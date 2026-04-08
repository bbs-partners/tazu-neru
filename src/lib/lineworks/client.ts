import { getAccessToken } from "./auth";

const BASE_URL = "https://www.worksapis.com/v1.0";

export async function lineworksFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE WORKS API error: ${res.status} ${path} ${body}`);
  }

  return res;
}
