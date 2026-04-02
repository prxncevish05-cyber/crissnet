export type UserRole = "user" | "police" | "hospital" | "nhai";

export interface RoleConfig {
  label: string;
  icon: string;
  color: string;
  grad: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  user:     { label: "User",     icon: "👤", color: "#3B82F6", grad: "linear-gradient(135deg,#DC2626,#EF4444)" },
  police:   { label: "Police",   icon: "🚓", color: "#6366F1", grad: "linear-gradient(135deg,#4338CA,#6366F1)" },
  hospital: { label: "Hospital", icon: "🏥", color: "#059669", grad: "linear-gradient(135deg,#065F46,#059669)" },
  nhai:     { label: "NHAI",     icon: "🛣️", color: "#D97706", grad: "linear-gradient(135deg,#92400E,#D97706)" },
};

export const VERIFICATION_KEY = "400";

export interface Incident {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  status: "unverified" | "verified";
  verifiedBy?: UserRole;
  location?: string;
  type: "sos" | "accident" | "medical" | "fire" | "flood";
}

export interface SafeZone {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: "shelter" | "hospital" | "police" | "fire_station";
  distance: string;
}

export const SAFE_ZONES: SafeZone[] = [
  { id: 1, name: "Lonavala Civil Hospital", lat: 18.7557, lng: 73.4091, type: "hospital", distance: "2.1 km" },
  { id: 2, name: "Khopoli Police Station", lat: 18.7876, lng: 73.3443, type: "police", distance: "3.5 km" },
  { id: 3, name: "NH-48 Emergency Shelter", lat: 18.6200, lng: 73.7800, type: "shelter", distance: "1.2 km" },
  { id: 4, name: "Pune Fire Brigade – Unit 5", lat: 18.5204, lng: 73.8567, type: "fire_station", distance: "8.4 km" },
  { id: 5, name: "Yashwantrao Hospital", lat: 18.5074, lng: 73.8077, type: "hospital", distance: "12 km" },
];

export const DEFAULT_CENTER: [number, number] = [18.6012, 73.7634];

export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371, d2r = Math.PI / 180;
  const dLa = (b[0] - a[0]) * d2r, dLn = (b[1] - a[1]) * d2r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * d2r) * Math.cos(b[0] * d2r) * Math.sin(dLn / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
