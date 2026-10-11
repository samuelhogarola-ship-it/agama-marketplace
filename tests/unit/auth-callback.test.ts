import assert from "node:assert/strict";
import test from "node:test";

import { authenticateAuthCallback } from "../../src/lib/auth-callback.ts";

test("auth callback verifies token_hash magic links", async () => {
  const calls: unknown[] = [];
  const auth = {
    exchangeCodeForSession: async () => ({ error: null }),
    verifyOtp: async (input: unknown) => {
      calls.push(input);
      return { error: null };
    },
  };
  const params = new URLSearchParams(
    "token_hash=secret-token&type=magiclink&next=%2Fpanel",
  );

  const result = await authenticateAuthCallback(params, auth);

  assert.equal(result.ok, true);
  assert.equal(result.method, "token_hash");
  assert.deepEqual(calls, [
    { token_hash: "secret-token", type: "magiclink" },
  ]);
});

test("auth callback keeps supporting PKCE code links", async () => {
  const calls: string[] = [];
  const auth = {
    exchangeCodeForSession: async (code: string) => {
      calls.push(code);
      return { error: null };
    },
    verifyOtp: async () => ({ error: null }),
  };

  const result = await authenticateAuthCallback(
    new URLSearchParams("code=pkce-code"),
    auth,
  );

  assert.equal(result.ok, true);
  assert.equal(result.method, "code");
  assert.deepEqual(calls, ["pkce-code"]);
});

test("auth callback rejects unsupported OTP types without verifying them", async () => {
  let verificationAttempted = false;
  const auth = {
    exchangeCodeForSession: async () => ({ error: null }),
    verifyOtp: async () => {
      verificationAttempted = true;
      return { error: null };
    },
  };

  const result = await authenticateAuthCallback(
    new URLSearchParams("token_hash=secret-token&type=sms"),
    auth,
  );

  assert.deepEqual(result, { ok: false, method: null, error: null });
  assert.equal(verificationAttempted, false);
});
