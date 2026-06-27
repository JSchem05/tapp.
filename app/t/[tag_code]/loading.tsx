import { SkeletonCard } from "@/components/skeleton";

export default function PublicReceiptLoading() {
  return (
    <main className="min-h-screen bg-cream px-4 py-5 sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <SkeletonCard rows={8} />
      </div>
    </main>
  );
}
