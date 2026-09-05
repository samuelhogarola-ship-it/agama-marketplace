type CheckoutDependencies = {
  request: () => Promise<Response>;
  redirect: (url: string) => void;
};

type CheckoutResult =
  | { ok: true }
  | { ok: false; error: string };

export async function startProCheckout(
  dependencies: CheckoutDependencies,
): Promise<CheckoutResult> {
  try {
    const response = await dependencies.request();
    const data: unknown = await response.json();
    const url = isRecord(data) && typeof data.url === "string" ? data.url : null;
    const apiError = isRecord(data) && typeof data.error === "string" ? data.error : null;

    if (!response.ok || !url) {
      return {
        ok: false,
        error: apiError ?? "No se pudo iniciar el pago.",
      };
    }

    dependencies.redirect(url);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error de red. Inténtalo de nuevo." };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
