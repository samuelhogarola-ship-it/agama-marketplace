type PublicUmamiEnv = {
  NEXT_PUBLIC_UMAMI_URL?: string;
  NEXT_PUBLIC_UMAMI_WEBSITE_ID?: string;
};

export function resolvePublicUmamiConfig(env: PublicUmamiEnv = process.env as PublicUmamiEnv) {
  const url = env.NEXT_PUBLIC_UMAMI_URL?.trim().replace(/\/+$/, "");
  const websiteId = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

  if (!url || !websiteId) return null;

  return { url, websiteId };
}
