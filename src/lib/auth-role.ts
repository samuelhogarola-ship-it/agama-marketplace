export function protectedAreaRedirect(pathname: string, role?: string) {
  if (role === "admin" && pathname.startsWith("/panel")) return "/admin";
  if (role === "company" && pathname.startsWith("/admin")) return "/panel";
  return null;
}
