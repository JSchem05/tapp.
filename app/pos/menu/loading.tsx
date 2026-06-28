import { PageSkeleton } from "@/components/skeleton";

export default function PosMenuLoading() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <PageSkeleton />
      </div>
    </main>
  );
}
