const AGAMA_UMAMI_URL = "https://analytics.2.24.10.239.sslip.io";
const TODO_PLASTICO_WEBSITE_ID = "6e0256c7-fb46-4ed1-bfd8-fa030d599504";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicUmamiEnv = {
  NEXT_PUBLIC_UMAMI_URL?: string;
  NEXT_PUBLIC_UMAMI_WEBSITE_ID?: string;
};

export function resolvePublicUmamiConfig(env: PublicUmamiEnv = process.env as PublicUmamiEnv) {
  const configuredUrl = env.NEXT_PUBLIC_UMAMI_URL?.replace(/\/$/, "");
  const configuredWebsiteId = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

  if (configuredUrl && configuredUrl !== AGAMA_UMAMI_URL) {
    return { url: AGAMA_UMAMI_URL, websiteId: TODO_PLASTICO_WEBSITE_ID };
  }

  return {
    url: AGAMA_UMAMI_URL,
    websiteId: configuredWebsiteId && UUID_PATTERN.test(configuredWebsiteId)
      ? configuredWebsiteId
      : TODO_PLASTICO_WEBSITE_ID,
  };
}
