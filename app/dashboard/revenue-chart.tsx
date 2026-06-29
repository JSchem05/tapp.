export function RevenueChart({
  data
}: {
  data: { month: string; revenue: number }[];
}) {
  const max = Math.max(...data.map((item) => item.revenue), 1);
  const ticks = [10000, 8000, 5000, 3000, 0];

  return (
    <div className="grid h-[230px] grid-cols-[44px_1fr] gap-4">
      <div className="flex h-[190px] flex-col justify-between pt-2 text-right text-xs font-medium text-muted">
        {ticks.map((tick) => (
          <span key={tick}>{tick === 0 ? "0K" : `${Math.round(tick / 1000)}K`}</span>
        ))}
      </div>
      <div className="grid grid-rows-[190px_1fr]">
        <div className="flex items-end justify-around gap-5 border-b border-line px-4">
          {data.map((item, index) => {
            const height = Math.max(18, (item.revenue / max) * 150);
            return (
              <div
                key={item.month}
                className={`w-12 rounded-t-[12px] rounded-b-[6px] ${
                  index === 2 ? "bg-[#8F8F8F]" : "bg-[#333333]"
                }`}
                style={{ height }}
                title={`${item.month}: ${item.revenue}`}
              />
            );
          })}
        </div>
        <div className="flex justify-around gap-5 px-4 pt-3 text-sm font-medium text-muted">
          {data.map((item) => (
            <span key={item.month} className="w-12 text-center">
              {item.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
