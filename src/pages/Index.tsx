import { useAppStore } from "@/stores/appStore";
import LoginPage from "@/components/LoginPage";
import PublicDashboard from "@/components/PublicDashboard";
import AmbulanceDashboard from "@/components/AmbulanceDashboard";
import AuthorityDashboard from "@/components/AuthorityDashboard";

const Index = () => {
  const user = useAppStore((s) => s.user);

  if (!user) return <LoginPage />;
  if (user.role === "public") return <PublicDashboard />;
  if (user.role === "ambulance") return <AmbulanceDashboard />;
  return <AuthorityDashboard />;
};

export default Index;
