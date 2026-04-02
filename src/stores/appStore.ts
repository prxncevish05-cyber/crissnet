import { create } from "zustand";
import { type UserRole, type Incident, VERIFICATION_KEY } from "@/lib/constants";

interface AppState {
  role: UserRole;
  incidents: Incident[];
  sosLoading: boolean;
  lastLocation: [number, number] | null;

  setRole: (role: UserRole) => void;
  addIncident: (incident: Incident) => void;
  verifyIncident: (id: string, key: string, role: UserRole) => boolean;
  setSosLoading: (v: boolean) => void;
  setLastLocation: (pos: [number, number]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  role: "user",
  incidents: [],
  sosLoading: false,
  lastLocation: null,

  setRole: (role) => set({ role }),

  addIncident: (incident) => set((s) => ({
    incidents: [incident, ...s.incidents],
  })),

  verifyIncident: (id, key, role) => {
    if (key !== VERIFICATION_KEY) return false;
    set((s) => ({
      incidents: s.incidents.map((inc) =>
        inc.id === id ? { ...inc, status: "verified" as const, verifiedBy: role } : inc
      ),
    }));
    return true;
  },

  setSosLoading: (sosLoading) => set({ sosLoading }),
  setLastLocation: (lastLocation) => set({ lastLocation }),
}));
