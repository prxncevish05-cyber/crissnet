import { useNewsAPI } from "@/hooks/useNewsAPI";
import { Skeleton } from "@/components/ui/skeleton";

const HighwayNewsFeed = () => {
  const { articles, loading, error } = useNewsAPI(
    "India highway accident OR road crash OR expressway collision",
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
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
      <div className="text-center py-6 text-muted-foreground">
        <div className="text-[32px]">⚠️</div>
        <div className="text-sm font-semibold mt-1">Could not load highway news</div>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-[36px]">🛣️</div>
        <div className="font-semibold mt-2">No highway accident reports</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {articles.map((a) => (
        <div key={a.id} className="bg-card rounded-[13px] border border-border p-3.5 shadow-cn">
          <div className="flex gap-2 flex-wrap mb-2 items-center">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-destructive/10 text-destructive">🚨 Highway</span>
            <span className="text-[11px] text-muted-foreground ml-auto">{a.src} · {a.time}</span>
          </div>
          <div className="font-bold text-[14px] text-foreground mb-1 leading-snug">{a.title}</div>
          <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{a.sum}</div>
        </div>
      ))}
    </div>
  );
};

export default HighwayNewsFeed;
