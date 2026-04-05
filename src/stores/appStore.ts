import { create } from "zustand";
import {
  type UserRole, type Ambulance, type NewsItem, type Emergency,
  INITIAL_AMBULANCES, INITIAL_NEWS, INITIAL_EMERGENCIES,
  AMB_START, PATIENT_COORD, haversine,
} from "@/lib/constants";

interface User {
  role: UserRole;
  name: string;
  phone: string;
  avatar: string;
}

interface AppState {
  user: User | null;
  ambulances: Ambulance[];
  news: NewsItem[];
  emergencies: Emergency[];
  myEmergency: Emergency | null;
  ambStatus: "assigned" | "accepted" | "resolved";
  ambCurrentPos: [number, number];
  sosState: "idle" | "holding" | "loading" | "activated";
  sosVideoUrl: string | null;
  incidentVerdict: "pending" | "real" | "fake";
  userLocation: [number, number] | null;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  fireSOS: (userName: string) => Emergency | null;
  setSosState: (s: AppState["sosState"]) => void;
  acceptRequest: () => void;
  markReached: () => void;
  setAmbPos: (pos: [number, number]) => void;
  setUserLocation: (pos: [number, number]) => void;
  verifyNews: (id: number, role: string) => void;
  flagNews: (id: number) => void;
  unflagNews: (id: number) => void;
  postNews: (title: string, role: string) => void;
  setSosVideoUrl: (url: string | null) => void;
  setIncidentVerdict: (v: "pending" | "real" | "fake") => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  ambulances: [...INITIAL_AMBULANCES],
  news: [...INITIAL_NEWS],
  emergencies: [...INITIAL_EMERGENCIES],
  myEmergency: null,
  ambStatus: "assigned",
  ambCurrentPos: [...AMB_START],
  sosState: "idle",
  sosVideoUrl: null,
  incidentVerdict: "pending",
  userLocation: null,

  login: (user) => set({ user }),
  logout: () => set((s) => ({
    user: null,
    myEmergency: null,
    ambStatus: s.ambStatus,
    ambCurrentPos: s.ambCurrentPos,
    sosState: "idle",
    sosVideoUrl: s.sosVideoUrl,
    incidentVerdict: s.incidentVerdict,
  })),

  fireSOS: (userName) => {
    const { ambulances } = get();
    const avail = ambulances.filter((a) => a.available);
    if (!avail.length) return null;
    const best = avail.reduce((a, b) =>
      haversine(PATIENT_COORD, [a.lat, a.lng]) < haversine(PATIENT_COORD, [b.lat, b.lng]) ? a : b
    );
    const dist = haversine(PATIENT_COORD, [best.lat, best.lng]).toFixed(1);
    const eta = Math.ceil(parseFloat(dist) / 0.5);
    const emg: Emergency = {
      id: Date.now(), userName, lat: PATIENT_COORD[0], lng: PATIENT_COORD[1],
      location: "Mumbai-Pune Expressway, NH-48, Khopoli Exit",
      status: "assigned", ambulanceId: best.id, ambulanceName: best.name,
      severity: "critical", distance: dist, eta, time: "Just now",
    };
    set((s) => ({
      ambulances: s.ambulances.map((a) => a.id === best.id ? { ...a, available: false } : a),
      emergencies: [emg, ...s.emergencies],
      myEmergency: emg,
      sosState: "activated",
    }));
    return emg;
  },

  setSosState: (sosState) => set({ sosState }),

  acceptRequest: () => set((s) => ({
    ambStatus: "accepted",
    ambulances: s.ambulances.map((a, i) => i === 0 ? { ...a, available: false } : a),
    emergencies: s.emergencies.map((e, i) => i === 0 ? { ...e, status: "accepted" } : e),
  })),

  markReached: () => set((s) => ({
    ambStatus: "resolved",
    ambulances: s.ambulances.map((a, i) => i === 0 ? { ...a, available: true } : a),
    emergencies: s.emergencies.map((e, i) => i === 0 ? { ...e, status: "resolved" } : e),
  })),

  setAmbPos: (pos) => set({ ambCurrentPos: pos }),
  setUserLocation: (pos) => set({ userLocation: pos }),

  verifyNews: (id, role) => set((s) => ({
    news: s.news.map((n) => n.id === id ? { ...n, ver: role, flag: false } : n),
  })),
  flagNews: (id) => set((s) => ({
    news: s.news.map((n) => n.id === id ? { ...n, flag: true, ver: null } : n),
  })),
  unflagNews: (id) => set((s) => ({
    news: s.news.map((n) => n.id === id ? { ...n, flag: false } : n),
  })),
  postNews: (title, role) => set((s) => ({
    news: [{ id: Date.now(), title, src: `Official: ${role}`, sum: title, time: "Just now", cat: "official", ver: role, flag: false, votes: 0 }, ...s.news],
  })),
  setSosVideoUrl: (url) => set({ sosVideoUrl: url }),
  setIncidentVerdict: (v) => set({ incidentVerdict: v }),
}));
