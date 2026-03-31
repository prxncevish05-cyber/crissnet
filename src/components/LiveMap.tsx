import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { PATIENT_COORD, AMB_START, haversine } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";

function makeAmbIcon() {
  return L.divIcon({
    className: "",
    iconSize: [50, 60],
    iconAnchor: [25, 55],
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <div style="position:absolute;top:50%;left:50%;width:56px;height:56px;border-radius:50%;background:rgba(29,78,216,0.18);transform:translate(-50%,-60%);animation:cn-amb-pulse 1.5s ease infinite"></div>
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1D4ED8,#3B82F6);border:3px solid #fff;box-shadow:0 4px 16px rgba(29,78,216,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;animation:cn-amb-bounce 1s ease infinite;position:relative;z-index:1">🚑</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #1D4ED8;margin-top:-1px"></div>
    </div>`,
  });
}

function makeUserIcon(label: string) {
  return L.divIcon({
    className: "",
    iconSize: [50, 60],
    iconAnchor: [25, 55],
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <div style="position:absolute;top:50%;left:50%;width:64px;height:64px;border-radius:50%;background:rgba(220,38,38,0.15);transform:translate(-50%,-62%);animation:cn-user-pulse 2s ease infinite"></div>
      <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#DC2626,#EF4444);border:3px solid #fff;box-shadow:0 4px 16px rgba(220,38,38,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;z-index:1">🆘</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #DC2626;margin-top:-1px"></div>
      <div style="background:rgba(0,0,0,0.75);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;margin-top:3px;white-space:nowrap">${label}</div>
    </div>`,
  });
}

interface LiveMapProps {
  height?: number;
  autoTrack?: boolean;
  statusLabel?: string;
}

const LiveMap = ({ height = 280, autoTrack = false, statusLabel = "🚑 En Route to Patient" }: LiveMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const ambMarker = useRef<L.Marker | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const setAmbPos = useAppStore((s) => s.setAmbPos);
  const [eta, setEta] = useState("—");
  const [dist, setDist] = useState("—");
  const [speed, setSpeed] = useState("—");

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const mid: [number, number] = [(PATIENT_COORD[0] + AMB_START[0]) / 2, (PATIENT_COORD[1] + AMB_START[1]) / 2];
    const map = L.map(mapRef.current, { center: mid, zoom: 13, zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);

    L.marker(PATIENT_COORD, { icon: makeUserIcon("Patient · NH-48") }).addTo(map)
      .bindPopup("<b>🆘 SOS Location</b><br>Mumbai-Pune Expressway, NH-48");

    ambMarker.current = L.marker(AMB_START, { icon: makeAmbIcon() }).addTo(map)
      .bindPopup("<b>🚑 Ambulance Unit-1</b><br>En route to patient");

    routeLine.current = L.polyline([AMB_START, PATIENT_COORD], {
      color: "#1D4ED8", weight: 5, opacity: 0.85, dashArray: "10, 6",
    }).addTo(map);

    map.fitBounds([PATIENT_COORD, AMB_START], { padding: [40, 40] });
    mapInstance.current = map;

    if (autoTrack) {
      let step = 0;
      const STEPS = 120;
      intervalRef.current = setInterval(() => {
        step++;
        const t = step / STEPS;
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const lat = AMB_START[0] + (PATIENT_COORD[0] - AMB_START[0]) * ease;
        const lng = AMB_START[1] + (PATIENT_COORD[1] - AMB_START[1]) * ease;
        const pos: [number, number] = [lat, lng];

        ambMarker.current?.setLatLng(pos);
        routeLine.current?.setLatLngs([pos, PATIENT_COORD]);
        map.panTo(pos, { animate: true, duration: 0.8 });

        const d = haversine(pos, PATIENT_COORD);
        const e = d / 0.4;
        const distTxt = d < 1 ? (d * 1000).toFixed(0) + " m" : d.toFixed(2) + " km";
        const etaTxt = e < 1 ? "<1 min" : Math.ceil(e) + " min";
        setDist(distTxt);
        setEta(etaTxt);
        setSpeed((15 + Math.random() * 20).toFixed(0) + " km/h");
        setAmbPos(pos);

        if (step >= STEPS || d < 0.05) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          ambMarker.current?.setLatLng(PATIENT_COORD).bindPopup("<b>🚑 Arrived!</b>").openPopup();
          routeLine.current?.setLatLngs([PATIENT_COORD, PATIENT_COORD]);
          setDist("0 m"); setEta("Arrived"); setSpeed("0 km/h");
        }
      }, 2000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      map.remove();
      mapInstance.current = null;
    };
  }, [autoTrack, setAmbPos]);

  return (
    <div className="relative rounded-[14px] overflow-hidden border border-border" style={{ boxShadow: "var(--cn-shadow)" }}>
      <div ref={mapRef} style={{ height, borderRadius: 14, zIndex: 1 }} />
      {/* Status bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 flex items-center gap-2 z-[999] pointer-events-none whitespace-nowrap border border-border"
        style={{ background: "rgba(255,255,255,.96)", boxShadow: "0 4px 20px rgba(0,0,0,.18)" }}>
        <div className="w-2 h-2 rounded-full bg-cn-green cn-animate-ping" style={{ animation: "cn-ping 1.2s ease infinite" }} />
        <span className="text-xs font-bold text-foreground">{statusLabel}</span>
      </div>
      {/* Bottom pill */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-2.5 flex items-center gap-3.5 z-[999] pointer-events-none whitespace-nowrap"
        style={{ background: "#111827", boxShadow: "0 4px 20px rgba(0,0,0,.3)" }}>
        <div className="text-center"><div className="text-[17px] font-extrabold leading-none" style={{ color: "#fff" }}>{eta}</div><div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,.55)" }}>ETA</div></div>
        <div className="w-px h-[26px]" style={{ background: "rgba(255,255,255,.18)" }} />
        <div className="text-center"><div className="text-[17px] font-extrabold leading-none" style={{ color: "#fff" }}>{dist}</div><div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,.55)" }}>Distance</div></div>
        <div className="w-px h-[26px]" style={{ background: "rgba(255,255,255,.18)" }} />
        <div className="text-center"><div className="text-[17px] font-extrabold leading-none" style={{ color: "#22C55E" }}>LIVE</div><div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,.55)" }}>Status</div></div>
      </div>
    </div>
  );
};

export default LiveMap;
