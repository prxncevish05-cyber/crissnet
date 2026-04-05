import { useState, useEffect } from "react";

interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  address: string | null;
}

const useGeolocation = (watch = true) => {
  const [geo, setGeo] = useState<GeoState>({
    lat: null, lng: null, accuracy: null, loading: true, error: null, address: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo((g) => ({ ...g, loading: false, error: "Geolocation not supported" }));
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setGeo((g) => ({
        ...g,
        lat: latitude,
        lng: longitude,
        accuracy,
        loading: false,
        error: null,
      }));

      // Reverse geocode via Google
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const addr = results[0].formatted_address;
            setGeo((g) => ({ ...g, address: addr }));
          }
        });
      }
    };

    const onError = (err: GeolocationPositionError) => {
      setGeo((g) => ({ ...g, loading: false, error: err.message }));
    };

    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 };

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, opts);
      return () => navigator.geolocation.clearWatch(id);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    }
  }, [watch]);

  return geo;
};

export default useGeolocation;
