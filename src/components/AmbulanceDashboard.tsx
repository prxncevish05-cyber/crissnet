import { useState, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";
import useGeolocation from "@/hooks/useGeolocation";
import TopBar from "@/components/TopBar";
import MenuPanel from "@/components/MenuPanel";
import LiveMap from "@/components/LiveMap";
import { supabase } from "@/integrations/supabase/client";

interface SOSRequest {
  id: string;
  patient_name: string;
  patient_phone: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  severity: string;
  status: string;
  distance: string | null;
  eta: number | null;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  patient_user_id: string | null;
  ambulance_user_id: string | null;
}

const AmbulanceDashboard = () => {
  const notify = useToastNotify();
  const user = useAppStore((s) => s.user);
  const setAmbulanceLocation = useAppStore((s) => s.setAmbulanceLocation);
  const sosVideoUrl = useAppStore((s) => s.sosVideoUrl);
  const incidentVerdict = useAppStore((s) => s.incidentVerdict);
  const setIncidentVerdict = useAppStore((s) => s.setIncidentVerdict);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"req" | "nav" | "stats">("req");
  const [activeRequest, setActiveRequest] = useState<SOSRequest | null>(null);
  const [history, setHistory] = useState<SOSRequest[]>([]);

  const geo = useGeolocation();
  const ambGeoPos = geo.lat && geo.lng ? { lat: geo.lat, lng: geo.lng } : null;
  const patientPos = activeRequest?.latitude && activeRequest?.longitude
    ? { lat: activeRequest.latitude, lng: activeRequest.longitude } : null;

  // Store ambulance GPS location in global state
  useEffect(() => {
    if (geo.lat && geo.lng) {
      setAmbulanceLocation([geo.lat, geo.lng]);
    }
  }, [geo.lat, geo.lng, setAmbulanceLocation]);

  // Load pending/active requests and history from DB
  const loadData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Load active request (pending for any ambulance, or accepted by this ambulance)
    const { data: pending } = await supabase
      .from("ambulance_history")
      .select("*")
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (pending && pending.length > 0) {
      const req = pending[0] as SOSRequest;
      // Show pending requests or requests accepted by this user
      if (req.status === "pending" || (req.status === "accepted" && authUser && req.ambulance_user_id === authUser.id)) {
        setActiveRequest(req);
      } else {
        setActiveRequest(null);
      }
    } else {
      setActiveRequest(null);
    }

    // Load history
    const { data: hist } = await supabase
      .from("ambulance_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (hist) setHistory(hist as SOSRequest[]);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time subscription for new SOS requests
  useEffect(() => {
    const channel = supabase
      .channel("ambulance-sos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ambulance_history" },
        (payload) => {
          console.log("Realtime SOS event:", payload);
          const record = payload.new as SOSRequest;

          if (payload.eventType === "INSERT" && record.status === "pending") {
            // New SOS request came in!
            setActiveRequest(record);
            notify("🚨 NEW SOS ALERT!", `${record.patient_name} needs help at ${record.location}`, "err");
          } else if (payload.eventType === "UPDATE") {
            // Refresh data
            loadData();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAccept = async () => {
    if (!activeRequest) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { error } = await supabase
      .from("ambulance_history")
      .update({
        status: "accepted",
        ambulance_user_id: authUser.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", activeRequest.id);

    if (error) {
      notify("Error", "Could not accept request", "err");
      return;
    }

    setActiveRequest({ ...activeRequest, status: "accepted", ambulance_user_id: authUser.id });
    notify("✅ Accepted", "Live tracking started — navigate to patient", "ok");
  };

  const handleMarkReached = async () => {
    if (!activeRequest) return;

    const { error } = await supabase
      .from("ambulance_history")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", activeRequest.id);

    if (error) {
      notify("Error", "Could not update status", "err");
      return;
    }

    setActiveRequest(null);
    notify("🏁 Reached Patient", "Ambulance now available again", "ok");
    loadData();
  };

  const status = activeRequest?.status || "none";
  const pct = status === "pending" ? "20%" : status === "accepted" ? "65%" : "100%";
  const stage = status === "pending" ? "Pending your acceptance" : status === "accepted" ? "En route to patient" : "Completed";

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
        <div className="rounded-[14px] p-4 pb-3.5" style={{ background: activeRequest ? "linear-gradient(135deg,#991B1B,#DC2626)" : "linear-gradient(135deg,#065F46,#059669)" }}>
          <div className="text-sm font-bold mb-1" style={{ color: "rgba(255,255,255,.75)" }}>{user?.name}</div>
          <div className="text-xl font-extrabold mb-0.5" style={{ color: "#fff" }}>{activeRequest ? "🔴 On Duty" : "🟢 Available"}</div>
          <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,.75)" }}>Ambulance Unit</div>
          <div className="text-[11px] mb-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,.6)" }}>
            📍 {geo.loading ? "Detecting location…" : geo.error ? "Location unavailable" : (geo.address || `${geo.lat?.toFixed(4)}°N, ${geo.lng?.toFixed(4)}°E`)}
          </div>
          <div className="flex gap-2 pb-1">
            {[
              [String(history.filter(h => h.status === "resolved").length), "Done"],
              [String(history.length), "Total"],
            ].map(([n, l]) => (
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
            <div className="text-xl font-extrabold">📋 Emergency Requests</div>
            {activeRequest ? (
              <div className={`bg-card rounded-[14px] border border-border p-4 shadow-cn ${activeRequest.status === "resolved" ? "border-l-[5px] border-l-cn-green" : "border-l-[5px] border-l-cn-red"}`}>
                <div className="flex justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <div className="font-bold text-[17px]">👤 {activeRequest.patient_name}</div>
                    <div className="text-sm text-cn-gray-5 mt-1">📍 {activeRequest.location}</div>
                    {activeRequest.patient_phone && (
                      <div className="text-sm text-cn-gray-5 mt-0.5">📞 {activeRequest.patient_phone}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      🕐 {new Date(activeRequest.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase bg-cn-red-light text-cn-red h-fit">{activeRequest.severity}</span>
                </div>
                {/* Patient GPS location */}
                {patientPos && (
                  <div className="mb-3 rounded-[9px] p-2.5 flex items-center gap-2" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                    <span className="text-lg">📍</span>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#3B82F6" }}>Patient Live Location</div>
                      <div className="text-sm font-bold">{patientPos.lat.toFixed(4)}°N, {patientPos.lng.toFixed(4)}°E</div>
                    </div>
                  </div>
                )}
                <div className="rounded-[5px] h-2 mb-1" style={{ background: "hsl(var(--cn-gray-1))" }}>
                  <div className="h-full rounded-[5px] transition-all duration-500" style={{ width: pct, background: "linear-gradient(90deg,hsl(var(--cn-red)),hsl(var(--cn-amber)))" }} />
                </div>
                <div className="text-xs text-muted-foreground mb-3">{stage}</div>
                <div className="flex gap-2.5 flex-wrap">
                  {activeRequest.status === "pending" && (
                    <>
                      <button onClick={handleAccept}
                        className="px-4 py-2 rounded-[9px] bg-cn-green-light text-cn-green font-bold text-sm">✅ Accept</button>
                      <button onClick={() => notify("Declined", "Another unit will be dispatched", "warn")}
                        className="px-4 py-2 rounded-[9px] bg-cn-red-light text-cn-red font-bold text-sm">❌ Decline</button>
                    </>
                  )}
                  {activeRequest.status === "accepted" && (
                    <button onClick={handleMarkReached}
                      className="px-5 py-2 rounded-[9px] bg-cn-blue font-bold text-sm" style={{ color: "#fff" }}>🏁 Mark Reached</button>
                  )}
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
                    <video src={sosVideoUrl} controls playsInline className="w-full h-[200px] object-cover bg-black" />
                    {incidentVerdict === "pending" && (
                      <div className="p-3 flex gap-2">
                        <button onClick={() => { setIncidentVerdict("real"); notify("Incident Verified", "Marked as REAL", "ok"); }}
                          className="flex-1 py-2.5 rounded-[9px] bg-cn-green-light text-cn-green font-bold text-sm flex items-center justify-center gap-1.5">✅ Real</button>
                        <button onClick={() => { setIncidentVerdict("fake"); notify("Incident Flagged", "Marked as FAKE", "err"); }}
                          className="flex-1 py-2.5 rounded-[9px] bg-cn-red-light text-cn-red font-bold text-sm flex items-center justify-center gap-1.5">❌ Fake</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-[50px]">🚑</div>
                <div className="font-semibold mt-3">No Active Requests</div>
                <div className="text-sm mt-1">Waiting for SOS alerts from public users…</div>
                <div className="mt-3 w-8 h-8 border-[3px] rounded-full cn-animate-spin mx-auto" style={{ borderColor: "hsl(var(--cn-gray-2))", borderTopColor: "hsl(var(--cn-red))" }} />
              </div>
            )}
            <div className="text-xl font-extrabold mt-1">🗺️ Live Zone Map</div>
            <LiveMap height={260} autoTrack={activeRequest?.status === "accepted"} statusLabel={activeRequest?.status === "accepted" ? "🚑 En Route to Patient" : "📍 Your Location"} userLocation={patientPos} ambulanceGpsLocation={ambGeoPos} />
          </>
        )}
        {tab === "nav" && (
          <>
            <div className="text-xl font-extrabold">🗺️ Navigate to Patient</div>
            {!activeRequest || activeRequest.status === "pending" ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-[44px]">🗺️</div>
                <div className="font-semibold mt-2.5">No Active Navigation</div>
                <div className="text-sm mt-1">Accept a request to start navigation</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[["📍", activeRequest.distance ? activeRequest.distance + " km" : "Calculating…", "Distance", "text-cn-red"],
                    ["⏱️", activeRequest.eta ? activeRequest.eta + " min" : "—", "ETA", "text-cn-blue"],
                    ["🚗", "—", "Speed", "text-cn-green"],
                    ["📍", "GPS", "Route", "text-cn-amber"]
                  ].map(([i, v, l, c]) => (
                    <div key={l} className="bg-card rounded-[13px] border border-border p-4 text-center shadow-cn">
                      <div className="text-[26px]">{i}</div>
                      <div className={`text-[26px] font-extrabold mt-1 ${c}`}>{v}</div>
                      <div className="text-xs text-muted-foreground font-semibold">{l}</div>
                    </div>
                  ))}
                </div>
                <LiveMap height={320} autoTrack statusLabel="🚑 Navigating to Patient" userLocation={patientPos} ambulanceGpsLocation={ambGeoPos} />
                <div className="rounded-[11px] p-3.5 text-cn-blue font-semibold text-sm" style={{ background: "hsl(var(--cn-blue-light))" }}>
                  📍 Patient: {activeRequest.location}
                </div>
              </>
            )}
          </>
        )}
        {tab === "stats" && (
          <>
            <div className="text-xl font-extrabold">📊 My Performance</div>
            <div className="grid grid-cols-2 gap-3">
              {[["🚑", String(history.length), "Total Calls", "text-cn-red"],
                ["✅", String(history.filter(h => h.status === "resolved").length), "Completed", "text-cn-green"],
                ["⏱️", history.length ? (history.reduce((s, h) => s + (h.eta || 0), 0) / history.length).toFixed(1) + " min" : "— min", "Avg ETA", "text-cn-blue"],
                ["⭐", "4.9/5", "Rating", "text-cn-amber"]
              ].map(([i, v, l, c]) => (
                <div key={l} className="bg-card rounded-[13px] border border-border p-4 text-center shadow-cn">
                  <div className="text-[26px]">{i}</div><div className={`text-[26px] font-extrabold mt-1 ${c}`}>{v}</div><div className="text-xs text-muted-foreground font-semibold">{l}</div>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-[13px] border border-border p-4">
              <div className="text-base font-bold mb-3">📋 Ambulance History</div>
              {history.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No records yet.</div>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="flex justify-between py-2.5 border-b border-cn-gray-0 items-center">
                    <div>
                      <div className="font-semibold text-sm">👤 {h.patient_name}</div>
                      <div className="text-[11px] text-muted-foreground">📍 {h.location}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${h.status === "resolved" ? "bg-cn-green-light text-cn-green" : h.status === "accepted" ? "bg-cn-blue-light text-cn-blue" : "bg-cn-amber-light text-cn-amber"}`}>
                      {h.status === "resolved" ? "✅ Resolved" : h.status === "accepted" ? "🚑 Active" : "⏳ Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default AmbulanceDashboard;
