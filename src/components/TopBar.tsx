import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { ROLE_CONFIG } from "@/lib/constants";

interface TopBarProps {
  onMenuOpen: () => void;
}

const TopBar = ({ onMenuOpen }: TopBarProps) => {
  const user = useAppStore((s) => s.user);
  if (!user) return null;
  const rc = ROLE_CONFIG[user.role];

  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50" style={{ boxShadow: "0 2px 6px rgba(0,0,0,.05)" }}>
      <div className="flex items-center gap-3">
        <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-lg" style={{ background: rc.grad }}>{rc.icon}</div>
        <div><div className="text-xl font-extrabold leading-none">CrissNet</div><div className="text-[11px] text-muted-foreground mt-0.5">Mumbai-Pune NH-48</div></div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: rc.bg, border: `1.5px solid ${rc.bdr}`, color: rc.color }}>
          {user.avatar}
        </div>
        <button onClick={onMenuOpen} className="w-10 h-10 rounded-[10px] bg-cn-gray-0 border-[1.5px] border-cn-gray-2 flex flex-col items-center justify-center gap-1 p-0">
          <span className="block bg-cn-gray-7 rounded-sm h-0.5 w-4" />
          <span className="block bg-cn-gray-7 rounded-sm h-0.5 w-3" />
          <span className="block bg-cn-gray-7 rounded-sm h-0.5 w-4" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
