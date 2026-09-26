function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
}

/** Standalone HTML deliberately excludes the app layout, tracker and external assets. */
export function renderEmailConfirmation(input: {token_hash:string;type:string;next:string} | null) {
  const content = input ? `
    <h1>Confirma tu acceso</h1>
    <p>Para continuar en TodoPlásticos, pulsa el botón. Si no solicitaste este correo, cierra esta página.</p>
    <form method="post" action="/auth/confirm">
      <input type="hidden" name="token_hash" value="${escapeHtml(input.token_hash)}">
      <input type="hidden" name="type" value="${escapeHtml(input.type)}">
      <input type="hidden" name="next" value="${escapeHtml(input.next)}">
      <button type="submit">Continuar en TodoPlásticos</button>
    </form>` : '<h1>Enlace no válido</h1><p>Solicita un nuevo enlace para continuar.</p><a href="/ingresar">Volver a ingresar</a>';
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="strict-origin"><title>Confirma tu acceso | TodoPlásticos</title><style>body{margin:0;padding:48px 20px;background:#f4f6f8;color:#153247;font:16px/1.6 Arial,sans-serif}main{max-width:520px;margin:auto;padding:32px;background:white;border-radius:16px}h1{font-size:28px;line-height:1.3}button{background:#153247;color:white;border:0;border-radius:8px;padding:16px 24px;font:inherit;font-weight:bold;cursor:pointer}a{color:#153247}</style></head><body><main><p><strong>TodoPlásticos</strong></p>${content}</main></body></html>`;
}
