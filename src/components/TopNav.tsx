import { useAppStore } from "@/stores/appStore";
import { ROLE_CONFIG, type UserRole } from "@/lib/constants";
import { AlertTriangle, Shield, Building2, Route } from "lucide-react";

const roleIcons: Record<UserRole, React.ReactNode> = {
  user: <AlertTriangle size={16} />,
  police: <Shield size={16} />,
  hospital: <Building2 size={16} />,
  nhai: <Route size={16} />,
};

const TopNav = () => {
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const incidents = useAppStore((s) => s.incidents);
  const unverified = incidents.filter((i) => i.status === "unverified").length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <AlertTriangle className="text-primary-foreground" size={20} />
          </div>
          <div>
            <h1 className="text-base font-extrabold leading-none tracking-tight">CrissNet</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Emergency Response</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                role === r
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {roleIcons[r]}
              <span className="hidden sm:inline">{ROLE_CONFIG[r].label}</span>
            </button>
          ))}
        </div>

        {/* Incident Counter */}
        <div className="flex items-center gap-2">
          {unverified > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cn-red-light border border-primary/30">
              <div className="w-2 h-2 rounded-full bg-primary cn-animate-ping" />
              <span className="text-xs font-bold text-primary">{unverified} Active</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground font-medium">
            {incidents.length} total
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
