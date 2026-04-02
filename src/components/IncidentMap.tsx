import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAppStore } from "@/stores/appStore";
import { DEFAULT_CENTER } from "@/lib/constants";

function makeIncidentIcon(status: "unverified" | "verified") {
  const color = status === "verified" ? "#22C55E" : "#EF4444";
  const bgLight = status === "verified" ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)";
  const emoji = status === "verified" ? "✅" : "🆘";
  return L.divIcon({
    className: "",
    iconSize: [40, 50],
    iconAnchor: [20, 45],
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="position:absolute;top:40%;left:50%;width:48px;height:48px;border-radius:50%;background:${bgLight};transform:translate(-50%,-60%);animation:cn-user-pulse 2s ease infinite"></div>
      <div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,.9);box-shadow:0 4px 12px ${color}80;display:flex;align-items:center;justify-content:center;font-size:16px;position:relative;z-index:1">${emoji}</div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid ${color};margin-top:-1px"></div>
    </div>`,
  });
}

interface IncidentMapProps {
  height?: number;
}

const IncidentMap = ({ height = 350 }: IncidentMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const incidents = useAppStore((s) => s.incidents);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });
    // Dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when incidents change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    incidents.forEach((inc) => {
      const marker = L.marker([inc.lat, inc.lng], { icon: makeIncidentIcon(inc.status) })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px">
            <div style="font-weight:800;font-size:14px;margin-bottom:6px">${inc.status === "verified" ? "✅ Verified" : "🆘 Unverified"} Incident</div>
            <div style="font-size:12px;opacity:.7;margin-bottom:4px">📍 ${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}</div>
            <div style="font-size:12px;opacity:.7;margin-bottom:4px">🕐 ${new Date(inc.timestamp).toLocaleTimeString()}</div>
            <div style="font-size:12px;opacity:.7">Type: ${inc.type.toUpperCase()}</div>
            ${inc.verifiedBy ? `<div style="font-size:12px;color:#22C55E;font-weight:600;margin-top:4px">Verified by: ${inc.verifiedBy}</div>` : ""}
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Fit bounds if incidents exist
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(incidents.map((i) => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [incidents]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border" style={{ boxShadow: "var(--cn-shadow-lg)" }}>
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cn-green cn-animate-ping" />
          <span className="text-sm font-bold">Live Incident Map</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Unverified</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cn-green inline-block" /> Verified</span>
        </div>
      </div>
      <div ref={mapRef} style={{ height }} />
    </div>
  );
};

export default IncidentMap;
