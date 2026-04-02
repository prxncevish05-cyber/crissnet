import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";
import IncidentMap from "@/components/IncidentMap";
import { Route, CheckCircle, XCircle, Lock, Construction, AlertTriangle } from "lucide-react";

const roadAlerts = [
  { id: 1, title: "Lane 2 blocked near Khopoli Exit", severity: "high", time: "12 min ago" },
  { id: 2, title: "Speed limit 60 km/h enforced near accident zone", severity: "medium", time: "35 min ago" },
  { id: 3, title: "Emergency lane cleared near Borghat section", severity: "low", time: "1 hr ago" },
  { id: 4, title: "Construction work at Kamshet toll — expect delays", severity: "medium", time: "2 hrs ago" },
];

const NHAIDashboard = () => {
  const notify = useToastNotify();
  const { incidents, verifyIncident, role } = useAppStore();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState(false);

  const handleVerify = (id: string) => {
    setError(false);
    const success = verifyIncident(id, keyInput, role);
    if (success) {
      notify("✅ Incident Verified!", "Road alert updated", "ok");
      setVerifyingId(null);
      setKeyInput("");
    } else {
      setError(true);
      notify("❌ Invalid Key", "Verification key is incorrect", "err");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 cn-animate-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-cn-amber-light flex items-center justify-center">
          <Route size={22} className="text-cn-amber" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold">NHAI Dashboard</h2>
          <p className="text-xs text-muted-foreground">Road & highway incident management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncidentMap height={400} />
        </div>

        <div className="space-y-4">
          {/* Road Alerts */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Construction size={16} className="text-cn-amber" />
                Road / Block Alerts
              </h3>
            </div>
            <div className="max-h-[200px] overflow-y-auto cn-hide-scrollbar">
              {roadAlerts.map((a) => (
                <div key={a.id} className="p-3 border-b border-border flex items-start gap-2.5">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${a.severity === "high" ? "bg-primary" : a.severity === "medium" ? "bg-cn-amber" : "bg-cn-green"}`} />
                  <div>
                    <p className="text-xs font-semibold">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Verification */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle size={16} className="text-primary" />
                Incidents ({incidents.length})
              </h3>
            </div>
            <div className="max-h-[250px] overflow-y-auto cn-hide-scrollbar">
              {incidents.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No incidents</div>
              ) : (
                incidents.map((inc) => (
                  <div key={inc.id} className="p-3 border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                      {inc.status === "verified" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-cn-green bg-cn-green-light px-2 py-0.5 rounded-full"><CheckCircle size={10} /> VERIFIED</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-cn-red-light px-2 py-0.5 rounded-full"><XCircle size={10} /> UNVERIFIED</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">📍 {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)} · {new Date(inc.timestamp).toLocaleTimeString()}</p>

                    {inc.status === "unverified" && (
                      verifyingId === inc.id ? (
                        <div className="mt-2 flex gap-2 cn-animate-up">
                          <div className="flex-1 relative">
                            <Lock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input type="password" value={keyInput} onChange={(e) => { setKeyInput(e.target.value); setError(false); }}
                              placeholder="Key..." className={`w-full pl-7 pr-2 py-1.5 text-[11px] rounded-lg bg-secondary border ${error ? "border-primary" : "border-border"} outline-none`} />
                          </div>
                          <button onClick={() => handleVerify(inc.id)} className="px-2 py-1.5 bg-cn-green text-primary-foreground text-[11px] font-bold rounded-lg">✓</button>
                          <button onClick={() => { setVerifyingId(null); setKeyInput(""); }} className="px-2 py-1.5 bg-secondary text-muted-foreground text-[11px] rounded-lg">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setVerifyingId(inc.id)} className="mt-1.5 w-full py-1.5 text-[11px] font-bold rounded-lg bg-cn-amber-light text-cn-amber hover:bg-cn-amber hover:text-primary-foreground transition-all">
                          Verify
                        </button>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NHAIDashboard;
