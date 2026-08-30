export function sanitizeAuthNext(value: string | null, fallback: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function resolveAuthOrigin(input: {
  nodeEnv: string | undefined;
  configuredSiteUrl: string | undefined;
  forwardedHost: string | null;
  forwardedProto: string | null;
  host: string | null;
}) {
  const configuredSiteUrl = input.configuredSiteUrl?.trim();
  const requestHost = (input.forwardedHost ?? input.host)?.split(",")[0]?.trim();

  if (input.nodeEnv === "production" && configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  if (!requestHost) {
    if (configuredSiteUrl) return configuredSiteUrl.replace(/\/$/, "");
    throw new Error("No se pudo determinar el origen de autenticación.");
  }

  const forwardedProto = input.forwardedProto?.split(",")[0]?.trim();
  const protocol = forwardedProto || (requestHost.startsWith("localhost") || requestHost.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${requestHost}`;
}
