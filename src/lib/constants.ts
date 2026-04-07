export type UserRole = "public" | "ambulance" | "police" | "hospital" | "nhai";

export interface RoleConfig {
  label: string;
  icon: string;
  color: string;
  grad: string;
  bg: string;
  bdr: string;
}

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  public:    { label: "Public User", icon: "👤", color: "#3B82F6", grad: "linear-gradient(135deg,#1D4ED8,#3B82F6)", bg: "#EFF6FF", bdr: "#BFDBFE" },
  ambulance: { label: "Ambulance",   icon: "🚑", color: "#DC2626", grad: "linear-gradient(135deg,#DC2626,#EF4444)", bg: "#FEF2F2", bdr: "#FECACA" },
  police:    { label: "Police",      icon: "🚓", color: "#6366F1", grad: "linear-gradient(135deg,#4338CA,#6366F1)", bg: "#EEF2FF", bdr: "#C7D2FE" },
  hospital:  { label: "Hospital",    icon: "🏥", color: "#059669", grad: "linear-gradient(135deg,#065F46,#059669)", bg: "#ECFDF5", bdr: "#A7F3D0" },
  nhai:      { label: "NHAI",        icon: "🛣️", color: "#D97706", grad: "linear-gradient(135deg,#92400E,#D97706)", bg: "#FFFBEB", bdr: "#FDE68A" },
};

export const PATIENT_COORD: [number, number] = [18.6012, 73.7634];
export const AMB_START: [number, number] = [18.6340, 73.8020];

export interface Ambulance {
  id: number;
  name: string;
  lat: number;
  lng: number;
  available: boolean;
}

export const INITIAL_AMBULANCES: Ambulance[] = [
  { id: 2, name: "Ambulance Unit-1", lat: 18.612, lng: 73.775, available: true },
  { id: 3, name: "Ambulance Unit-2", lat: 18.590, lng: 73.750, available: true },
];

export interface NewsItem {
  id: number;
  title: string;
  src: string;
  sum: string;
  time: string;
  cat: string;
  ver: string | null;
  flag: boolean;
  votes: number;
}

export const INITIAL_NEWS: NewsItem[] = [
  { id: 1, title: "Multi-vehicle pile-up on Mumbai-Pune Expressway NH-48", src: "Times of India", sum: "3 vehicles collided near Khopoli exit. Lane 2 blocked. Emergency services deployed.", time: "8 min ago", cat: "accident", ver: null, flag: false, votes: 47 },
  { id: 2, title: "IMD heavy rain warning for Pune–Mumbai corridor", src: "NDTV", sum: "Yellow alert for 48 hrs. Motorists advised to slow down on all expressways.", time: "22 min ago", cat: "weather", ver: "hospital", flag: false, votes: 83 },
  { id: 3, title: "FAKE: NH-48 fully closed near Lonavala", src: "WhatsApp Forward", sum: "Viral closure claim is FALSE. Only partial slowdown near toll plaza.", time: "45 min ago", cat: "misinformation", ver: null, flag: true, votes: 6 },
  { id: 4, title: "Emergency lane cleared near Borghat section", src: "NHAI Control", sum: "NHAI teams cleared emergency lane. All vehicles must stay left.", time: "1 hr ago", cat: "road", ver: "nhai", flag: false, votes: 61 },
  { id: 5, title: "O- blood urgently needed — Yashwantrao Hospital, Pune", src: "Health Ministry", sum: "Critical shortage of O-negative blood group. Please donate.", time: "2 hrs ago", cat: "health", ver: "hospital", flag: false, votes: 156 },
  { id: 6, title: "UNVERIFIED: Chemical tanker overturned at Khalapur", src: "Local Report", sum: "Unconfirmed reports of spill near Khalapur toll. Authorities investigating.", time: "3 hrs ago", cat: "hazmat", ver: null, flag: false, votes: 19 },
  { id: 7, title: "Speed limit 60 km/h enforced near accident zone", src: "NHAI Official", sum: "Dynamic speed limit signs activated for 5 km on NH-48.", time: "35 min ago", cat: "road", ver: "nhai", flag: false, votes: 44 },
];

export interface Emergency {
  id: number;
  userName: string;
  location: string;
  status: string;
  ambulanceId: number;
  ambulanceName?: string;
  severity: string;
  time: string;
  lat: number;
  lng: number;
  distance: string;
  eta: number;
}

export const INITIAL_EMERGENCIES: Emergency[] = [];

export function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371, d2r = Math.PI / 180;
  const dLa = (b[0] - a[0]) * d2r, dLn = (b[1] - a[1]) * d2r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * d2r) * Math.cos(b[0] * d2r) * Math.sin(dLn / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export const CAT_COLORS: Record<string, string> = {
  accident: "#DC2626", weather: "#3B82F6", road: "#D97706",
  health: "#059669", hazmat: "#7C3AED", misinformation: "#6B7280", official: "#374151",
};
