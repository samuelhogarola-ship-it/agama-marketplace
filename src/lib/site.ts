export const PRIMARY_SITE_URL = "https://todoplasticos.com";

export const LEGACY_SITE_HOSTS = new Set([
  "todo-plastico.com",
  "www.todo-plastico.com",
  "todoplastico.com",
  "www.todoplastico.com",
  "todoplastico.mx",
  "www.todoplastico.mx",
  "todoplasticos.mx",
  "www.todoplasticos.mx",
  "todoplasticos.online",
  "www.todoplasticos.online",
]);

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || PRIMARY_SITE_URL;
}
