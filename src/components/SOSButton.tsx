import { useState, useRef } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";

const SOSButton = () => {
  const notify = useToastNotify();
  const { sosState, setSosState, fireSOS, user, myEmergency } = useAppStore();
  const [holdPct, setHoldPct] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = () => {
    if (sosState !== "idle") return;
    setSosState("holding");
    let pct = 0;
    timerRef.current = setInterval(() => {
      pct += 3.5;
      if (pct > 100) pct = 100;
      setHoldPct(pct);
      if (pct >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        doFire();
      }
    }, 100);
  };

  const cancelHold = () => {
    if (sosState !== "holding") return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSosState("idle");
    setHoldPct(0);
  };

  const doFire = () => {
    setSosState("loading");
    notify("📍 Locating you on NH-48…", "GPS capture in progress", "info");
    setTimeout(() => {
      const emg = fireSOS(user?.name || "User");
      if (!emg) {
        notify("No ambulance available", "Please call 112 directly", "err");
        setSosState("idle");
        setHoldPct(0);
        return;
      }
      notify("🚑 Ambulance Dispatched!", `${emg.ambulanceName} · ${emg.distance} km · ETA ${emg.eta} min`, "ok");
    }, 2200);
  };

  const circumference = 2 * Math.PI * 106;

  return (
    <div className="flex flex-col items-center py-3">
      <div className="relative w-[240px] h-[240px] flex items-center justify-center">
        {sosState === "idle" && (
          <>
            <div className="absolute rounded-full pointer-events-none cn-animate-pulse-ring" style={{ width: 226, height: 226, background: "rgba(220,38,38,.07)" }} />
            <div className="absolute rounded-full pointer-events-none" style={{ width: 196, height: 196, background: "rgba(220,38,38,.09)", animation: "cn-pulse-ring 2.5s .7s ease infinite" }} />
          </>
        )}
        {sosState === "holding" && (
          <svg className="absolute" style={{ width: 228, height: 228, transform: "rotate(-90deg)" }} viewBox="0 0 228 228">
            <circle cx="114" cy="114" r="106" fill="none" stroke="hsl(var(--cn-red-light))" strokeWidth="8" />
            <circle cx="114" cy="114" r="106" fill="none" stroke="hsl(var(--cn-red))" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - holdPct / 100)} />
          </svg>
        )}
        <button
          onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(); }} onTouchEnd={cancelHold}
          className={`w-[180px] h-[180px] rounded-full border-none relative z-10 flex flex-col items-center justify-center transition-transform active:scale-95 ${sosState === "activated" ? "" : "cn-animate-sos-glow"}`}
          style={{
            background: sosState === "activated" ? "linear-gradient(145deg,#065F46,#059669)" : "linear-gradient(145deg,#EF4444,#B91C1C,#991B1B)",
            color: "#fff",
            boxShadow: sosState === "activated" ? "0 8px 40px rgba(5,150,105,.5)" : undefined,
            animation: sosState === "activated" ? "none" : undefined,
          }}
          disabled={sosState === "loading" || sosState === "activated"}
        >
          {sosState === "loading" ? (
            <>
              <div className="w-[30px] h-[30px] border-[3px] rounded-full cn-animate-spin" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} />
              <div className="text-[11px] font-bold tracking-[2px] mt-2" style={{ color: "rgba(255,255,255,.9)" }}>LOCATING…</div>
            </>
          ) : sosState === "activated" ? (
            <>
              <div className="text-[38px]">✅</div>
              <div className="text-[19px] font-extrabold mt-1">SENT!</div>
            </>
          ) : (
            <>
              <div className="text-[52px] font-black tracking-[3px] leading-none">SOS</div>
              <div className="text-[11px] font-bold tracking-[2px] mt-1" style={{ color: "rgba(255,255,255,.9)" }}>
                {sosState === "holding" ? `${Math.round(holdPct)}%` : "HOLD TO ACTIVATE"}
              </div>
            </>
          )}
        </button>
      </div>
      <div className="text-center text-sm text-muted-foreground mt-2 px-7 leading-relaxed">
        Emergency services will be notified<br />of your exact GPS location on NH-48
      </div>
    </div>
  );
};

export default SOSButton;
