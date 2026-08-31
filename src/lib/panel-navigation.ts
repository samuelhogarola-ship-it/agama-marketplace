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
