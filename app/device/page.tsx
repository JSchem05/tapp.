import { loginWithStaffCode } from "@/app/device/actions";
import { Card, Input, Label } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DeviceLoginPage({
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
            Staff device login — enter your personal code.
          </p>
        </div>

        <Card>
          <form action={loginWithStaffCode} className="space-y-5">
            <div className="space-y-2">
              <Label>Enter your code</Label>
              <Input
                name="code"
                autoComplete="off"
                placeholder="ABC123"
                maxLength={6}
                className="text-center text-lg font-bold tracking-[0.3em] uppercase"
                required
              />
            </div>

            {searchParams?.error ? (
              <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
                {searchParams.error}
              </p>
            ) : null}

            <button className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-4 text-sm font-bold text-white transition hover:bg-clay hover:shadow-lift">
              Continue
            </button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted">
          Owner?{" "}
          <Link href="/login" className="font-semibold text-ink underline">
            Log in with email
          </Link>
        </p>
      </div>
    </main>
  );
}
