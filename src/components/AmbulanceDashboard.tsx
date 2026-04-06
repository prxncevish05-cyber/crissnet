import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";
import useGeolocation from "@/hooks/useGeolocation";
import TopBar from "@/components/TopBar";
import MenuPanel from "@/components/MenuPanel";
import LiveMap from "@/components/LiveMap";
import { supabase } from "@/integrations/supabase/client";

interface HistoryRecord {
  id: string;
  patient_name: string;
  location: string;
  status: string;
  severity: string;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  distance: string | null;
  eta: number | null;
}

const AmbulanceDashboard = () => {
  const notify = useToastNotify();
  const user = useAppStore((s) => s.user);
  const emergencies = useAppStore((s) => s.emergencies);
  const ambStatus = useAppStore((s) => s.ambStatus);
  const acceptRequest = useAppStore((s) => s.acceptRequest);
  const markReached = useAppStore((s) => s.markReached);
  const sosVideoUrl = useAppStore((s) => s.sosVideoUrl);
  const incidentVerdict = useAppStore((s) => s.incidentVerdict);
  const setIncidentVerdict = useAppStore((s) => s.setIncidentVerdict);
  const setAmbulanceLocation = useAppStore((s) => s.setAmbulanceLocation);
  const userLocation = useAppStore((s) => s.userLocation);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"req" | "nav" | "stats">("req");
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Load ambulance history from database
  useEffect(() => {
    const loadHistory = async () => {
      const { data } = await supabase
        .from("ambulance_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setHistory(data as HistoryRecord[]);
    };
    loadHistory();
  }, [ambStatus]);

  const geo = useGeolocation();
  const ambGeoPos = geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : null;
  const publicUserPos = userLocation ? { lat: userLocation[0], lng: userLocation[1] } : null;

  // Store ambulance GPS location in global state
  useEffect(() => {
    if (geo.lat && geo.lng) {
      setAmbulanceLocation([geo.lat, geo.lng]);
    }
  }, [geo.lat, geo.lng, setAmbulanceLocation]);

  const emg = emergencies[0];
  const pct = ambStatus === "assigned" ? "20%" : ambStatus === "accepted" ? "65%" : "100%";
  const stage = ambStatus === "assigned" ? "Pending your acceptance" : ambStatus === "accepted" ? "En route to patient" : "Completed";

  const tabItems = [
    { id: "req" as const, icon: "📋", label: "Requests" },
    { id: "nav" as const, icon: "🗺️", label: "Navigate" },
    { id: "stats" as const, icon: "📊", label: "Stats" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      <TopBar onMenuOpen={() => setMenuOpen(true)} />
      {/* Banner */}
      <div className="px-4 pt-3.5 pb-0">
        <div className="rounded-[14px] p-4 pb-3.5" style={{ background: ambStatus !== "resolved" ? "linear-gradient(135deg,#991B1B,#DC2626)" : "linear-gradient(135deg,#065F46,#059669)" }}>
          <div className="text-sm font-bold mb-1" style={{ color: "rgba(255,255,255,.75)" }}>{user?.name}</div>
          <div className="text-xl font-extrabold mb-0.5" style={{ color: "#fff" }}>{ambStatus === "resolved" ? "🟢 Available" : "🔴 On Duty"}</div>
          <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,.75)" }}>Unit · NH-48 Zone</div>
          <div className="text-[11px] mb-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,.6)" }}>
            📍 {geo.loading ? "Detecting location…" : geo.error ? "Location unavailable" : (geo.address || `${geo.lat?.toFixed(4)}°N, ${geo.lng?.toFixed(4)}°E`)}
          </div>
          <div className="flex gap-2 pb-1">
            {[["7", "Today"], ["6", "Done"]].map(([n, l]) => (
              <div key={l} className="rounded-[10px] px-3.5 py-2 text-center" style={{ background: "rgba(255,255,255,.18)" }}>
                <div className="text-[22px] font-extrabold" style={{ color: "#fff" }}>{n}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,.7)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="bg-card flex border-b border-border">
        {tabItems.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 border-b-[2.5px] transition-all ${tab === t.id ? "border-cn-red" : "border-transparent"}`}>
            <span className="text-[17px]">{t.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${tab === t.id ? "text-cn-red" : "text-muted-foreground"}`}>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="p-4 flex flex-col gap-3">
        {tab === "req" && (
          <>
            <div className="text-xl font-extrabold">📋 Assigned Emergency</div>
            {emg ? (
              <div className={`bg-card rounded-[14px] border border-border p-4 shadow-cn ${ambStatus === "resolved" ? "border-l-[5px] border-l-cn-green" : "border-l-[5px] border-l-cn-red"}`}>
                <div className="flex justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="font-bold text-[17px]">{emg.userName}</div>
                    <div className="text-sm text-cn-gray-5 mt-1">📍 {emg.location}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase bg-cn-red-light text-cn-red">{emg.severity}</span>
                </div>
                {/* Public user location info */}
                {publicUserPos && (
                  <div className="mb-3 rounded-[9px] p-2.5 flex items-center gap-2" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                    <span className="text-lg">👤</span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3B82F6" }}>Public User Live Location</div>
                      <div className="text-sm font-bold">{publicUserPos.lat.toFixed(4)}°N, {publicUserPos.lng.toFixed(4)}°E</div>
                    </div>
                  </div>
                )}
                <div className="rounded-[5px] h-2 mb-1" style={{ background: "hsl(var(--cn-gray-1))" }}>
                  <div className="h-full rounded-[5px] transition-all duration-500" style={{ width: pct, background: "linear-gradient(90deg,hsl(var(--cn-red)),hsl(var(--cn-amber)))" }} />
                </div>
                <div className="text-xs text-muted-foreground mb-3">{stage}</div>
                <div className="flex gap-2.5 flex-wrap">
                  {ambStatus === "assigned" && (
                    <>
                      <button onClick={async () => {
                        acceptRequest();
                        // Save to ambulance_history
                        const { data: { user: authUser } } = await supabase.auth.getUser();
                        if (emg && authUser) {
                          await supabase.from("ambulance_history").insert({
                            ambulance_user_id: authUser.id,
                            patient_name: emg.userName,
                            location: emg.location,
                            latitude: emg.lat,
                            longitude: emg.lng,
                            severity: emg.severity,
                            status: "accepted",
                            distance: emg.distance,
                            eta: emg.eta,
                            accepted_at: new Date().toISOString(),
                          });
                        }
                        notify("Accepted", "Live tracking started", "ok");
                      }}
                        className="px-4 py-2 rounded-[9px] bg-cn-green-light text-cn-green font-bold text-sm">✅ Accept</button>
                      <button onClick={() => notify("Declined", "Another unit will be dispatched", "warn")}
                        className="px-4 py-2 rounded-[9px] bg-cn-red-light text-cn-red font-bold text-sm">❌ Decline</button>
                    </>
                  )}
                  {ambStatus === "accepted" && (
                    <button onClick={async () => {
                      markReached();
                      // Update history record
                      const { data: { user: authUser } } = await supabase.auth.getUser();
                      if (authUser) {
                        const { data: records } = await supabase
                          .from("ambulance_history")
                          .select("id")
                          .eq("ambulance_user_id", authUser.id)
                          .eq("status", "accepted")
                          .order("created_at", { ascending: false })
                          .limit(1);
                        if (records?.[0]) {
                          await supabase.from("ambulance_history")
                            .update({ status: "resolved", resolved_at: new Date().toISOString() })
                            .eq("id", records[0].id);
                        }
                      }
                      notify("Reached Patient", "Ambulance now available again", "ok");
                    }}
                      className="px-5 py-2 rounded-[9px] bg-cn-blue font-bold text-sm" style={{ color: "#fff" }}>🏁 Mark Reached</button>
                  )}
                  {ambStatus === "resolved" && <span className="text-cn-green font-bold text-sm">✅ Completed</span>}
                </div>
                {/* Video Evidence Section */}
                {sosVideoUrl && (
                  <div className="mt-3 rounded-[12px] border border-border overflow-hidden bg-card">
                    <div className="px-3 py-2 flex items-center gap-2" style={{ background: "#FFF7ED", borderBottom: "1px solid #FED7AA" }}>
                      <span className="text-lg">📹</span>
                      <span className="font-bold text-sm text-cn-amber">Incident Video Evidence</span>
                      {incidentVerdict !== "pending" && (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${incidentVerdict === "real" ? "bg-cn-green-light text-cn-green" : "bg-cn-red-light text-cn-red"}`}>
                          {incidentVerdict === "real" ? "✅ Verified Real" : "❌ Marked Fake"}
                        </span>
                      )}
                    </div>
                    <video
                      src={sosVideoUrl}
                      controls
                      playsInline
                      className="w-full h-[200px] object-cover bg-black"
                    />
                    {incidentVerdict === "pending" && (
                      <div className="p-3 flex gap-2">
                        <button
                          onClick={() => { setIncidentVerdict("real"); notify("Incident Verified", "Marked as REAL — proceeding with dispatch", "ok"); }}
                          className="flex-1 py-2.5 rounded-[9px] bg-cn-green-light text-cn-green font-bold text-sm flex items-center justify-center gap-1.5"
                        >
                          ✅ Real Incident
                        </button>
                        <button
                          onClick={() => { setIncidentVerdict("fake"); notify("Incident Flagged", "Marked as FAKE — authorities notified", "err"); }}
                          className="flex-1 py-2.5 rounded-[9px] bg-cn-red-light text-cn-red font-bold text-sm flex items-center justify-center gap-1.5"
                        >
                          ❌ Fake / Prank
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground"><div className="text-[50px]">🚑</div><div className="font-semibold mt-3">No active assignment</div></div>
            )}
            <div className="text-xl font-extrabold mt-1">🗺️ Live Zone Map</div>
            <LiveMap height={260} autoTrack={ambStatus === "accepted"} statusLabel={ambStatus === "accepted" ? "🚑 En Route to Patient" : "📍 Your Location"} userLocation={publicUserPos} ambulanceGpsLocation={ambGeoPos} />
          </>
        )}
        {tab === "nav" && (
          <>
            <div className="text-xl font-extrabold">🗺️ Navigate to Patient</div>
            <div className="grid grid-cols-2 gap-3">
              {[["📍", emg?.distance ? emg.distance + " km" : "— km", "Distance", "text-cn-red"],
                ["⏱️", emg?.eta ? emg.eta + " min" : "— min", "ETA", "text-cn-blue"],
                ["🚗", "45 km/h", "Speed", "text-cn-green"],
                ["🛣️", "NH-48", "Route", "text-cn-amber"]
              ].map(([i, v, l, c]) => (
                <div key={l} className="bg-card rounded-[13px] border border-border p-4 text-center shadow-cn">
                  <div className="text-[26px]">{i}</div>
                  <div className={`text-[26px] font-extrabold mt-1 ${c}`}>{v}</div>
                  <div className="text-xs text-muted-foreground font-semibold">{l}</div>
                </div>
              ))}
            </div>
            <LiveMap height={320} autoTrack={ambStatus === "accepted"} statusLabel={ambStatus === "accepted" ? "🚑 Navigating to Patient" : "📍 Your Location"} userLocation={publicUserPos} ambulanceGpsLocation={ambGeoPos} />
            <div className="rounded-[11px] p-3.5 text-cn-blue font-semibold text-sm" style={{ background: "hsl(var(--cn-blue-light))" }}>
              📍 Patient: Mumbai-Pune Expressway, NH-48, Khopoli Exit
            </div>
          </>
        )}
        {tab === "stats" && (
          <>
            <div className="text-xl font-extrabold">📊 My Performance</div>
            <div className="grid grid-cols-2 gap-3">
              {[["🚑", "247", "Total Calls", "text-cn-red"], ["✅", "241", "Completed", "text-cn-green"], ["⏱️", "3.8 min", "Avg ETA", "text-cn-blue"], ["⭐", "4.9/5", "Rating", "text-cn-amber"]].map(([i, v, l, c]) => (
                <div key={l} className="bg-card rounded-[13px] border border-border p-4 text-center shadow-cn">
                  <div className="text-[26px]">{i}</div><div className={`text-[26px] font-extrabold mt-1 ${c}`}>{v}</div><div className="text-xs text-muted-foreground font-semibold">{l}</div>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-[13px] border border-border p-4">
              <div className="text-base font-bold mb-3">Today's History</div>
              {[["Accident NH-48 Km 42", "09:14"], ["Medical Emergency Pune", "07:32"], ["Accident near Khalapur", "06:10"]].map(([t, time]) => (
                <div key={t} className="flex justify-between py-2 border-b border-cn-gray-0 items-center">
                  <div><div className="font-semibold text-sm">{t}</div><div className="text-[11px] text-muted-foreground">{time}</div></div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cn-green-light text-cn-green">Resolved</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default AmbulanceDashboard;
