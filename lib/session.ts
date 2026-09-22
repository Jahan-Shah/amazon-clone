import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function toSafeCallbackPath(
  value: string | string[] | undefined | null,
): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path?.startsWith("/")) return "/";
  try {
    if (new URL(path, "https://placeholder.local").origin !== "https://placeholder.local") {
      return "/";
    }
  } catch {
    return "/";
  }
  return path;
}
