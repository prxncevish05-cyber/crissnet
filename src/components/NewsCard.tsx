import { ROLE_CONFIG, CAT_COLORS, type NewsItem } from "@/lib/constants";

interface NewsCardProps {
  news: NewsItem;
  authorityRole?: string | null;
  onVerify?: (id: number) => void;
  onFlag?: (id: number) => void;
  onUnflag?: (id: number) => void;
}

const NewsCard = ({ news, authorityRole, onVerify, onFlag, onUnflag }: NewsCardProps) => {
  const catColor = CAT_COLORS[news.cat] || "#374151";
  const badge = news.ver && !news.flag
    ? <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cn-green-light text-cn-green">🛡 Verified · {ROLE_CONFIG[news.ver as keyof typeof ROLE_CONFIG]?.label || news.ver}</span>
    : news.flag
    ? <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cn-red-light text-cn-red">❌ Misinformation</span>
    : <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cn-amber-light text-cn-amber">⏳ Pending</span>;

  const isAuthority = authorityRole && ["police", "hospital", "nhai"].includes(authorityRole);

  return (
    <div className="bg-card rounded-[13px] border border-border p-3.5 shadow-cn hover:shadow-cn-lg transition-shadow">
      <div className="flex gap-2 flex-wrap mb-2 items-center">
        {badge}
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: catColor + "18", color: catColor }}>{news.cat}</span>
        <span className="text-[11px] text-muted-foreground ml-auto">{news.src} · {news.time}</span>
      </div>
      <div className="font-bold text-[15px] text-foreground mb-1 leading-snug">{news.title}</div>
      <div className="text-sm text-cn-gray-5 leading-relaxed">{news.sum}</div>
      {isAuthority && !news.ver && !news.flag && (
        <div className="flex gap-2 mt-2.5">
          <button onClick={() => onVerify?.(news.id)} className="px-3.5 py-1.5 rounded-lg font-bold text-sm bg-cn-green-light text-cn-green">🛡 Verify</button>
          <button onClick={() => onFlag?.(news.id)} className="px-3.5 py-1.5 rounded-lg font-bold text-sm bg-cn-red-light text-cn-red">🚩 Fake</button>
        </div>
      )}
      {isAuthority && news.flag && (
        <button onClick={() => onUnflag?.(news.id)} className="mt-2 px-3 py-1.5 rounded-lg border-[1.5px] border-cn-gray-2 bg-card text-cn-gray-5 font-semibold text-xs">↩ Unflag</button>
      )}
      <div className="text-[11px] text-cn-gray-2 mt-2">👍 {news.votes} found helpful</div>
    </div>
  );
};

export default NewsCard;
