import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import { PATIENT_COORD, AMB_START, haversine } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";

const GOOGLE_MAPS_API_KEY = "AIzaSyA-W0RTwoKplDVn6tYcgb0mSm63LvDFXE0";

const mapContainerStyle = (h: number) => ({
  width: "100%",
  height: h,
  borderRadius: 14,
});

const defaultOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

interface LiveMapProps {
  height?: number;
  autoTrack?: boolean;
  statusLabel?: string;
  userLocation?: { lat: number; lng: number } | null;
}

const LiveMap = ({ height = 280, autoTrack = false, statusLabel = "🚑 En Route to Patient", userLocation }: LiveMapProps) => {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef<google.maps.Map | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const setAmbPos = useAppStore((s) => s.setAmbPos);

  const [ambPosition, setAmbPosition] = useState<{ lat: number; lng: number }>({ lat: AMB_START[0], lng: AMB_START[1] });
  const [eta, setEta] = useState("—");
  const [dist, setDist] = useState("—");
  const [arrived, setArrived] = useState(false);

  const patientPos = { lat: PATIENT_COORD[0], lng: PATIENT_COORD[1] };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(patientPos);
    bounds.extend({ lat: AMB_START[0], lng: AMB_START[1] });
    map.fitBounds(bounds, 50);
  }, []);

  useEffect(() => {
    if (!autoTrack || !isLoaded) return;

    let step = 0;
    const STEPS = 120;

    intervalRef.current = setInterval(() => {
      step++;
      const t = step / STEPS;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const lat = AMB_START[0] + (PATIENT_COORD[0] - AMB_START[0]) * ease;
      const lng = AMB_START[1] + (PATIENT_COORD[1] - AMB_START[1]) * ease;
      const pos: [number, number] = [lat, lng];

      setAmbPosition({ lat, lng });
      mapRef.current?.panTo({ lat, lng });

      const d = haversine(pos, PATIENT_COORD);
      const e = d / 0.4;
      setDist(d < 1 ? (d * 1000).toFixed(0) + " m" : d.toFixed(2) + " km");
      setEta(e < 1 ? "<1 min" : Math.ceil(e) + " min");
      setAmbPos(pos);

      if (step >= STEPS || d < 0.05) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setAmbPosition(patientPos);
        setDist("0 m");
        setEta("Arrived");
        setArrived(true);
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoTrack, isLoaded, setAmbPos]);

  if (!isLoaded) {
    return (
      <div className="relative rounded-[14px] overflow-hidden border border-border flex items-center justify-center bg-muted" style={{ height, boxShadow: "var(--cn-shadow)" }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full cn-animate-spin" />
          <span className="text-xs font-semibold">Loading map…</span>
        </div>
      </div>
    );
  }

  const routePath = [ambPosition, patientPos];

  return (
    <div className="relative rounded-[14px] overflow-hidden border border-border" style={{ boxShadow: "var(--cn-shadow)" }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle(height)}
        options={defaultOptions}
        onLoad={onLoad}
        zoom={13}
        center={{ lat: (PATIENT_COORD[0] + AMB_START[0]) / 2, lng: (PATIENT_COORD[1] + AMB_START[1]) / 2 }}
      >
        {/* Patient marker */}
        <Marker
          position={patientPos}
          label={{ text: "🆘", fontSize: "20px" }}
          title="Patient · NH-48"
        />
        {/* Ambulance marker */}
        <Marker
          position={ambPosition}
          label={{ text: "🚑", fontSize: "20px" }}
          title="Ambulance Unit-1"
        />
        {/* Route line */}
        <Polyline
          path={routePath}
          options={{
            strokeColor: "#1D4ED8",
            strokeOpacity: 0.85,
            strokeWeight: 5,
          }}
        />
      </GoogleMap>

      {/* Status bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 flex items-center gap-2 z-[999] pointer-events-none whitespace-nowrap border border-border"
        style={{ background: "rgba(255,255,255,.96)", boxShadow: "0 4px 20px rgba(0,0,0,.18)" }}>
        <div className="w-2 h-2 rounded-full bg-cn-green cn-animate-ping" />
        <span className="text-xs font-bold text-foreground">{statusLabel}</span>
      </div>

      {/* Bottom pill */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-2.5 flex items-center gap-3.5 z-[999] pointer-events-none whitespace-nowrap"
        style={{ background: "#111827", boxShadow: "0 4px 20px rgba(0,0,0,.3)" }}>
        <div className="text-center">
          <div className="text-[17px] font-extrabold leading-none" style={{ color: "#fff" }}>{eta}</div>
          <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,.55)" }}>ETA</div>
        </div>
        <div className="w-px h-[26px]" style={{ background: "rgba(255,255,255,.18)" }} />
        <div className="text-center">
          <div className="text-[17px] font-extrabold leading-none" style={{ color: "#fff" }}>{dist}</div>
          <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,.55)" }}>Distance</div>
        </div>
        <div className="w-px h-[26px]" style={{ background: "rgba(255,255,255,.18)" }} />
        <div className="text-center">
          <div className="text-[17px] font-extrabold leading-none" style={{ color: "#22C55E" }}>LIVE</div>
          <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(255,255,255,.55)" }}>Status</div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
