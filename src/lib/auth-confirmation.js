import { createHash } from 'node:crypto';

// Only prepares the form. OTP verification still requires the user's POST action.
export const confirmationScript = `(() => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  window.history.replaceState(null, '', '/auth/confirm');
  const token = params.get('token_hash');
  const type = params.get('type');
  if (!token || token.length > 512 || !['email', 'email_change', 'invite', 'magiclink', 'recovery', 'signup'].includes(type)) return;
  const form = document.getElementById('confirmation');
  form.elements.namedItem('token_hash').value = token;
  form.elements.namedItem('type').value = type;
  form.elements.namedItem('next').value = params.get('next') || '/panel';
  document.getElementById('invalid').hidden = true;
  form.hidden = false;
})();`;

export const confirmationHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'strict-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': `default-src 'none'; script-src 'sha256-${createHash('sha256').update(confirmationScript).digest('base64')}'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`,
};

/** Standalone HTML excludes the app layout, trackers and external assets. */
export function renderEmailConfirmation() {
  return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="strict-origin"><title>Confirma tu acceso | TodoPlásticos</title><style>body{margin:0;padding:48px 20px;background:#f4f6f8;color:#153247;font:16px/1.6 Arial,sans-serif}main{max-width:520px;margin:auto;padding:32px;background:white;border-radius:16px}h1{font-size:28px;line-height:1.3}button{background:#153247;color:white;border:0;border-radius:8px;padding:16px 24px;font:inherit;font-weight:bold;cursor:pointer}a{color:#153247}</style></head><body><main><p><strong>TodoPlásticos</strong></p>
  <h1>Confirma tu acceso</h1>
  <div id="invalid"><p>Enlace no válido. Solicita un nuevo enlace para continuar.</p><a href="/ingresar">Volver a ingresar</a></div>
  <noscript>Activa JavaScript para confirmar el acceso de forma segura.</noscript>
  <form id="confirmation" method="post" action="/auth/confirm" hidden>
    <p>Para continuar en TodoPlásticos, pulsa el botón. Si no solicitaste este correo, cierra esta página.</p>
    <input type="hidden" name="token_hash"><input type="hidden" name="type"><input type="hidden" name="next">
    <button type="submit">Continuar en TodoPlásticos</button>
  </form></main><script>${confirmationScript}</script></body></html>`;
}
