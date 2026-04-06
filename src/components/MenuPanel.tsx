import { useAppStore } from "@/stores/appStore";
import { ROLE_CONFIG } from "@/lib/constants";
import { useToastNotify } from "@/hooks/useToastNotify";
import { supabase } from "@/integrations/supabase/client";

interface MenuPanelProps {
  open: boolean;
  onClose: () => void;
}

const MenuPanel = ({ open, onClose }: MenuPanelProps) => {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const notify = useToastNotify();

  if (!open || !user) return null;
  const rc = ROLE_CONFIG[user.role];

  const items = [
    { icon: "🏠", label: "Dashboard", action: onClose },
    { icon: "🔔", label: "Notifications", action: () => { notify("No new notifications", "All systems clear", "info"); onClose(); } },
    { icon: "⚙️", label: "Settings", action: () => { notify("Settings", "Feature coming soon", "info"); onClose(); } },
    { icon: "🆘", label: "Call 112", action: () => { notify("📞 Emergency: 112", "National Emergency Helpline", "err"); onClose(); } },
    { icon: "ℹ️", label: "About CrissNet", action: () => { notify("CrissNet v5", "Rapid Disaster Response · NH-48", "info"); onClose(); } },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[800] cn-animate-fade" onClick={onClose} />
      <div className="fixed top-0 right-0 w-[280px] h-screen bg-card z-[900] flex flex-col cn-animate-slide" style={{ boxShadow: "-6px 0 40px rgba(0,0,0,.2)" }}>
        <div className="px-4 pt-11 pb-5 relative" style={{ background: rc.grad }}>
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold leading-none" style={{ background: "rgba(255,255,255,.22)", color: "#fff", border: "none" }}>✕</button>
          <div className="flex items-center gap-3">
            <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "rgba(255,255,255,.22)", border: "2px solid rgba(255,255,255,.4)", color: "#fff" }}>{user.avatar}</div>
            <div>
              <div className="font-bold text-base" style={{ color: "#fff" }}>{user.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,.8)" }}>{rc.icon} {rc.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,.6)" }}>📞 +91 {user.phone}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {items.map((item) => (
            <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-cn-gray-7 hover:bg-cn-gray-0 text-left">
              <span className="text-lg w-6 text-center">{item.icon}</span>{item.label}
            </button>
          ))}
          <button onClick={async () => { onClose(); await supabase.auth.signOut(); logout(); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-cn-red text-left">
            <span className="text-lg w-6 text-center">🚪</span>Logout
          </button>
        </div>
        <div className="px-5 py-3 border-t border-cn-gray-1 text-[11px] text-muted-foreground text-center">CrissNet v5 · Emergency Helpline: 112</div>
      </div>
    </>
  );
};

export default MenuPanel;
