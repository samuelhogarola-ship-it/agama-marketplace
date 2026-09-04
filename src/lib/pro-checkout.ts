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
    const data = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !data.url) {
      return {
        ok: false,
        error: data.error ?? "No se pudo iniciar el pago.",
      };
    }

    dependencies.redirect(data.url);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error de red. Inténtalo de nuevo." };
  }
}
