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

export async function authenticateAuthCallback(
  searchParams: URLSearchParams,
  auth: AuthCallbackClient,
) {
  const code = searchParams.get("code");
  if (code) {
    const { error } = await auth.exchangeCodeForSession(code);
    return { ok: !error, method: "code" as const, error };
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type && EMAIL_OTP_TYPES.has(type)) {
    const { error } = await auth.verifyOtp({ token_hash: tokenHash, type });
    return { ok: !error, method: "token_hash" as const, error };
  }

  return { ok: false, method: null, error: null };
}
