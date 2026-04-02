import { useState } from "react";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";
import IncidentMap from "@/components/IncidentMap";
import { Shield, CheckCircle, XCircle, Lock, AlertTriangle } from "lucide-react";

const PoliceDashboard = () => {
  const notify = useToastNotify();
  const { incidents, verifyIncident, role } = useAppStore();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState(false);

  const handleVerify = (id: string) => {
    setError(false);
    const success = verifyIncident(id, keyInput, role);
    if (success) {
      notify("✅ Incident Verified!", "Incident marked as verified on map", "ok");
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
        <div className="w-10 h-10 rounded-xl bg-cn-indigo-light flex items-center justify-center">
          <Shield size={22} className="text-cn-indigo" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold">Police Dashboard</h2>
          <p className="text-xs text-muted-foreground">Verify and manage incidents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncidentMap height={450} />
        </div>

        {/* Incident List */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="text-primary" />
              Incident Queue ({incidents.length})
            </h3>
          </div>
          <div className="max-h-[420px] overflow-y-auto cn-hide-scrollbar">
            {incidents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No incidents reported yet</div>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="p-4 border-b border-border hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {inc.status === "verified" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-cn-green bg-cn-green-light px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> VERIFIED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-cn-red-light px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> UNVERIFIED
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">{inc.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        📍 {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        🕐 {new Date(inc.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {inc.status === "unverified" && (
                    <>
                      {verifyingId === inc.id ? (
                        <div className="mt-2 space-y-2 cn-animate-up">
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input
                                type="password"
                                value={keyInput}
                                onChange={(e) => { setKeyInput(e.target.value); setError(false); }}
                                placeholder="Enter key..."
                                className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-secondary border ${error ? "border-primary" : "border-border"} outline-none focus:border-primary/50`}
                              />
                            </div>
                            <button
                              onClick={() => handleVerify(inc.id)}
                              className="px-3 py-2 bg-cn-green text-primary-foreground text-xs font-bold rounded-lg hover:brightness-110 transition"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => { setVerifyingId(null); setKeyInput(""); setError(false); }}
                              className="px-3 py-2 bg-secondary text-muted-foreground text-xs rounded-lg hover:bg-accent transition"
                            >
                              ✕
                            </button>
                          </div>
                          {error && <p className="text-[10px] text-primary font-semibold">Invalid verification key</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => setVerifyingId(inc.id)}
                          className="mt-2 w-full py-2 text-xs font-bold rounded-lg bg-cn-indigo-light text-cn-indigo hover:bg-cn-indigo hover:text-primary-foreground transition-all"
                        >
                          Verify Incident
                        </button>
                      )}
                    </>
                  )}
                  {inc.verifiedBy && (
                    <p className="text-[10px] text-cn-green font-semibold mt-1">Verified by: {inc.verifiedBy}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;
