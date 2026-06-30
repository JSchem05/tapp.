export function getResendSandboxRecipient() {
  const value = process.env.RESEND_SANDBOX_RECIPIENT?.trim();
  return value || null;
}

export function isUsingResendTestFromAddress() {
  const from = process.env.RESEND_FROM_EMAIL ?? "Tapp <onboarding@resend.dev>";
  return from.includes("resend.dev");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function canSendResendEmailTo(recipient: string) {
  const sandboxRecipient = getResendSandboxRecipient();
  if (!sandboxRecipient) return { ok: true as const };

  if (normalizeEmail(recipient) !== normalizeEmail(sandboxRecipient)) {
    return {
      ok: false as const,
      error: `Without a verified domain, Resend only delivers to ${sandboxRecipient}. Verify a domain at resend.com/domains to email customers.`
    };
  }

  return { ok: true as const };
}
