import { login } from "@/app/login/actions";
import { Card, Input, Label } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export default function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="blue-gradient-mark mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-soft">
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

            <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-amber px-4 text-sm font-bold text-white transition hover:bg-clay hover:shadow-[0_4px_16px_rgba(79,110,247,0.35)]">
              Log in
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
