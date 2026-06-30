import { login } from "@/app/login/actions";
import { LoginButton } from "@/app/login/login-button";
import { Card, Input, Label } from "@/components/ui";
import Link from "next/link";

export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="solid-mark mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-soft">
            T
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-ink">Tapp.</h1>
          <p className="mt-2 text-sm text-muted">
            Merchant receipts, ready when the customer taps.
          </p>
        </div>

        <Card>
          <form action={login} className="space-y-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@business.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {searchParams?.error ? (
              <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
                {searchParams.error}
              </p>
            ) : null}

            <LoginButton />
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            Staff?{" "}
            <Link href="/device" className="font-semibold text-ink underline">
              Enter your code
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
