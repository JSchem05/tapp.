import { SkeletonCard } from "@/components/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-[600px] space-y-5">
      <div className="skeleton h-9 w-64 rounded-full" />
      <SkeletonCard rows={5} />
      <SkeletonCard rows={5} />
      <SkeletonCard rows={4} />
    </div>
  );
}
