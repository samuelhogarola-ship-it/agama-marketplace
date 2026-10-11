export type PanelSection =
  | "summary"
  | "company"
  | "catalog"
  | "publish"
  | "stats"
  | "settings";

export function panelSectionForPath(pathname: string): PanelSection {
  if (pathname.startsWith("/panel/perfil")) return "company";
  if (pathname.startsWith("/panel/publicar")) return "publish";
  if (pathname.startsWith("/panel/editar")) return "catalog";
  if (pathname.startsWith("/panel/estadisticas")) return "stats";
  if (pathname.startsWith("/panel/ajustes")) return "settings";
  return "summary";
}

export function panelHref(path: string, previewMode: boolean) {
  if (!previewMode) return path;

  const [pathAndQuery, fragment] = path.split("#", 2);
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  return `${pathAndQuery}${separator}preview=1${fragment ? `#${fragment}` : ""}`;
}
