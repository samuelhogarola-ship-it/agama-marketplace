const AGAMA_UMAMI_URL = "https://analytics.2.24.10.239.sslip.io";
const TODO_PLASTICO_WEBSITE_ID = "6e0256c7-fb46-4ed1-bfd8-fa030d599504";

type PublicUmamiEnv = {
  NEXT_PUBLIC_UMAMI_URL?: string;
  NEXT_PUBLIC_UMAMI_WEBSITE_ID?: string;
};

export function resolvePublicUmamiConfig(env: PublicUmamiEnv = process.env as PublicUmamiEnv) {
  // Read the public environment only to preserve this resolver's injectable
  // test boundary. Production tracking always uses the published TodoPlástico
  // pair, including when Coolify leaves either variable unset or stale.
  void env;

  return {
    url: AGAMA_UMAMI_URL,
    websiteId: TODO_PLASTICO_WEBSITE_ID,
  };
}
