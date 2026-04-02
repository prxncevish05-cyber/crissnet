import { useCallback, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { type Incident, SAFE_ZONES } from "@/lib/constants";
import { useToastNotify } from "@/hooks/useToastNotify";
import IncidentMap from "@/components/IncidentMap";
import { MapPin, Zap, Shield, Clock, Navigation } from "lucide-react";

const UserDashboard = () => {
  const notify = useToastNotify();
  const { addIncident, incidents, sosLoading, setSosLoading, setLastLocation } = useAppStore();
  const [sosTriggered, setSosTriggered] = useState(false);

  const handleSOS = useCallback(() => {
    setSosLoading(true);

    if (!navigator.geolocation) {
      // Fallback location
      const incident: Incident = {
        id: crypto.randomUUID(),
        lat: 18.6012 + (Math.random() - 0.5) * 0.05,
        lng: 73.7634 + (Math.random() - 0.5) * 0.05,
        timestamp: Date.now(),
        status: "unverified",
        type: "sos",
      };
      addIncident(incident);
      setLastLocation([incident.lat, incident.lng]);
      setSosLoading(false);
      setSosTriggered(true);
      notify("🆘 SOS Alert Sent!", "Incident created with approximate location", "ok");
      setTimeout(() => setSosTriggered(false), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const incident: Incident = {
          id: crypto.randomUUID(),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          status: "unverified",
          type: "sos",
        };
        addIncident(incident);
        setLastLocation([incident.lat, incident.lng]);
        setSosLoading(false);
        setSosTriggered(true);
        notify("🆘 SOS Alert Sent!", `Location captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, "ok");
        setTimeout(() => setSosTriggered(false), 3000);
      },
      () => {
        // Fallback on error
        const incident: Incident = {
          id: crypto.randomUUID(),
          lat: 18.6012 + (Math.random() - 0.5) * 0.05,
          lng: 73.7634 + (Math.random() - 0.5) * 0.05,
          timestamp: Date.now(),
          status: "unverified",
          type: "sos",
        };
        addIncident(incident);
        setLastLocation([incident.lat, incident.lng]);
        setSosLoading(false);
        setSosTriggered(true);
        notify("🆘 SOS Alert Sent!", "Using approximate location (GPS unavailable)", "ok");
        setTimeout(() => setSosTriggered(false), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [addIncident, setSosLoading, setLastLocation, notify]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 cn-animate-up">
      {/* SOS Section */}
      <div className="relative flex flex-col items-center justify-center py-12 rounded-2xl bg-card border border-border overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold mb-1">Emergency SOS</h2>
            <p className="text-sm text-muted-foreground">Press the button to send an emergency alert with your location</p>
          </div>

          {/* SOS Button */}
          <div className="relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full bg-primary/20 cn-animate-sos-ring" />
            <div className="absolute inset-0 rounded-full bg-primary/15 cn-animate-sos-ring" style={{ animationDelay: "0.7s" }} />

            <button
              onClick={handleSOS}
              disabled={sosLoading}
              className={`relative w-36 h-36 rounded-full font-extrabold text-xl text-primary-foreground transition-all active:scale-95 ${
                sosTriggered
                  ? "bg-cn-green scale-110"
                  : "bg-primary hover:brightness-110 cn-animate-sos-glow"
              } ${sosLoading ? "opacity-70 cursor-wait" : ""}`}
            >
              {sosLoading ? (
                <div className="w-8 h-8 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full cn-animate-spin mx-auto" />
              ) : sosTriggered ? (
                <span>✓ SENT</span>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Zap size={32} />
                  <span>SOS</span>
                </div>
              )}
            </button>
          </div>

          {sosTriggered && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cn-green-light border border-cn-green/30 cn-animate-up">
              <div className="w-2 h-2 rounded-full bg-cn-green" />
              <span className="text-xs font-bold text-cn-green">Alert sent — Authorities notified</span>
            </div>
          )}
        </div>
      </div>

      {/* Map + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <IncidentMap height={400} />
        </div>

        {/* Stats + Safe Zones */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <MapPin size={18} />, label: "Total Incidents", value: incidents.length, color: "text-primary" },
              { icon: <Shield size={18} />, label: "Verified", value: incidents.filter((i) => i.status === "verified").length, color: "text-cn-green" },
              { icon: <Clock size={18} />, label: "Unverified", value: incidents.filter((i) => i.status === "unverified").length, color: "text-cn-amber" },
              { icon: <Zap size={18} />, label: "SOS Alerts", value: incidents.filter((i) => i.type === "sos").length, color: "text-cn-blue" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-card border border-border">
                <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                <div className="text-2xl font-extrabold">{stat.value}</div>
                <div className="text-[11px] text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Nearby Safe Zones */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Navigation size={16} className="text-cn-green" />
              Nearby Safe Zones
            </h3>
            <div className="space-y-2.5">
              {SAFE_ZONES.map((zone) => (
                <div key={zone.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-cn-green-light flex items-center justify-center text-sm">
                    {zone.type === "hospital" ? "🏥" : zone.type === "police" ? "🚓" : zone.type === "shelter" ? "🏠" : "🚒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{zone.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{zone.type.replace("_", " ")}</div>
                  </div>
                  <span className="text-[10px] font-bold text-cn-green whitespace-nowrap">{zone.distance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
