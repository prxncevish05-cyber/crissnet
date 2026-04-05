import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { ROLE_CONFIG } from "@/lib/constants";
import { useToastNotify } from "@/hooks/useToastNotify";
import TopBar from "@/components/TopBar";
import MenuPanel from "@/components/MenuPanel";
import NewsCard from "@/components/NewsCard";
import HighwayNewsFeed from "@/components/HighwayNewsFeed";

const AuthorityDashboard = () => {
  const notify = useToastNotify();
  const user = useAppStore((s) => s.user);
  const news = useAppStore((s) => s.news);
  const emergencies = useAppStore((s) => s.emergencies);
  const verifyNews = useAppStore((s) => s.verifyNews);
  const flagNews = useAppStore((s) => s.flagNews);
  const unflagNews = useAppStore((s) => s.unflagNews);
  const postNews = useAppStore((s) => s.postNews);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"home" | "news" | "post">("home");
  const [newsFilter, setNewsFilter] = useState("all");
  const [postText, setPostText] = useState("");

  if (!user) return null;
  const rc = ROLE_CONFIG[user.role];
  const myVerified = news.filter((n) => n.ver === user.role).length;
  const pending = news.filter((n) => !n.ver && !n.flag).length;
  const flagged = news.filter((n) => n.flag).length;
  const activeEmgs = emergencies.filter((e) => e.status !== "resolved");

  const filteredNews = newsFilter === "all" ? news : newsFilter === "pending" ? news.filter((n) => !n.ver && !n.flag) : newsFilter === "verified" ? news.filter((n) => n.ver) : news.filter((n) => n.flag);

  const handlePost = () => {
    if (!postText.trim()) { notify("Empty post", "Please write something first", "err"); return; }
    postNews(postText.trim(), user.role);
    setPostText("");
    notify("📢 Update Published", "Visible to all users with verified badge", "ok");
  };

  const tabItems = [
    { id: "home" as const, icon: "📊", label: "Dashboard" },
    { id: "news" as const, icon: "📰", label: "Verify News" },
    { id: "post" as const, icon: "📢", label: "Post Update" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <TopBar onMenuOpen={() => setMenuOpen(true)} />
      {/* Tab bar */}
      <div className="px-4" style={{ background: rc.grad }}>
        <div className="flex gap-1">
          {tabItems.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-3 text-sm font-bold border-b-[2.5px] transition-all ${tab === t.id ? "border-primary-foreground opacity-100" : "border-transparent opacity-70"}`}
              style={{ color: "#fff" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {tab === "home" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[{ ic: "✅", lb: "Verified by Me", v: myVerified, bg: "#DCFCE7", c: "#059669" },
                { ic: "⏳", lb: "Pending", v: pending, bg: "#FEF3C7", c: "#D97706" },
                { ic: "🚩", lb: "Flagged Fake", v: flagged, bg: "#FEE2E2", c: "#DC2626" },
                { ic: "🚨", lb: "Active SOS", v: activeEmgs.length, bg: "#DBEAFE", c: "#1D4ED8" },
              ].map((s) => (
                <div key={s.lb} className="bg-card rounded-[13px] p-3.5 border border-border shadow-cn flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[11px] flex items-center justify-center text-xl shrink-0" style={{ background: s.bg }}>{s.ic}</div>
                  <div><div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{s.lb}</div><div className="text-2xl font-extrabold leading-tight" style={{ color: s.c }}>{s.v}</div></div>
                </div>
              ))}
            </div>
            {/* Active emergencies */}
            <div className="bg-card rounded-[13px] border border-border p-3.5">
              <div className="text-[17px] font-bold mb-3">🚨 Active Emergencies on NH-48</div>
              {activeEmgs.length ? activeEmgs.map((e) => (
                <div key={e.id} className="flex gap-3 py-2 border-b border-cn-gray-0 items-start">
                  <div className="w-[34px] h-[34px] rounded-full bg-cn-red-light flex items-center justify-center text-base shrink-0">🆘</div>
                  <div>
                    <div className="font-bold text-sm">{e.userName}</div>
                    <div className="text-xs text-cn-gray-5">{e.location}</div>
                    <span className="bg-cn-red-light text-cn-red text-[10px] font-bold px-2 py-0.5 rounded-lg">{e.severity}</span>
                  </div>
                </div>
              )) : <div className="text-center py-4 text-muted-foreground text-sm">No active emergencies 🎉</div>}
            </div>
            {/* Accuracy */}
            <div className="bg-card rounded-[13px] border border-border p-3.5">
              <div className="text-[17px] font-bold mb-3">📈 Info Accuracy</div>
              {[{ l: "Verified", v: myVerified, c: "#059669" }, { l: "Pending", v: pending, c: "#D97706" }, { l: "Flagged", v: flagged, c: "#DC2626" }].map((x) => (
                <div key={x.l} className="mb-3">
                  <div className="flex justify-between text-sm font-semibold mb-1"><span>{x.l}</span><span className="text-muted-foreground">{x.v}/{news.length}</span></div>
                  <div className="bg-cn-gray-1 rounded-[5px] h-2"><div className="h-full rounded-[5px] transition-all duration-500" style={{ width: `${Math.round((x.v / news.length) * 100)}%`, background: x.c }} /></div>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "news" && (
          <>
            <div className="flex gap-2 overflow-x-auto cn-hide-scrollbar">
              {[["all", "All"], ["pending", "⏳ Pending"], ["verified", "✅ Verified"], ["flagged", "🚩 Flagged"]].map(([f, l]) => (
                <button key={f} onClick={() => setNewsFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full border-[1.5px] text-xs font-bold whitespace-nowrap transition-all ${newsFilter === f ? "bg-cn-red border-cn-red text-primary-foreground" : "bg-card border-border text-cn-gray-5"}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {filteredNews.length ? filteredNews.map((n) => (
                <NewsCard key={n.id} news={n} authorityRole={user.role}
                  onVerify={(id) => { verifyNews(id, user.role); notify("🛡 Verified!", "Badge added. Now visible to public.", "ok"); }}
                  onFlag={(id) => { flagNews(id); notify("🚩 Flagged as Misinformation", "Hidden from public feed", "warn"); }}
                  onUnflag={(id) => { unflagNews(id); notify("↩ Unflagged", "Returned to pending queue", "info"); }}
                />
              )) : <div className="text-center py-12 text-muted-foreground"><div className="text-[44px]">📭</div><div className="font-semibold mt-2.5">Nothing here</div></div>}
            </div>
          </>
        )}
        {tab === "post" && (
          <>
            <div className="bg-card rounded-[13px] border border-border p-3.5">
              <div className="rounded-[9px] p-3 flex gap-2.5 items-center mb-3" style={{ background: rc.bg, border: `1.5px solid ${rc.bdr}` }}>
                <span className="text-[22px]">{rc.icon}</span>
                <div><div className="font-bold text-sm" style={{ color: rc.color }}>Posting as {rc.label}</div><div className="text-xs text-muted-foreground">Posts auto-verified with your authority badge</div></div>
              </div>
              <textarea value={postText} onChange={(e) => setPostText(e.target.value)}
                className="w-full p-3 border-[1.5px] border-border rounded-[11px] text-sm resize-y min-h-[110px] outline-none focus:border-cn-red bg-card"
                placeholder={`Post an official ${rc.label} update about NH-48…`} />
              <button onClick={handlePost} className="w-full py-3 rounded-[11px] font-bold text-[15px] mt-2.5 flex items-center justify-center gap-2 tracking-wider"
                style={{ background: rc.grad, color: "#fff" }}>🛡 Publish Verified Update</button>
            </div>
            <div className="text-[17px] font-extrabold mt-4">📋 My Recent Posts</div>
            {news.filter((n) => n.ver === user.role).slice(0, 5).length ? (
              news.filter((n) => n.ver === user.role).slice(0, 5).map((n) => (
                <div key={n.id} className="bg-card rounded-[11px] border border-border p-3 flex gap-2.5 items-start">
                  <span className="text-lg">{rc.icon}</span>
                  <div className="flex-1"><div className="font-semibold text-sm">{n.title}</div><div className="text-[11px] text-muted-foreground mt-0.5">{n.time}</div></div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cn-green-light text-cn-green whitespace-nowrap">🛡 Live</span>
                </div>
              ))
            ) : <div className="text-center py-4 text-muted-foreground text-sm">No posts yet. Write your first update above.</div>}
          </>
        )}
      </div>
      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default AuthorityDashboard;
