// Serializa JSON-LD de forma segura para incrustar en <script>:
// el contenido viene de usuarios y "</script>" rompería el contexto (XSS).
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
