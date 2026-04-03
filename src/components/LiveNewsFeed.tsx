import { useNewsAPI } from "@/hooks/useNewsAPI";
import { CAT_COLORS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

const LiveNewsFeed = () => {
  const { articles, loading, error } = useNewsAPI();

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5 px-4 mt-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-[13px] border border-border p-3.5 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground px-4">
        <div className="text-[40px]">⚠️</div>
        <div className="font-semibold mt-2">Could not load live news</div>
        <div className="text-sm mt-1">{error}</div>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-[44px]">📭</div>
        <div className="font-semibold mt-2.5">No live news available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 mt-2.5">
      {articles.map((a) => {
        const catColor = CAT_COLORS[a.cat] || "#374151";
        return (
          <div key={a.id} className="bg-card rounded-[13px] border border-border p-3.5 shadow-cn hover:shadow-cn-lg transition-shadow">
            <div className="flex gap-2 flex-wrap mb-2 items-center">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cn-blue-light text-cn-blue">📡 Live</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: catColor + "18", color: catColor }}>
                {a.cat}
              </span>
              <span className="text-[11px] text-muted-foreground ml-auto">{a.src} · {a.time}</span>
            </div>
            <div className="font-bold text-[15px] text-foreground mb-1 leading-snug">{a.title}</div>
            <div className="text-sm text-cn-gray-5 leading-relaxed line-clamp-2">{a.sum}</div>
          </div>
        );
      })}
    </div>
  );
};

export default LiveNewsFeed;
