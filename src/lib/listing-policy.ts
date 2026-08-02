export const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Teléfono" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

export type ContactMethod = (typeof CONTACT_METHODS)[number]["value"];

export function isContactMethod(value: string): value is ContactMethod {
  return CONTACT_METHODS.some((method) => method.value === value);
}

export function contactPlaceholder(method: string) {
  if (method === "email") return "ventas@tuempresa.com";
  if (method === "whatsapp") return "+52 55 0000 0000";
  return "+52 55 0000 0000";
}

function baseHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function isOwnAdvertiserUrl(targetUrl: string, advertiserWebsite?: string | null) {
  if (!targetUrl.trim()) return true;
  if (!advertiserWebsite?.trim()) return false;

  try {
    const target = new URL(targetUrl);
    const website = new URL(advertiserWebsite);
    if (!["http:", "https:"].includes(target.protocol)) return false;
    const targetHost = baseHost(target.hostname);
    const websiteHost = baseHost(website.hostname);
    return targetHost === websiteHost || targetHost.endsWith(`.${websiteHost}`);
  } catch {
    return false;
  }
}

export function buildContactOverride(method: string, value: string) {
  const cleanMethod = method.trim();
  const cleanValue = value.trim();
  if (!isContactMethod(cleanMethod) || cleanValue.length < 3) return null;
  return { method: cleanMethod, value: cleanValue };
}
