import { SkeletonCard } from "@/components/skeleton";

export default function NewReceiptLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_430px]">
      <SkeletonCard rows={8} />
      <SkeletonCard rows={7} />
    </div>
  );
}
