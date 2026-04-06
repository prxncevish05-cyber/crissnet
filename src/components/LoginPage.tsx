import { useState, useRef } from "react";
import { ROLE_CONFIG, type UserRole } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";
import { useToastNotify } from "@/hooks/useToastNotify";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const notify = useToastNotify();
  const login = useAppStore((s) => s.login);
  const [role, setRole] = useState<UserRole>("public");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const roles: UserRole[] = ["public", "ambulance", "police", "hospital", "nhai"];

  // Use phone as email: phone@crissnet.app
  const phoneToEmail = (p: string) => `${p}@crissnet.app`;

  const handleSendOTP = async () => {
    if (phone.length < 10) { notify("Invalid number", "Please enter a valid 10-digit mobile number", "err"); return; }
    if (!name.trim()) { notify("Name required", "Please enter your full name", "err"); return; }
    setSending(true);
    setSent(false);
    setOtpValues(["", "", "", "", "", ""]);
    setStep("otp");

    try {
      const email = phoneToEmail(phone);
      // Try signup first, if user exists it will fail, then we sign in
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: `CrissNet@${phone}#2024`,
      });

      // If user already exists, that's fine — we'll sign in during verify
      if (signUpError && !signUpError.message.includes("already registered")) {
        console.log("Signup note:", signUpError.message);
      }
    } catch (err) {
      console.error("Auth error:", err);
    }

    setTimeout(() => {
      setSending(false);
      setSent(true);
      notify("OTP Sent to +91 " + phone, "Enter the 6-digit code below", "ok");
      otpRefs.current[0]?.focus();
    }, 1500);
  };

  const handleOtpChange = (idx: number, val: string) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpValues];
    newOtp[idx] = v;
    setOtpValues(newOtp);
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus();
    const code = newOtp.join("");
    if (code.length === 6) setTimeout(() => verifyOTP(code), 400);
  };

  const handleOtpKeyDown = (idx: number, key: string) => {
    if (key === "Backspace" && !otpValues[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const verifyOTP = async (code?: string) => {
    const c = code || otpValues.join("");
    if (c.length < 6) return;
    if (c !== "123456") {
      notify("Incorrect OTP", "The correct code is 1-2-3-4-5-6", "err");
      setOtpValues(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      return;
    }

    setLoading(true);
    try {
      const email = phoneToEmail(phone);
      const password = `CrissNet@${phone}#2024`;

      // Sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, try signup + signin
        await supabase.auth.signUp({ email, password });
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password });
        if (retryError) {
          notify("Login Failed", retryError.message, "err");
          setLoading(false);
          return;
        }
        if (retryData.user) {
          await upsertProfile(retryData.user.id);
        }
      } else if (signInData.user) {
        await upsertProfile(signInData.user.id);
      }
    } catch (err) {
      console.error("Login error:", err);
      notify("Error", "Something went wrong", "err");
    }
    setLoading(false);
  };

  const upsertProfile = async (userId: string) => {
    const av = name.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "??";

    // Check if profile exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Update role/name if needed
      await supabase
        .from("profiles")
        .update({ name: name.trim(), role: role, phone })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("profiles")
        .insert({ user_id: userId, name: name.trim(), phone, role, avatar: av });
    }

    login({ role, name: name.trim(), phone, avatar: av });
    notify("Welcome, " + name + "!", "Logged in as " + ROLE_CONFIG[role].label + " 🎉", "ok");
  };

  const rc = ROLE_CONFIG[role];

  return (
    <div className="min-h-screen flex items-center justify-center p-5 overflow-hidden relative"
      style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E293B 55%,#1D4ED8 100%)" }}>
      <div className="absolute inset-0" style={{
        background: "radial-gradient(circle at 20% 50%,rgba(220,38,38,.08),transparent 50%),radial-gradient(circle at 80% 20%,rgba(29,78,216,.08),transparent 50%)"
      }} />
      <div className="w-full max-w-[950px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Hero (hidden on mobile) */}
        <div className="hidden md:block text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5"
            style={{ background: "rgba(220,38,38,.15)", border: "1px solid rgba(220,38,38,.35)", color: "#FCA5A5" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-cn-red" /> Live Emergency System
          </div>
          <h1 className="text-[46px] font-extrabold leading-[1.1] mb-3.5">
            Rapid Disaster<br /><span className="text-cn-red">Response</span> Hub
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#94A3B8" }}>
            CrissNet connects the public, ambulances, police, hospitals & NHAI on a real-time platform — reducing response time and fighting misinformation on NH-48.
          </p>
          <div className="flex gap-6 mb-6">
            {[["112+", "Emergencies"], ["3.2m", "Avg Response"], ["98%", "Accuracy"]].map(([n, l]) => (
              <div key={l}><div className="text-[28px] font-extrabold">{n}</div><div className="text-[11px]" style={{ color: "#64748B" }}>{l}</div></div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {roles.map((r) => (
              <span key={r} className="px-3 py-1 rounded-full text-xs" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)" }}>
                {ROLE_CONFIG[r].icon} {ROLE_CONFIG[r].label}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-[22px] p-7 cn-animate-up" style={{ boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>
          {step === "form" ? (
            <>
              <div className="text-[26px] font-extrabold mb-1">🔐 Sign In</div>
              <div className="text-sm text-muted-foreground mb-5">Select your role and enter your details</div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-cn-gray-7 mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {roles.map((r) => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`p-3 rounded-[11px] border-2 text-center transition-all ${role === r ? "border-cn-red bg-cn-red-light" : "border-cn-gray-2 bg-card"}`}>
                    <span className="block text-[22px]">{ROLE_CONFIG[r].icon}</span>
                    <span className={`block text-xs font-bold ${role === r ? "text-cn-red" : "text-cn-gray-7"}`}>{ROLE_CONFIG[r].label}</span>
                  </button>
                ))}
              </div>
              <div className="mb-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cn-gray-7 mb-1.5">Your Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-cn-gray-2 rounded-[10px] text-[15px] outline-none focus:border-cn-red focus:ring-2 focus:ring-cn-red/10 bg-card"
                  placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="mb-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cn-gray-7 mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="px-3.5 py-2.5 bg-cn-gray-0 rounded-[10px] font-bold text-cn-gray-5 border-[1.5px] border-cn-gray-2 text-sm flex items-center">+91</div>
                  <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 px-3.5 py-2.5 border-[1.5px] border-cn-gray-2 rounded-[10px] text-[15px] outline-none focus:border-cn-red focus:ring-2 focus:ring-cn-red/10 bg-card"
                    type="tel" maxLength={10} placeholder="9876543210" />
                </div>
              </div>
              <button onClick={handleSendOTP} className="w-full py-3.5 rounded-[11px] text-base font-bold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: rc.grad }}>📱 Send OTP</button>
              <div className="text-center text-[11px] text-muted-foreground mt-2">Demo: any 10-digit number · OTP will be <strong>1 2 3 4 5 6</strong></div>
            </>
          ) : (
            <>
              <button onClick={() => { setStep("form"); setOtpValues(["","","","","",""]); setSending(false); setSent(false); }}
                className="text-muted-foreground text-sm mb-3.5 flex items-center gap-1 hover:text-foreground">← Change details</button>
              <div className="text-[26px] font-extrabold mb-3">📲 Verify OTP</div>
              {sending && (
                <div className="flex items-center gap-2.5 p-3 rounded-[10px] mb-3.5" style={{ background: "#FFF5F5", border: "1px solid #FECACA" }}>
                  <span className="text-[22px]">📱</span>
                  <div className="flex-1"><div className="font-semibold text-sm text-cn-red">Sending OTP…</div><div className="text-xs text-cn-gray-5">+91 {phone}</div></div>
                  <div className="w-5 h-5 border-2 border-cn-red-light border-t-cn-red rounded-full cn-animate-spin" />
                </div>
              )}
              {sent && !sending && (
                <div className="flex items-center gap-2.5 p-3 rounded-[10px] mb-3.5" style={{ background: "#F0FDF4", border: "1px solid #86EFAC" }}>
                  <span className="text-[22px]">✅</span>
                  <div><div className="font-bold text-sm text-cn-green">OTP Delivered!</div><div className="text-xs text-cn-gray-5">+91 {phone}</div></div>
                </div>
              )}
              <div className="text-center text-sm text-cn-gray-5 mb-1">Enter the 6-digit code</div>
              <div className="flex gap-2 justify-center my-4">
                {otpValues.map((v, i) => (
                  <input key={i} ref={(el) => { otpRefs.current[i] = el; }}
                    value={v} maxLength={1} inputMode="numeric"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e.key)}
                    className={`w-12 h-14 border-[2.5px] rounded-[11px] text-center text-[22px] font-bold outline-none transition-all bg-card ${v ? "border-cn-green bg-cn-green-light" : "border-cn-gray-2"} focus:border-cn-red focus:ring-2 focus:ring-cn-red/10`}
                  />
                ))}
              </div>
              <button onClick={() => verifyOTP()} disabled={loading}
                className="w-full py-3.5 rounded-[11px] text-base font-bold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: rc.grad }}>
                {loading ? "Signing in…" : "✅ Verify & Enter Dashboard"}
              </button>
              <div className="text-center text-[11px] text-muted-foreground mt-2.5">Demo OTP: <strong className="text-cn-red text-[15px] tracking-[4px]">1 2 3 4 5 6</strong></div>
              <div className="text-center mt-3">
                <button onClick={() => { setSending(true); setSent(false); setOtpValues(["","","","","",""]); setTimeout(() => { setSending(false); setSent(true); notify("OTP Resent", "Enter the 6-digit code", "ok"); otpRefs.current[0]?.focus(); }, 1500); }}
                  className="text-cn-blue text-sm font-semibold underline">🔄 Resend OTP</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
