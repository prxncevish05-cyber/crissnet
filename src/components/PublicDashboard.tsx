import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";
import useGeolocation from "@/hooks/useGeolocation";
import TopBar from "@/components/TopBar";
import MenuPanel from "@/components/MenuPanel";
import NewsTicker from "@/components/NewsTicker";
import SOSButton from "@/components/SOSButton";
import SOSVideoRecorder from "@/components/SOSVideoRecorder";
import LiveMap from "@/components/LiveMap";
import NewsCard from "@/components/NewsCard";
import LiveNewsFeed from "@/components/LiveNewsFeed";

const PublicDashboard = () => {
  const notify = useToastNotify();
  const user = useAppStore((s) => s.user);
  const myEmg = useAppStore((s) => s.myEmergency);
  const sosState = useAppStore((s) => s.sosState);
  const news = useAppStore((s) => s.news);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const ambulanceLocation = useAppStore((s) => s.ambulanceLocation);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"alert" | "track" | "news">("alert");
  const [newsFilter, setNewsFilter] = useState("live");

  const geo = useGeolocation();
  const userPos = geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : null;
  const ambGpsPos = ambulanceLocation ? { lat: ambulanceLocation[0], lng: ambulanceLocation[1] } : null;

  useEffect(() => {
    if (geo.lat && geo.lng) {
      setUserLocation([geo.lat, geo.lng]);
    }
  }, [geo.lat, geo.lng, setUserLocation]);
  const tabs = [
    { id: "alert" as const, icon: "🚨", label: "Alert" },
    { id: "track" as const, icon: "🗺️", label: "Track" },
    { id: "news" as const, icon: "📰", label: "News" },
  ];

  const verifiedNews = news.filter((n) => n.ver && !n.flag);
  const filteredNews = newsFilter === "all" ? verifiedNews : verifiedNews.filter((n) => n.cat === newsFilter);

  return (
    <div className="flex justify-center bg-cn-gray-1 min-h-screen">
      <div className="w-full max-w-[440px] bg-card min-h-screen flex flex-col" style={{ boxShadow: "0 0 60px rgba(0,0,0,.12)" }}>
        <TopBar onMenuOpen={() => setMenuOpen(true)} />
        <NewsTicker />
        <div className="flex-1 overflow-y-auto pb-20">
          {tab === "alert" && (
            <div>
              {/* Location banner */}
              <div className="mx-4 mt-3 p-3 flex gap-3 items-center rounded-[13px] border-[1.5px]" style={{ background: "#FFF5F5", borderColor: "#FECACA" }}>
                <div className="w-9 h-9 rounded-full bg-cn-red flex items-center justify-center text-[17px] shrink-0">📍</div>
                <div>
                  <div className="text-[9px] font-bold text-cn-red uppercase tracking-wider">
                    {geo.loading ? "Detecting Location…" : "Current Location"}
                  </div>
                  <div className="font-bold text-sm">
                    {geo.loading ? "Acquiring GPS…" : geo.error ? "Mumbai-Pune Expressway, NH-48" : (geo.address || `${geo.lat?.toFixed(4)}°N, ${geo.lng?.toFixed(4)}°E`)}
                  </div>
                </div>
              </div>
              <SOSButton />
              {sosState === "activated" && <SOSVideoRecorder />}
              {myEmg && (
                <div className="mx-4 mt-2.5 p-3.5 rounded-[13px] border-[1.5px]" style={{ background: "#F0FDF4", borderColor: "#86EFAC" }}>
                  <div className="font-bold text-cn-green text-[15px] flex items-center gap-2">🚑 Ambulance Dispatched!</div>
                  <div className="grid grid-cols-2 gap-2 mt-2.5">
                    {[["Unit", myEmg.ambulanceName || "Unit-1"], ["Distance", myEmg.distance + " km"], ["ETA", myEmg.eta + " min"], ["Status", "En Route 🚑"]].map(([k, v]) => (
                      <div key={k} className="bg-card rounded-[9px] p-2">
                        <div className="text-[10px] text-muted-foreground uppercase font-semibold">{k}</div>
                        <div className="font-bold text-sm">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3 mx-4 mt-3 mb-3.5">
                <button onClick={() => notify("Report submitted", "Forwarded to NHAI & Police", "ok")}
                  className="bg-card border-[1.5px] border-border rounded-[13px] p-4 flex flex-col items-center gap-2 shadow-cn hover:shadow-cn-lg transition-all">
                  <div className="w-[46px] h-[46px] bg-cn-blue-light rounded-full flex items-center justify-center text-[22px]">⚠️</div>
                  <div className="font-bold text-sm text-cn-gray-7 text-center leading-snug">Report Minor<br/>Incident</div>
                </button>
                <button onClick={() => notify("Connecting to Police…", "Dial 100 for emergencies", "info")}
                  className="bg-card border-[1.5px] border-border rounded-[13px] p-4 flex flex-col items-center gap-2 shadow-cn hover:shadow-cn-lg transition-all">
                  <div className="w-[46px] h-[46px] bg-cn-blue-light rounded-full flex items-center justify-center text-[22px]">📞</div>
                  <div className="font-bold text-sm text-cn-gray-7 text-center leading-snug">Contact Police</div>
                </button>
              </div>
            </div>
          )}
          {tab === "track" && (
            <div>
              <div className="px-4 py-3"><div className="text-xl font-extrabold">🗺️ Live Tracking</div></div>
              {!myEmg ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="text-[52px]">🗺️</div>
                  <div className="font-semibold mt-2.5">No Active Emergency</div>
                  <div className="text-sm mt-1">Press SOS on Alert tab to start tracking</div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-2.5 mx-4 mt-3">
                    {[["⏱️", myEmg.eta + " min", "ETA"], ["📍", myEmg.distance + " km", "Dist"], ["🚦", "Active", "Status"]].map(([i, v, l]) => (
                      <div key={l} className="bg-card border border-border rounded-[11px] p-3 text-center shadow-cn">
                        <div className="text-lg">{i}</div>
                        <div className="text-lg font-extrabold text-cn-red">{v}</div>
                        <div className="text-[9px] text-muted-foreground uppercase font-semibold">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mx-4 mt-3">
                    <LiveMap height={300} autoTrack statusLabel="🚑 En Route · NH-48" userLocation={userPos} />
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "news" && (
            <div>
              <div className="px-4 py-3"><div className="text-xl font-extrabold">📰 News</div></div>
              <div className="flex gap-2 overflow-x-auto px-4 pb-1 cn-hide-scrollbar">
                {["live", "all", "accident", "weather", "road", "health"].map((f) => (
                  <button key={f} onClick={() => setNewsFilter(f)}
                    className={`px-3.5 py-1.5 rounded-full border-[1.5px] text-xs font-bold whitespace-nowrap transition-all ${newsFilter === f ? "bg-cn-red border-cn-red text-primary-foreground" : "bg-card border-border text-cn-gray-5"}`}>
                    {f === "live" ? "📡 Live" : f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {newsFilter === "live" ? (
                <LiveNewsFeed />
              ) : (
                <div className="px-4 flex flex-col gap-2.5 mt-2.5">
                  {filteredNews.length ? filteredNews.map((n) => <NewsCard key={n.id} news={n} />) : (
                    <div className="text-center py-12 text-muted-foreground"><div className="text-[44px]">📭</div><div className="font-semibold mt-2.5">No verified updates</div></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Bottom nav */}
        <div className="sticky bottom-0 bg-card border-t border-border flex shadow-cn z-50">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-2.5 flex flex-col items-center gap-1">
              <div className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-lg transition-colors ${tab === t.id ? "bg-cn-red" : "bg-cn-gray-1"}`}>
                {t.icon}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${tab === t.id ? "text-cn-red" : "text-muted-foreground"}`}>{t.label}</span>
            </button>
          ))}
        </div>
        <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </div>
  );
};

export default PublicDashboard;
