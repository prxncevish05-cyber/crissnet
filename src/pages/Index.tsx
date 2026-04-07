import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/components/LoginPage";
import PublicDashboard from "@/components/PublicDashboard";
import AmbulanceDashboard from "@/components/AmbulanceDashboard";
import AuthorityDashboard from "@/components/AuthorityDashboard";

const Index = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F172A" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] rounded-full cn-animate-spin mx-auto mb-3" style={{ borderColor: "rgba(255,255,255,.2)", borderTopColor: "#DC2626" }} />
          <div className="text-sm font-bold" style={{ color: "rgba(255,255,255,.6)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (user.role === "public") return <PublicDashboard />;
  if (user.role === "ambulance") return <AmbulanceDashboard />;
  return <AuthorityDashboard />;
};

export default Index;
