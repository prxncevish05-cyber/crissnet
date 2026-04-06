import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import { haversine } from "@/lib/constants";

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
  ambulanceGpsLocation?: { lat: number; lng: number } | null;
}

const LiveMap = ({
  height = 280,
  autoTrack = false,
  statusLabel = "📍 Your Location",
  userLocation,
  ambulanceGpsLocation,
}: LiveMapProps) => {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [animPos, setAnimPos] = useState<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const [eta, setEta] = useState("—");
  const [dist, setDist] = useState("—");

  // When autoTrack starts, capture the ambulance's starting position
  useEffect(() => {
    if (autoTrack && ambulanceGpsLocation && !startPosRef.current) {
      startPosRef.current = { ...ambulanceGpsLocation };
      setAnimPos({ ...ambulanceGpsLocation });
    }
    if (!autoTrack) {
      startPosRef.current = null;
      setAnimPos(null);
    }
  }, [autoTrack, ambulanceGpsLocation]);

  // Animate ambulance toward user location (Uber-style)
  useEffect(() => {
    if (!autoTrack || !isLoaded || !userLocation || !startPosRef.current) return;

    const start = startPosRef.current;
    const dest = userLocation;
    let step = 0;
    const STEPS = 120;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      step++;
      const t = step / STEPS;
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const lat = start.lat + (dest.lat - start.lat) * ease;
      const lng = start.lng + (dest.lng - start.lng) * ease;

      setAnimPos({ lat, lng });
      mapRef.current?.panTo({ lat, lng });

      const d = haversine([lat, lng], [dest.lat, dest.lng]);
      const e = d / 0.4;
      setDist(d < 1 ? (d * 1000).toFixed(0) + " m" : d.toFixed(2) + " km");
      setEta(e < 1 ? "<1 min" : Math.ceil(e) + " min");

      if (step >= STEPS || d < 0.05) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setAnimPos(dest);
        setDist("0 m");
        setEta("Arrived");
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoTrack, isLoaded, userLocation]);

  // Calculate live distance/ETA from real ambulance GPS to user
  useEffect(() => {
    if (!autoTrack || !ambulanceGpsLocation || !userLocation) return;
    const d = haversine(
      [ambulanceGpsLocation.lat, ambulanceGpsLocation.lng],
      [userLocation.lat, userLocation.lng]
    );
    const e = d / 0.4;
    setDist(d < 1 ? (d * 1000).toFixed(0) + " m" : d.toFixed(2) + " km");
    setEta(e < 1 ? "<1 min" : Math.ceil(e) + " min");
  }, [autoTrack, ambulanceGpsLocation, userLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (userLocation) { bounds.extend(userLocation); hasPoints = true; }
    if (ambulanceGpsLocation) { bounds.extend(ambulanceGpsLocation); hasPoints = true; }
    if (animPos) { bounds.extend(animPos); hasPoints = true; }

    if (hasPoints) {
      map.fitBounds(bounds, 60);
    } else if (userLocation) {
      map.setCenter(userLocation);
      map.setZoom(15);
    }
  }, [userLocation, ambulanceGpsLocation, animPos]);

  // Re-fit bounds when locations change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;
    if (userLocation) { bounds.extend(userLocation); hasPoints = true; }
    if (ambulanceGpsLocation) { bounds.extend(ambulanceGpsLocation); hasPoints = true; }
    if (hasPoints && !autoTrack) {
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [userLocation, ambulanceGpsLocation, isLoaded, autoTrack]);

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

  // Default center: user location or India center
  const defaultCenter = userLocation || ambulanceGpsLocation || { lat: 20.5937, lng: 78.9629 };

  // Route line between animated ambulance and user (or real positions)
  const routeStart = animPos || ambulanceGpsLocation;
  const routeEnd = userLocation;
  const showRoute = autoTrack && routeStart && routeEnd;

  return (
    <div className="relative rounded-[14px] overflow-hidden border border-border" style={{ boxShadow: "var(--cn-shadow)" }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle(height)}
        options={defaultOptions}
        onLoad={onLoad}
        zoom={15}
        center={defaultCenter}
      >
        {/* User's live GPS marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            label={{ text: "📍", fontSize: "22px" }}
            title="Your Location"
          />
        )}

        {/* Ambulance real GPS marker (when not tracking, show static) */}
        {!autoTrack && ambulanceGpsLocation && (
          <Marker
            position={ambulanceGpsLocation}
            label={{ text: "🚑", fontSize: "20px" }}
            title="Ambulance Location"
          />
        )}

        {/* Animated ambulance marker (Uber-style, during tracking) */}
        {autoTrack && animPos && (
          <Marker
            position={animPos}
            label={{ text: "🚑", fontSize: "22px" }}
            title="Ambulance · En Route"
          />
        )}

        {/* Route polyline */}
        {showRoute && (
          <Polyline
            path={[routeStart!, routeEnd!]}
            options={{
              strokeColor: "#1D4ED8",
              strokeOpacity: 0.85,
              strokeWeight: 5,
            }}
          />
        )}
      </GoogleMap>

      {/* Status bar */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 flex items-center gap-2 z-[999] pointer-events-none whitespace-nowrap border border-border"
        style={{ background: "rgba(255,255,255,.96)", boxShadow: "0 4px 20px rgba(0,0,0,.18)" }}
      >
        <div className={`w-2 h-2 rounded-full ${autoTrack ? "bg-cn-green cn-animate-ping" : "bg-cn-blue"}`} />
        <span className="text-xs font-bold text-foreground">{statusLabel}</span>
      </div>

      {/* Coordinate pills */}
      {(userLocation || ambulanceGpsLocation) && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-2 z-[999] pointer-events-none flex-wrap justify-center">
          {userLocation && (
            <div className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: "rgba(59,130,246,.9)", color: "#fff" }}>
              📍 {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
            </div>
          )}
          {ambulanceGpsLocation && (
            <div className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ background: "rgba(220,38,38,.9)", color: "#fff" }}>
              🚑 {ambulanceGpsLocation.lat.toFixed(4)}°, {ambulanceGpsLocation.lng.toFixed(4)}°
            </div>
          )}
        </div>
      )}

      {/* Bottom ETA/Distance pill (only during tracking) */}
      {autoTrack && (
        <div
          className="absolute bottom-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-2.5 flex items-center gap-3.5 z-[999] pointer-events-none whitespace-nowrap"
          style={{ background: "#111827", boxShadow: "0 4px 20px rgba(0,0,0,.3)" }}
        >
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
      )}
    </div>
  );
};

export default LiveMap;
