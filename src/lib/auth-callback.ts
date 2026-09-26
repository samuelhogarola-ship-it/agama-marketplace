type EmailOtpType =
  | "email"
  | "email_change"
  | "invite"
  | "magiclink"
  | "recovery"
  | "signup";

type AuthCallbackClient = {
  exchangeCodeForSession(code: string): Promise<{ error: unknown }>;
  verifyOtp(input: {
    token_hash: string;
    type: EmailOtpType;
  }): Promise<{ error: unknown }>;
};

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export function getEmailConfirmation(params: URLSearchParams) {
  const token_hash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  if (!token_hash || token_hash.length > 512 || !type || !EMAIL_OTP_TYPES.has(type)) return null;
  return { token_hash, type };
}

export async function authenticateAuthCallback(
  searchParams: URLSearchParams,
  auth: AuthCallbackClient,
) {
  const code = searchParams.get("code");
  if (code) {
    const { error } = await auth.exchangeCodeForSession(code);
    return { ok: !error, method: "code" as const, error };
  }

  const confirmation = getEmailConfirmation(searchParams);
  if (confirmation) {
    const { error } = await auth.verifyOtp(confirmation);
    return { ok: !error, method: "token_hash" as const, error };
  }

  return { ok: false, method: null, error: null };
}
