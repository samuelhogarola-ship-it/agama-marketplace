"use client";

import { useState } from "react";
import { startProCheckout } from "@/lib/pro-checkout";

type ProCheckoutButtonProps = {
  className?: string;
  onError?: (message: string) => void;
};

export default function ProCheckoutButton({
  className = "rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50",
  onError,
}: ProCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await startProCheckout({
      request: () =>
        fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      redirect: (url) => {
        window.location.href = url;
      },
    });

    if (!result.ok) {
      setError(result.error);
      onError?.(result.error);
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? "Redirigiendo…" : "Subir a Pro"}
      </button>
      {!onError && error ? (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
