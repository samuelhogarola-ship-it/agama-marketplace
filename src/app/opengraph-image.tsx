import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "TodoPlástico — Directorio B2B de la industria plástica en México";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1e3a5f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
        }}
      >
        {/* Accent bar top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "#3b82f6",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            TodoPlástico
          </div>

          <div
            style={{
              color: "#93c5fd",
              fontSize: 30,
              marginTop: 24,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Directorio B2B de la industria plástica en México
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 48,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "14px 28px",
            }}
          >
            <div style={{ color: "#cbd5e1", fontSize: 20 }}>Impulsado por AGAMA</div>
          </div>
        </div>

        {/* Bottom tags */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            display: "flex",
            gap: 12,
          }}
        >
          {["Proveedores", "Compradores", "Transformadores"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.4)",
                borderRadius: 999,
                padding: "6px 18px",
                color: "#93c5fd",
                fontSize: 18,
                display: "flex",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
