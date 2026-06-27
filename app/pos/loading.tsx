import { SkeletonCard } from "@/components/skeleton";

export default function PosLoading() {
  return (
    <main className="h-screen bg-cream p-4">
      <div className="grid h-full gap-4 lg:grid-cols-[3fr_2fr]">
        <SkeletonCard rows={8} />
        <SkeletonCard rows={10} />
      </div>
    </main>
  );
}
